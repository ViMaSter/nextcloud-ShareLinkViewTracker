import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { packageRelease } from './package-release.mjs'

async function fixture(context) {
	const root = await mkdtemp(join(tmpdir(), 'sharelinkviewtracker-test-'))
	context.after(() => rm(root, { recursive: true, force: true }))
	const files = {
		'package.json': JSON.stringify({ version: '1.2.3' }),
		'package-lock.json': JSON.stringify({ version: '1.2.3', packages: { '': { version: '1.2.3' } } }),
		'appinfo/info.xml': '<info><id>sharelinkviewtracker</id><version>1.2.3</version></info>',
		'lib/AppInfo/Application.php': '<?php',
		'templates/index.php': '<?php',
		'img/app.svg': '<svg/>',
		'js/sharelinkviewtracker-main.mjs': 'export {}',
		'js/sharelinkviewtracker-main.mjs.map': '{}',
		'css/sharelinkviewtracker-main.css': '',
		'LICENSE': 'AGPL',
		'README.md': 'App',
		'CHANGELOG.md': 'Changes',
		'node_modules/development/index.js': '',
		'tests/test.php': '<?php',
	}
	for (const [name, contents] of Object.entries(files)) {
		await mkdir(dirname(join(root, name)), { recursive: true })
		await writeFile(join(root, name), contents)
	}
	return root
}

test('packages runtime files with one app root and a matching checksum', async context => {
	const root = await fixture(context)
	const { archive, digest } = await packageRelease(root, 'v1.2.3')
	const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n')
	assert.ok(entries.every(entry => entry.startsWith('sharelinkviewtracker/')))
	assert.ok(entries.includes('sharelinkviewtracker/js/sharelinkviewtracker-main.mjs'))
	assert.ok(entries.includes('sharelinkviewtracker/lib/AppInfo/Application.php'))
	assert.ok(!entries.some(entry => /node_modules|tests\/|\.map$/.test(entry)))
	assert.equal(digest, createHash('sha256').update(await readFile(archive)).digest('hex'))
	assert.equal(await readFile(`${archive}.sha256`, 'utf8'), `${digest}  sharelinkviewtracker-1.2.3.tar.gz\n`)
})

test('rejects a tag that does not match the release version', async context => {
	const root = await fixture(context)
	await assert.rejects(packageRelease(root, 'v1.2.4'), /Release tag/)
})

test('rejects mismatched Nextcloud app metadata', async context => {
	const root = await fixture(context)
	await writeFile(join(root, 'appinfo/info.xml'), '<info><id>sharelinkviewtracker</id><version>1.2.2</version></info>')
	await assert.rejects(packageRelease(root, 'v1.2.3'), /versions/)
})

test('rejects mismatched lockfile versions', async context => {
	const root = await fixture(context)
	await writeFile(join(root, 'package-lock.json'), JSON.stringify({ version: '1.2.2', packages: { '': { version: '1.2.2' } } }))
	await assert.rejects(packageRelease(root, 'v1.2.3'), /versions/)
})

test('rejects missing compiled assets', async context => {
	const root = await fixture(context)
	await rm(join(root, 'js'), { recursive: true })
	await assert.rejects(packageRelease(root, 'v1.2.3'), /ENOENT/)
})