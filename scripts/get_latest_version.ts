import { getPlainText } from './utils'

const VersionManifestUri = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'

export async function getLatestVersion(): Promise<LatestVersionResult> {
    const manifest = JSON.parse(await getPlainText(VersionManifestUri)) as { latest: { snapshot: string }, versions: { id: string, url: string }[] }
    const clientJsonUri = manifest.versions.find(v => v.id === manifest.latest.snapshot)?.url
    if (!clientJsonUri) {
        throw new Error(`No clientJsonUri for "${manifest.latest.snapshot}".`)
    }
    const clientJson = JSON.parse(await getPlainText(clientJsonUri)) as { downloads: { server: { sha1: string, url: string } } }
    const ans = {
        version: manifest.latest.snapshot,
        download: clientJson.downloads.server.url,
        sha1: clientJson.downloads.server.sha1
    }
    if (require.main === module) {
        console.log(JSON.stringify(ans))
    }
    return ans
}

export type LatestVersionResult = {
    version: string,
    download: string,
    sha1: string
}

if (require.main === module) {
    (async () => {
        try {
            await getLatestVersion()
        } catch (e) {
            console.error(e)
        }
    })()
}
