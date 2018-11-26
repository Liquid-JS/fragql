import { mkdir, stat } from 'fs'
import { dirname } from 'path'
import { promisify } from 'util'

const pMkdir = promisify(mkdir)
const pStat = promisify(stat)

export async function mkdirp(path: string, mode = 0o777) {
    try {
        await pMkdir(path, mode)
    } catch (error) {
        if (error.code === 'ENOENT') {
            await mkdirp(dirname(path), mode)
            await mkdirp(path, mode)
        } else {
            const stats = await pStat(path)
            if (!stats.isDirectory())
                throw error
        }
    }
}

