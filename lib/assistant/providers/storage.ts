import fs from 'node:fs/promises'
import path from 'node:path'

export interface StorageProvider {
  put(folder: string, data: Buffer, mime: string): Promise<string> // returns public URL
}

export class DiskStorageProvider implements StorageProvider {
  constructor(private readonly baseDir = path.join(process.cwd(), 'public', 'uploads')) {}
  async put(folder: string, data: Buffer, _mime: string): Promise<string> {
    const dir = path.join(this.baseDir, folder)
    await fs.mkdir(dir, { recursive: true })
    const name = Date.now() + '-' + Math.random().toString(36).slice(2) + '.bin'
    const file = path.join(dir, name)
    await fs.writeFile(file, data)
    const url = '/uploads/' + folder + '/' + name
    return url
  }
}

