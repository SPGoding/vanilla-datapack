import { LatestVersionResult } from './get_latest_version'
import { JarPath, createDirs, download, WorldgenPath } from './utils'

const VanillaWorldgenUri = 'https://raw.githubusercontent.com/slicedlime/examples/master/vanilla_worldgen.zip'

export async function downloadInputs(json: LatestVersionResult) {
    console.log(`Downloading inputs for "${json.version}"...`)
    createDirs()
    await download(json.download, JarPath, json.sha1)
    console.log('Saved "game.jar".')
    await download(VanillaWorldgenUri, WorldgenPath)
    console.log('Saved "vanilla_worldgen.zip".')
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
