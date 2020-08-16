import fs from 'fs-extra'
import simpleGit, { SimpleGit } from 'simple-git'
import { downloadInputs } from './download_inputs'
import { generate } from './generate'
import { getLatestVersion } from './get_latest_version'
import { createDirs, GeneratedDataPath, GeneratedSummaryPath, RootDataPath, RootSummaryPath } from './utils'

(async () => {
    try {
        createDirs()
        const latestResult = await getLatestVersion()
        const git = simpleGit()
        const { all: allTags } = await git.tags()
        console.log(`The latest version is "${latestResult.version}".`)
        console.log(`A list of git tags: ${JSON.stringify(allTags)}.`)
        if (allTags.includes(`${latestResult.version}-summary`)) {
            console.log(`The latest version already exists in git tags.`)
            return
        } else {
            await downloadInputs(latestResult)
            await generate()
            await deploy(git, latestResult.version)
        }
    } catch (e) {
        console.error(e)
        process.exit(42)
    }
})()

async function deploy(git: SimpleGit, version: string) {
    console.time('deploy')
    await git.addConfig('user.name', 'actions-user')
    await git.addConfig('user.email', 'action@github.com')
    console.time('deployTo data')
    await deployTo(git, version, 'data', GeneratedDataPath, RootDataPath)
    console.timeEnd('deployTo data')
    console.time('deployTo summary')
    await deployTo(git, version, 'summary', GeneratedSummaryPath, RootSummaryPath)
    console.timeEnd('deployTo summary')
    console.timeEnd('deploy')
}

async function deployTo(git: SimpleGit, version: string, type: 'data' | 'summary', generatedPath: string, rootStorePath: string) {
    await git.checkout(type)
    await fs.ensureDir(rootStorePath)
    await fs.copy(generatedPath, rootStorePath)
    await git.add('.')
    await git.commit(`🚀 Update ${type} for ${version}`)
    await git.addTag(`${version}-${type}`)
    await git.push()
    await git.pushTags()
}
