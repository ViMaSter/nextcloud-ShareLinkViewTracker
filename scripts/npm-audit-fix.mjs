import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const severities = ['info', 'low', 'moderate', 'high', 'critical']

export function summarizeAuditFix(result) {
	if (result.error) {
		throw result.error
	}
	if (result.signal || ![0, 1].includes(result.status)) {
		throw new Error(`npm audit fix failed: ${result.signal || `exit ${result.status}`}`)
	}

	const data = JSON.parse(result.stdout)
	if (data?.error) {
		throw new Error(`npm audit fix failed: ${JSON.stringify(data.error)}`)
	}
	const counts = data?.audit?.metadata?.vulnerabilities
	if (data?.audit?.auditReportVersion !== 2
		|| !counts
		|| ![...severities, 'total'].every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0)
		|| severities.reduce((sum, severity) => sum + counts[severity], 0) !== counts.total) {
		throw new Error('npm audit fix returned an invalid audit report')
	}
	// npm exits 1 for remaining advisories, but other failures must stop the workflow.
	if (result.status === 1 && counts.total === 0) {
		throw new Error('npm audit fix exited 1 without reporting remaining vulnerabilities')
	}

	return {
		remaining: counts.total,
		markdown: [
			'# npm audit fix',
			'',
			'Ran `npm audit fix --package-lock-only --ignore-scripts` without `--force`.',
			'The pull request contains the resulting lockfile changes; major upgrades are not forced.',
			'',
			'## Remaining vulnerabilities',
			'',
			'| Severity | Count |',
			'| --- | ---: |',
			...severities.map(severity => `| ${severity} | ${counts[severity]} |`),
			`| **Total** | **${counts.total}** |`,
			'',
			counts.total === 0
				? 'npm reports no remaining vulnerabilities.'
				: 'Remaining vulnerabilities need manual review. Run `npm audit` for details; this is not a clean audit.',
			'',
		].join('\n'),
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const result = spawnSync('npm', ['audit', 'fix', '--package-lock-only', '--ignore-scripts', '--json'], {
		encoding: 'utf8',
		maxBuffer: 10 * 1024 * 1024,
	})
	if (result.stderr) {
		process.stderr.write(result.stderr)
	}
	const { markdown, remaining } = summarizeAuditFix(result)
	process.stdout.write(markdown)
	if (remaining > 0) {
		console.error(`::warning::npm audit still reports ${remaining} vulnerabilities requiring manual review.`)
	}
}
