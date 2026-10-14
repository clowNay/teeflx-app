// Ships what's on master to iOS users the cheapest way that works:
//
//   node scripts/ship.mjs --message "Mere luft på forsiden" [--whats-new "…"] [--dry-run]
//
// - JS-only change (the runtime fingerprint matches a finished production build):
//   publishes an EAS Update to the production channel. Installed apps pick it up the
//   next time they're opened; no build and no App Review.
// - Native change (new fingerprint): builds with EAS, uploads to TestFlight, and sends
//   it to App Review with scripts/app-store-release.mjs. Bump "version" in app.json
//   first, and pass --whats-new for the App Store's "Nyheder".
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const arg = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const dryRun = args.includes('--dry-run')
const message = arg('--message')
const whatsNew = arg('--whats-new')
if (!message) fail('--message "…" is required')

const run = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: opts.quiet ? ['ignore', 'pipe', 'ignore'] : 'inherit', ...opts })
const q = s => `"${s.replace(/"/g, '\\"')}"`
function fail(m) { console.error(`✖ ${m}`); process.exit(1) }

if (run('git status --porcelain', { quiet: true }).trim()) fail('Commit and push first: the working tree has changes')

const runtime = JSON.parse(run('npx expo-updates runtimeversion:resolve --platform ios', { quiet: true })).runtimeVersion
const builds = JSON.parse(run('npx eas build:list --platform ios --build-profile production --status finished --limit 20 --json --non-interactive', { quiet: true }))
const match = builds.find(b => b.runtimeVersion === runtime)
console.log(`Runtime ${runtime.slice(0, 10)}…: ${match ? `matches build ${match.appBuildVersion} (${match.appVersion})` : 'no build has it yet'}`)

if (match) {
    console.log('→ JS-only change: publishing an EAS Update')
    if (!dryRun) run(`npx eas update --channel production --platform ios --message ${q(message)} --non-interactive`)
} else {
    if (!whatsNew) fail('Native change: a new build goes to the App Store, so --whats-new "…" is required')
    const version = JSON.parse(readFileSync('app.json', 'utf8')).expo.version
    console.log(`→ Native change: building ${version} and sending it to App Review`)
    if (!dryRun) {
        run('npx eas build --platform ios --profile production --auto-submit --non-interactive --wait')
        run(`node scripts/app-store-release.mjs --whats-new ${q(whatsNew)}`)
    }
}
