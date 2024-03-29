import { IdentityNode } from '@spgoding/datapack-language-server/lib/nodes'
import { walkFile } from '@spgoding/datapack-language-server/lib/services/common'
import decompress from 'decompress'
import cp from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { createDirs, DataGeneratorGeneratedDimensionPath, DataGeneratorGeneratedDimensionTypePath, DataGeneratorGeneratedDirName, DataGeneratorGeneratedWorldgenPath, GeneratedDataPath, GeneratedDefaultNamespacePath, GeneratedDimensionPath, GeneratedDimensionTypePath, GeneratedFlattenedSummaryPath, GeneratedMinFlattenedSummaryPath, GeneratedMinTreeSummaryPath, GeneratedPath, GeneratedSummaryPath, GeneratedTreeSummaryPath, GeneratedWorldgenPath, InputPath, JarPath, TreeSummary } from './utils'

export async function generate() {
    console.time('generate')
    if (!fs.existsSync(JarPath)) {
        throw new Error(`No input at "${JarPath}"`)
    }
    createDirs()
    if (fs.existsSync(GeneratedDataPath)) {
        fs.rmdirSync(GeneratedDataPath, { recursive: true })
    }
    fs.mkdirSync(GeneratedDefaultNamespacePath, { recursive: true })
    fs.mkdirSync(GeneratedSummaryPath, { recursive: true })
    console.time('generateData')
    await generateData()
    console.timeEnd('generateData')
    console.time('generateSummary')
    await generateSummary()
    console.timeEnd('generateSummary')
    console.timeEnd('generate')
}

async function generateData() {
    console.time('generateJarData')
    await generateJarData()
    console.timeEnd('generateJarData')
    console.time('generateWorldgenData')
    generateWorldgenData()
    console.timeEnd('generateWorldgenData')
    fs.writeFileSync(path.join(GeneratedDefaultNamespacePath, 'loot_tables/empty.json'), '{}', 'utf-8')
}

async function generateJarData() {
    function getFile(files: decompress.File[], path: string): decompress.File | undefined {
        return files.find(f => f.path.replace(/\\/g, '/') === path)
    }

    try {
        const files = await decompress(JarPath)
        const versionsList = getFile(files, 'META-INF/versions.list')

        let versionJarFiles: decompress.File[]
        if (versionsList) {
            // New bundler format after 21w39a.
            const [, , versionJarRelPath] = versionsList.data.toString('utf-8').split(/[\t\r\n]/)
            const versionJarPath = path.posix.join('META-INF/versions', versionJarRelPath)
            const versionJar = getFile(files, versionJarPath)
            if (!versionJar) {
                throw new Error(`Cannot find version jar ${versionJarPath}`)
            }
            versionJarFiles = await decompress(versionJar.data)
        } else {
            // Legacy format before 21w39a.
            versionJarFiles = files
        }

        await Promise.all(versionJarFiles.map(async file => {
            if (file.path.startsWith('data') && ['.json', '.mcfunction', '.nbt'].includes(path.posix.extname(file.path))) {
                const outputPath = path.join(GeneratedPath, file.path)
                await fs.promises.mkdir(path.resolve(outputPath, '..'), { recursive: true })
                await fs.promises.writeFile(path.join(GeneratedPath, file.path), file.data)
            }
        }))
    } catch (e) {
        console.error(`Handling ${JarPath}: `, e)
    }
}

function generateWorldgenData() {
    cp.execSync(`java -DbundlerMainClass=net.minecraft.data.Main -jar game.jar --reports --output ${DataGeneratorGeneratedDirName}`, {
        cwd: InputPath,
    })
    fs.moveSync(DataGeneratorGeneratedDimensionPath, GeneratedDimensionPath)
    fs.moveSync(DataGeneratorGeneratedDimensionTypePath, GeneratedDimensionTypePath)
    fs.moveSync(DataGeneratorGeneratedWorldgenPath, GeneratedWorldgenPath)
}

async function generateSummary() {
    const tree: Record<string, TreeSummary | undefined> = {}
    const flattened: Record<string, string[] | undefined> = {}
    const rels: string[] = []
    await walkFile(
        GeneratedPath,
        GeneratedDataPath,
        (_, rel) => rels.push(rel)
    )

    for (const rel of rels.sort()) {
        const result = IdentityNode.fromRel(rel)
        if (result) {
            (flattened[result.category] ??= []).push(result.id.toString())
            const arr = [result.id.getNamespace(), ...result.id.path]
            let object = (tree[result.category] ??= {})
            for (const [i, seg] of arr.entries()) {
                object[seg] ??= {}
                if (i === arr.length - 1) {
                    object[seg].$end = true
                } else {
                    object = (object[seg].$children ??= {})
                }
            }
        }
    }

    fs.writeFileSync(GeneratedTreeSummaryPath, JSON.stringify(tree, undefined, 2) + '\n', { encoding: 'utf-8' })
    fs.writeFileSync(GeneratedMinTreeSummaryPath, JSON.stringify(tree), { encoding: 'utf-8' })
    fs.writeFileSync(GeneratedFlattenedSummaryPath, JSON.stringify(flattened, undefined, 2) + '\n', { encoding: 'utf-8' })
    fs.writeFileSync(GeneratedMinFlattenedSummaryPath, JSON.stringify(flattened), { encoding: 'utf-8' })
}

if (require.main === module) {
    (async () => {
        try {
            await generate()
        } catch (e) {
            console.error(e)
        }
    })()
}
