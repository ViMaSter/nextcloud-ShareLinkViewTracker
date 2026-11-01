# Share Link View Tracker

Based on the template to get started with Nextcloud app development.

## Usage

- Share a link
- Access it
- Open the activity tab that lists things like `Downloaded via public link` and `Shared as public link`
- Notice "Viewed by 123.123.123.123" in the activity details of the "Shared as public link" entry

## Automated dependency maintenance

The weekly **Npm audit fix and compile** workflow operates only on the repository's
default branch. It runs native `npm audit fix --package-lock-only --ignore-scripts`
without `--force`, tests and builds the result, and opens or updates a dependency PR.
Remaining vulnerabilities are reported in the workflow summary and PR body, not
treated as a clean audit. Registry, dependency-resolution, and invalid-report
errors still fail the workflow.

PR creation uses `GITHUB_TOKEN`, so no `COMMAND_BOT_PAT` secret is required.
Enable **Settings > Actions > General > Workflow permissions > Allow GitHub
Actions to create and approve pull requests**. The job requests write access to
contents and pull requests; it does not approve or merge PRs. GitHub may require a
maintainer to approve workflows on the generated PR before its checks run.

Run the audit workflow's regression tests locally with:

```sh
node --test scripts/npm-audit-fix.test.mjs
```

## Releases without the App Store

The release workflow builds the app on pull requests and publishes stable semver
tags such as `v1.0.0` to GitHub Releases and GHCR. No Nextcloud App Store account,
certificate, or submission is required. The app is unsigned; Nextcloud may report
an integrity warning. Do not disable global integrity checks to suppress it.

Before tagging, update `appinfo/info.xml` and the npm version together:

```sh
npm version 1.0.1 --no-git-tag-version
# Set appinfo/info.xml's version to 1.0.1, then commit the release changes.
git tag v1.0.1
git push origin v1.0.1
```

The tag, XML version, npm version, and lockfile version must match. The workflow
uses Node 24 and `npm ci`, builds the assets, checks PHP syntax, and publishes:

- `sharelinkviewtracker-1.0.1.tar.gz` and its SHA-256 checksum as release assets.
- `ghcr.io/vimaster/nextcloud-sharelinkviewtracker:v1.0.1`, an app-only image for
	amd64 and arm64. Its files live under `/sharelinkviewtracker`; it is not a
	runnable Nextcloud server.

Keep release tags immutable. After the first publication, make the GHCR package
public so downstream builds can pull it without credentials. Private packages
require explicit cross-repository access and registry authentication.

To build and verify locally:

```sh
npm ci
npm run build
npm run test:packaging
npm run package -- v1.0.0
docker build -f packaging/Dockerfile -t sharelinkviewtracker-artifact:local .
```

The archive includes only runtime app files and compiled assets, without source
maps or development dependencies. Nextcloud autoloads the app's PHP classes;
there are currently no third-party PHP runtime dependencies. If those are added,
the release packaging must also install and include their production files.