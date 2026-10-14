// Sends an iOS build that EAS Submit has uploaded to App Store Connect on to App Review,
// and lets Apple release it to the App Store as soon as it's approved.
//
//   node scripts/app-store-release.mjs --whats-new "Ny runde-tæller og nyt look" [--build 6] [--dry-run]
//
// The App Store version is "version" in app.json (bump it for every store release). Without
// --build it takes the newest build uploaded for that version. "What's new" is required
// for every update and is set on all of the version's languages.
//
// Needs an App Store Connect API key (role App Manager) in .env.local, which git ignores:
//   ASC_KEY_ID=...  ASC_ISSUER_ID=...  ASC_KEY_PATH=C:/path/to/AuthKey_XXXX.p8
import { createSign } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'

const APP_ID = '6768811484' // ascAppId in eas.json
const API = 'https://api.appstoreconnect.apple.com/v1'

const args = process.argv.slice(2)
const arg = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const dryRun = args.includes('--dry-run')
const whatsNew = arg('--whats-new')
const buildNumber = arg('--build')
const version = JSON.parse(readFileSync('app.json', 'utf8')).expo.version

if (!whatsNew) fail('--whats-new "…" is required (shown in the App Store as "Nyheder")')

// ── Auth ──
if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*(ASC_[A-Z_]+)\s*=\s*(.*?)\s*$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
}
const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH } = process.env
if (!ASC_KEY_ID || !ASC_ISSUER_ID || !ASC_KEY_PATH) fail('Set ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_PATH in .env.local')

function token() {
    const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const body = `${b64({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' })}.${b64({ iss: ASC_ISSUER_ID, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' })}`
    const sig = createSign('SHA256').update(body).sign({ key: readFileSync(ASC_KEY_PATH), dsaEncoding: 'ieee-p1363' })
    return `${body}.${sig.toString('base64url')}`
}

async function asc(method, path, data) {
    const res = await fetch(API + path, {
        method,
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: data ? JSON.stringify({ data }) : undefined,
    })
    if (res.status === 204) return null
    const json = await res.json().catch(() => null)
    if (!res.ok) fail(`${method} ${path}: ${res.status} ${json?.errors?.map(e => e.detail ?? e.title).join('; ') ?? ''}`)
    return json
}

function fail(message) { console.error(`✖ ${message}`); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── 1. The build, once Apple has processed it ──
async function findBuild() {
    const q = new URLSearchParams({ 'filter[app]': APP_ID, 'filter[preReleaseVersion.version]': version, sort: '-uploadedDate', limit: '1' })
    if (buildNumber) q.set('filter[version]', buildNumber)
    for (let i = 0; i < 60; i++) {
        const build = (await asc('GET', `/builds?${q}`)).data[0]
        if (build?.attributes.processingState === 'VALID') return build
        if (build && ['FAILED', 'INVALID'].includes(build.attributes.processingState)) fail(`Build ${build.attributes.version} is ${build.attributes.processingState}`)
        console.log(build ? `… build ${build.attributes.version} is ${build.attributes.processingState}, waiting` : `… no build for ${version} yet, waiting`)
        await sleep(60_000)
    }
    fail(`No processed build for ${version} after an hour`)
}

// ── 2. The App Store version (created on first run, reused after) ──
async function findOrCreateVersion() {
    const q = new URLSearchParams({ 'filter[platform]': 'IOS', 'filter[versionString]': version })
    const existing = (await asc('GET', `/apps/${APP_ID}/appStoreVersions?${q}`)).data[0]
    if (existing) {
        const state = existing.attributes.appStoreState
        if (!['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(state)) {
            fail(`App Store version ${version} is ${state}; bump "version" in app.json for a new release`)
        }
        return existing
    }
    if (dryRun) return { id: '(new)', attributes: { versionString: version } }
    return (await asc('POST', '/appStoreVersions', {
        type: 'appStoreVersions',
        attributes: { platform: 'IOS', versionString: version, releaseType: 'AFTER_APPROVAL' },
        relationships: { app: { data: { type: 'apps', id: APP_ID } } },
    })).data
}

const build = await findBuild()
console.log(`✔ Build ${build.attributes.version} (${version}) is processed`)
const storeVersion = await findOrCreateVersion()
console.log(`✔ App Store version ${version} (${storeVersion.id})`)

if (dryRun) { console.log('Dry run: nothing changed'); process.exit(0) }

await asc('PATCH', `/appStoreVersions/${storeVersion.id}/relationships/build`, { type: 'builds', id: build.id })
await asc('PATCH', `/appStoreVersions/${storeVersion.id}`, { type: 'appStoreVersions', id: storeVersion.id, attributes: { releaseType: 'AFTER_APPROVAL' } })
console.log(`✔ Build ${build.attributes.version} attached, releases automatically after approval`)

// ── 3. What's new ──
const localizations = (await asc('GET', `/appStoreVersions/${storeVersion.id}/appStoreVersionLocalizations`)).data
for (const loc of localizations) {
    await asc('PATCH', `/appStoreVersionLocalizations/${loc.id}`, { type: 'appStoreVersionLocalizations', id: loc.id, attributes: { whatsNew } })
}
console.log(`✔ "What's new" set (${localizations.map(l => l.attributes.locale).join(', ')})`)

// ── 4. Submit for review ──
const open = (await asc('GET', `/reviewSubmissions?${new URLSearchParams({ 'filter[app]': APP_ID, 'filter[platform]': 'IOS', 'filter[state]': 'READY_FOR_REVIEW' })}`)).data[0]
const submission = open ?? (await asc('POST', '/reviewSubmissions', {
    type: 'reviewSubmissions',
    attributes: { platform: 'IOS' },
    relationships: { app: { data: { type: 'apps', id: APP_ID } } },
})).data
const items = (await asc('GET', `/reviewSubmissions/${submission.id}/items`)).data
if (!items.length) {
    await asc('POST', '/reviewSubmissionItems', {
        type: 'reviewSubmissionItems',
        relationships: {
            reviewSubmission: { data: { type: 'reviewSubmissions', id: submission.id } },
            appStoreVersion: { data: { type: 'appStoreVersions', id: storeVersion.id } },
        },
    })
}
await asc('PATCH', `/reviewSubmissions/${submission.id}`, { type: 'reviewSubmissions', id: submission.id, attributes: { submitted: true } })
console.log(`✔ ${version} (build ${build.attributes.version}) submitted for App Review`)
