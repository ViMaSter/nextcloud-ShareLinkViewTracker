import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { summarizeAuditFix } from './npm-audit-fix.mjs'

function report(counts = {}) {
	return {
		audit: {
			auditReportVersion: 2,
			vulnerabilities: {},
			metadata: {
				vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0, ...counts },
			},
		},
	}
}

function result(data = report(), status = 0) {
	return { stdout: JSON.stringify(data), status, signal: null }
}

test('reports a clean audit', () => {
	const summary = summarizeAuditFix(result())
	assert.equal(summary.remaining, 0)
	assert.match(summary.markdown, /no remaining vulnerabilities/)
})

test('reports remaining advisories without traversing circular dependency references', () => {
	const data = report({ moderate: 2, total: 2 })
	data.audit.vulnerabilities = {
		'@nextcloud/files': { fixAvailable: true, isDirect: false, via: ['@nextcloud/sharing'] },
		'@nextcloud/sharing': { fixAvailable: true, isDirect: false, via: ['@nextcloud/files'] },
	}
	const summary = summarizeAuditFix(result(data, 1))
	assert.equal(summary.remaining, 2)
	assert.match(summary.markdown, /\| moderate \| 2 \|/)
	assert.match(summary.markdown, /not a clean audit/)
})

test('does not treat npm errors as advisory-only exits', () => {
	for (const status of [0, 1]) {
		assert.throws(() => summarizeAuditFix(result({ error: { code: 'ENOAUDIT', summary: 'Registry unavailable' } }, status)), /ENOAUDIT/)
	}
	assert.throws(() => summarizeAuditFix(result(report(), 1)), /without reporting remaining vulnerabilities/)
	assert.throws(() => summarizeAuditFix(result(report({ high: 1, total: 1 }), 2)), /exit 2/)
})

test('rejects missing, invalid and inconsistent audit reports', () => {
	for (const data of [null, {}, { audit: {} }, report({ high: -1, total: -1 }), report({ total: 1 }), report({ total: '0' })]) {
		assert.throws(() => summarizeAuditFix(result(data, 1)), /invalid audit report/)
	}
	assert.throws(() => summarizeAuditFix({ stdout: 'not JSON', status: 1 }), SyntaxError)
})

test('surfaces spawn errors and signals', () => {
	const error = new Error('npm not found')
	assert.throws(() => summarizeAuditFix({ error }), candidate => candidate === error)
	assert.throws(() => summarizeAuditFix({ signal: 'SIGTERM', status: null }), /SIGTERM/)
})

test('CLI uses safe fix flags, reports warnings and propagates operational failures', async context => {
	const root = await mkdtemp(join(tmpdir(), 'sharelinkviewtracker-audit-'))
	context.after(() => rm(root, { recursive: true, force: true }))
	await writeFile(join(root, 'npm'), `#!/usr/bin/env node
const assert = require('node:assert/strict')
assert.deepEqual(process.argv.slice(2), ['audit', 'fix', '--package-lock-only', '--ignore-scripts', '--json'])
process.stdout.write(process.env.AUDIT_RESPONSE)
process.stderr.write('npm diagnostic\\n')
process.exit(Number(process.env.AUDIT_STATUS))
`, { mode: 0o755 })
	const script = fileURLToPath(new URL('./npm-audit-fix.mjs', import.meta.url))
	const run = (data, status) => spawnSync(process.execPath, [script], {
		cwd: root,
		encoding: 'utf8',
		env: { ...process.env, PATH: `${root}:${process.env.PATH}`, AUDIT_RESPONSE: JSON.stringify(data), AUDIT_STATUS: String(status) },
	})
	const clean = run(report(), 0)
	assert.equal(clean.status, 0, clean.stderr)
	assert.doesNotMatch(clean.stderr, /::warning::/)
	const remaining = run(report({ high: 1, total: 1 }), 1)
	assert.equal(remaining.status, 0, remaining.stderr)
	assert.match(remaining.stdout, /not a clean audit/)
	assert.match(remaining.stderr, /npm diagnostic/)
	assert.match(remaining.stderr, /::warning::npm audit still reports 1 vulnerabilities/)
	const failed = run({ error: { code: 'ERESOLVE' } }, 1)
	assert.notEqual(failed.status, 0)
	assert.equal(failed.stdout, '')
	assert.match(failed.stderr, /ERESOLVE/)
})
