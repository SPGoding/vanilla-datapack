import fs from 'fs-extra'
import simpleGit, { SimpleGit } from 'simple-git'
import { downloadInputs } from './download_inputs'
import { generate } from './generate'
import { getLatestVersion } from './get_latest_version'
import { createDirs, GeneratedDataPath, GeneratedSummaryPath, RootDataPath, RootSummaryPath, VersionPath } from './utils'

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
        await deploy(latestResult.version)
        fs.writeFileSync(VersionPath, `${latestResult.version}\n`, 'utf-8')
    } catch (e) {
        console.error(e)
    }
})()

async function deploy(version: string) {
    console.time('deploy')
    const git = simpleGit()
    await git.addConfig('user.name', 'github-actions')
    await git.addConfig('user.email', 'github-actions@github.com')
    console.time('deployTo data')
    await deployTo(git, version, 'data', GeneratedDataPath, RootDataPath)
    console.timeEnd('deployTo data')
    console.time('deployTo summary')
    await deployTo(git, version, 'summary', GeneratedSummaryPath, RootSummaryPath)
    console.timeEnd('deployTo summary')
    console.timeEnd('deploy')
}

async function deployTo(git: SimpleGit, version: string, type: 'data' | 'summary', generatedPath: string, rootStorePath: string) {
    await git.checkoutLocalBranch(type)
    await fs.ensureDir(rootStorePath)
    await fs.copy(generatedPath, rootStorePath)
    await git.add('.')
    await git.commit(`🚀 Update ${type} for ${version}`)
    await git.addTag(`${version}-${type}`)
    await git.push('origin', type)
    await git.pushTags('origin', type)
}
