#!/usr/bin/env node
import * as path from 'path'
import { readFile } from 'fs/promises'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { renderMetadata } from './render.js'

await Promise.resolve(
    yargs(hideBin(process.argv))
        .command(
            'render [metadata]',
            'render documentation from metadata',
            (builder) =>
                builder
                    .positional('metadata', {
                        describe: 'metadata.json file',
                        default: './metadata.json'
                    })
                    .option('target', {
                        alias: 't',
                        describe: 'target directory for the generated files',
                        default: './docs'
                    }),
            async (args) => {
                const target = args.target
                const metadataFile = path.normalize(path.join(process.cwd(), args.metadata))
                const metadata = JSON.parse(await readFile(metadataFile, 'utf-8'))
                renderMetadata(metadata, target)
                    .then(() => console.log('Done'))
                    .catch((err) => console.error(err))
            }
        )
        .demandCommand()
        .showHelpOnFail(false)
        .strict()
        .help()
        .wrap(120).argv
).catch(console.error)
