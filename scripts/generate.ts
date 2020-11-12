import { IdentityNode } from '@spgoding/datapack-language-server/lib/nodes'
import { walkFile } from '@spgoding/datapack-language-server/lib/services/common'
import { FileType, FileTypes } from '@spgoding/datapack-language-server/lib/types'
import decompress from 'decompress'
import fs from 'fs'
import path from 'path'
import { createDirs, GeneratedDataPath, GeneratedFlattenedSummaryPath, GeneratedMinFlattenedSummaryPath, GeneratedMinTreeSummaryPath, GeneratedPath, GeneratedTreeSummaryPath, JarPath, TreeSummary, WorldgenPath } from './utils'

const DefaultNamespacePath = path.join(GeneratedDataPath, 'minecraft')
const SummaryPath = path.join(GeneratedPath, 'summary')

export async function generate() {
    console.time('generate')
    if (!fs.existsSync(JarPath) || !fs.existsSync(WorldgenPath)) {
        throw new Error(`No input at "${JarPath}" and/or "${WorldgenPath}"`)
    }
    createDirs()
    if (fs.existsSync(GeneratedDataPath)) {
        fs.rmdirSync(GeneratedDataPath, { recursive: true })
    }
    fs.mkdirSync(DefaultNamespacePath, { recursive: true })
    fs.mkdirSync(SummaryPath, { recursive: true })
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
    await generateWorldgenData()
    console.timeEnd('generateWorldgenData')
    fs.writeFileSync(path.join(DefaultNamespacePath, 'loot_tables/empty.json'), '{}', 'utf-8')
}

async function generateJarData() {
    return decompress(JarPath, GeneratedDataPath, {
        filter: f => f.path.startsWith('data') && ['.json', '.mcfunction', '.nbt'].includes(path.posix.extname(f.path)),
        map: f => {
            f.path = f.path.split(/[\\\/]/).slice(1).join('/')
            return f
        }
    })
}

async function generateWorldgenData() {
    return decompress(WorldgenPath, DefaultNamespacePath)
}

async function generateSummary() {
    const tree: Record<FileType, TreeSummary> = {} as any
    const flattened: Record<FileType, string[]> = {} as any
    const rels: string[] = []
    for (const type of FileTypes) {
        tree[type] = {}
        flattened[type] = []
    }
    await walkFile(
        GeneratedPath,
        GeneratedDataPath,
        (_, rel) => rels.push(rel)
    )

    for (const rel of rels.sort()) {
        const result = IdentityNode.fromRel(rel)
        if (result) {
            flattened[result.category].push(result.id.toString())
            const arr = [result.id.getNamespace(), ...result.id.path]
            let object = tree[result.category]
            for (const [i, seg] of arr.entries()) {
                object[seg] = object[seg] ?? {}
                if (i === arr.length - 1) {
                    object[seg].$end = true
                } else {
                    object = (object[seg].$children = object[seg].$children ?? {})
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
