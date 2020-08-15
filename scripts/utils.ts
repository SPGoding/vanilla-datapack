import crypto from 'crypto'
import fs from 'fs'
import https from 'https'
import path from 'path'

export type TreeSummary = {
    $end?: true,
    $children?: Record<string, TreeSummary>
}

export async function download(uri: string, path: string, sha1?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
        const stream = fs.createWriteStream(path, { encoding: 'utf-8' })
        let hash = sha1 ? crypto.createHash('sha1') : undefined
        https.get(uri, res => {
            res
                .on('data', chunk => hash?.update(chunk))
                .on('end', () => {
                    const expected = sha1?.toLowerCase()
                    const actual = hash?.digest('hex').toLowerCase()
                    if (expected !== actual) {
                        fs.unlinkSync(path)
                        reject(new Error(`Expected SHA-1 ${expected} but got ${actual} for "${uri}"`))
                    } else if (expected) {
                        console.log(`Checksum passed for "${uri}".`)
                    }
                })
                .on('error', e => {
                    fs.unlinkSync(path)
                    reject(e)
                })
                .pipe(stream)
            stream
                .on('error', e => {
                    fs.unlinkSync(path)
                    reject(e)
                })
                .on('finish', () => {
                    stream.close()
                })
                .on('close', resolve)
        })
    })
}

export async function getPlainText(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = ''
        https.get(uri, res => {
            if (res.statusCode === 200) {
                res
                    .on('error', reject)
                    .on('data', chunk => data += chunk)
                    .on('end', () => resolve(data))
            } else {
                reject(res.statusCode)
            }
        })
    })
}

export function createDirs(): void {
    if (!fs.existsSync(GeneratedPath)) {
        fs.mkdirSync(GeneratedPath)
    }
    if (!fs.existsSync(InputPath)) {
        fs.mkdirSync(InputPath)
    }
}

export const GeneratedPath = path.join(__dirname, '../generated')
export const VersionPath = path.join(GeneratedPath, 'version.txt')
export const GeneratedDataPath = path.join(GeneratedPath, 'data')
export const GeneratedTreeSummaryPath = path.join(GeneratedPath, 'summary/tree.json')
export const GeneratedMinTreeSummaryPath = path.join(GeneratedPath, 'summary/tree.min.json')
export const GeneratedFlattenedSummaryPath = path.join(GeneratedPath, 'summary/flattened.json')
export const GeneratedMinFlattenedSummaryPath = path.join(GeneratedPath, 'summary/flattened.min.json')

export const InputPath = path.join(__dirname, '../input')
export const JarPath = path.join(InputPath, 'game.jar')
export const WorldgenPath = path.join(InputPath, 'vanilla_worldgen.zip')
