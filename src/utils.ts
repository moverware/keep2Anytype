import { promises as fs } from 'fs'
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key]
  if (value !== undefined) return value
  if (defaultValue !== undefined) return defaultValue
  throw new Error(`Missing environment variable: ${key}`)
}

export const ensureDirectoryExists = async (dirPath: string) => {
  try {
    await fs.access(dirPath)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true })
      console.log(`Directory created: ${dirPath}`)
    } else {
      console.error(`An error occurred: ${error.message}`)
    }
  }
}

export const convertMicrosecondsToSeconds = (microseconds: number) => {
  return Math.floor(microseconds / 1000000)
}
