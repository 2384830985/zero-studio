import fs from 'fs'
import os from 'os'
import path from 'path'

export async function getBinaryName(name: string): Promise<string> {
  if (process.platform === 'win32') {
    return `${name}.exe`
  }
  return name
}

export async function getBinaryPath(name?: string): Promise<string> {
  if (!name) {
    return path.join(os.homedir(), '.cherrystudio', 'bin')
  }

  const binaryName = await getBinaryName(name)
  const binariesDir = path.join(os.homedir(), '.cherrystudio', 'bin')
  const binariesDirExists = fs.existsSync(binariesDir)
  return binariesDirExists ? path.join(binariesDir, binaryName) : binaryName
}

export async function isBinaryExists(name: string): Promise<boolean> {
  const cmd = await getBinaryPath(name)
  return await fs.existsSync(cmd)
}
