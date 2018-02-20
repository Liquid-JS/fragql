import * as fs from 'fs'
import * as path from 'path'
import * as mkdirp from 'async-mkdirp'

import { Metadata, metadata } from './gql.js'
import { wrapTpl } from './templates/wrap.js'
import { sidebarTpl } from './templates/sidebar.js'
import { operationTpl } from './templates/operation.js'
import { fragmentTpl } from './templates/fragment.js'

async function writeFile(filePath: string, content: string, asBuffer: boolean) {
    if (asBuffer)
        return {
            [filePath]: new Buffer(content, 'utf8')
        }

    let dirname = path.dirname(filePath)
    await mkdirp(dirname)
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, (err) => {
            if (err)
                return reject(err)
            resolve()
        })
    })
}

async function copyFile(source: string, target: string, asBuffer: boolean) {
    if (asBuffer)
        return new Promise((resolve, reject) => {
            fs.readFile(source, (err, buff) => {
                if (err)
                    return reject(err)

                resolve({
                    [target]: buff
                })
            })
        })

    let dirname = path.dirname(target)
    await mkdirp(dirname)
    return new Promise((resolve, reject) => {
        const done = (err?) => {
            if (err)
                return reject(err)
            resolve()
        }
        const rd = fs.createReadStream(source)
        rd.on("error", (err) => {
            done(err)
        })
        const wr = fs.createWriteStream(target)
        wr.on("error", (err) => {
            done(err)
        })
        wr.on("close", () => {
            done()
        })
        rd.pipe(wr)
    })
}

export async function renderMetadata(metadata: Metadata): Promise<{ [path: string]: Buffer }>
export async function renderMetadata(metadata: Metadata, target: string): Promise<void>
export async function renderMetadata(metadata: Metadata, target?: string): Promise<{ [path: string]: Buffer } | void> {
    target = path.normalize(target || '')
    const asBuffer = target == '.'

    if (!asBuffer && !target.startsWith(path.sep))
        target = path.normalize(path.join(process.cwd(), target))

    const operations = Object.keys(metadata.operations)
        .map(key => {
            return {
                key,
                ...metadata.operations[key]
            }
        })
    operations.sort((a, b) => a.key.localeCompare(b.key))

    const fragments = Object.keys(metadata.fragments)
        .map(key => {
            return {
                key,
                ...metadata.fragments[key]
            }
        })
    fragments.sort((a, b) => a.key.localeCompare(b.key))

    const promises: Promise<any>[] = []

    promises.push(
        wrapTpl(sidebarTpl(operations, fragments))
            .then(content => writeFile(path.join(target, 'index.html'), content, asBuffer))
    )

    promises.push(
        ...operations.map(operation =>
            wrapTpl(sidebarTpl(operations, fragments, '../'), operationTpl(operation), '../')
                .then(content => writeFile(path.join(target, 'operations', `${operation.key}.html`), content, asBuffer))
        )
    )
    promises.push(
        ...fragments.map(fragment =>
            wrapTpl(sidebarTpl(operations, fragments, '../'), fragmentTpl(fragment), '../')
                .then(content => writeFile(path.join(target, 'fragments', `${fragment.key}.html`), content, asBuffer))
        )
    )
    promises.push(
        copyFile(path.normalize(path.join(__dirname, '../dist/assets/highlight.js')), path.join(target, 'assets', 'highlight.js'), asBuffer),
        copyFile(path.normalize(path.join(__dirname, '../node_modules/codemirror/lib/codemirror.css')), path.join(target, 'assets', 'codemirror.css'), asBuffer)
    )

    const results = await Promise.all(promises)
    if (asBuffer) {
        let map = Object.assign({}, ...results)
        return map
    }
}

export async function generateDocs(): Promise<{ [path: string]: Buffer }>
export async function generateDocs(target: string): Promise<void>
export async function generateDocs(target?: string): Promise<{ [path: string]: Buffer } | void> {
    return renderMetadata(metadata, target)
}