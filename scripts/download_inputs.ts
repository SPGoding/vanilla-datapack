import { LatestVersionResult } from './get_latest_version'
import { JarPath, createDirs, download } from './utils'

export async function downloadInputs(json: LatestVersionResult) {
    console.log(`Downloading inputs for "${json.version}"...`)
    createDirs()
    await download(json.download, JarPath, json.sha1)
    console.log('Saved "game.jar".')
}

if (require.main === module) {
    (async () => {
        try {
            await downloadInputs(JSON.parse(process.argv.slice(2).join(' ')))
        } catch (e) {
            console.error(e)
        }
    })()
}
