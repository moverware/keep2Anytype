export const delayMillis = (delayMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delayMs))

export const greet = (name: string): string => `Hello ${name}`

export const foo = async (path: string): Promise<boolean> => {
  console.log(greet(path))
  await delayMillis(1000)
  console.log('done')
  return true
}
