import fs from 'fs'
import { downloadInputs } from './download_inputs'
import { generate } from './generate'
import { getLatestVersion } from './get_latest_version'
import { createDirs, VersionPath } from './utils'

(async () => {
    try {
        createDirs()
        let lastVersion: string | undefined = undefined
        if (fs.existsSync(VersionPath)) {
            lastVersion = fs.readFileSync(VersionPath, 'utf-8').trim()
            console.log(`The latest version was "${lastVersion}" when last checked.`)
        }
        const latestResult = await getLatestVersion()
        if (latestResult.version === lastVersion) {
            console.log("The latest version isn't changed since last execution.")
            return
        }
        await downloadInputs(latestResult)
        await generate()
        
        fs.writeFileSync(VersionPath, `${latestResult.version}\n`, 'utf-8')
    } catch (e) {
        console.error(e)
    }
})()
