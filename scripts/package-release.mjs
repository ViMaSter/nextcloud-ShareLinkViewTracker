import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import semver from 'semver'

export async function packageRelease(root, tag, output = join(root, 'dist')) {
	const metadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
	const xml = await readFile(join(root, 'appinfo/info.xml'), 'utf8')
	if (XMLValidator.validate(xml) !== true) {
		throw new Error('Invalid appinfo/info.xml')
	}
	const info = new XMLParser({ parseTagValue: false }).parse(xml).info
	const version = metadata.version
	if (!semver.valid(version) || semver.prerelease(version) !== null || tag !== `v${version}`) {
		throw new Error('Release tag must match the stable semver version in package.json')
	}
	if (info.id !== 'sharelinkviewtracker' || info.version !== version
		|| lock.version !== version || lock.packages[''].version !== version) {
		throw new Error('App ID or versions in info.xml, package.json, and package-lock.json do not match')
	}
	await access(join(root, 'js/sharelinkviewtracker-main.mjs'))
	await access(join(root, 'css/sharelinkviewtracker-main.css'))
	const staging = await mkdtemp(join(tmpdir(), 'sharelinkviewtracker-release-'))
	const archiveName = `sharelinkviewtracker-${version}.tar.gz`
	await mkdir(output, { recursive: true })
	try {
		const app = join(staging, info.id)
		await mkdir(app)
		for (const name of ['appinfo', 'lib', 'templates', 'img', 'js', 'css', 'LICENSE', 'README.md', 'CHANGELOG.md']) {
			await cp(join(root, name), join(app, name), {
				recursive: true,
				filter: source => !source.endsWith('.map'),
			})
		}
		const archive = resolve(output, archiveName)
		execFileSync('tar', ['-czf', archive, '-C', staging, info.id])
		const digest = createHash('sha256').update(await readFile(archive)).digest('hex')
		await writeFile(`${archive}.sha256`, `${digest}  ${archiveName}\n`)
		return { archive, digest, version }
	} finally {
		await rm(staging, { recursive: true, force: true })
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
	const result = await packageRelease(root, process.argv[2])
	console.log(`Packaged ${result.archive} (${result.digest})`)
}