export const createWriteQueue = () => {
  let queue: Promise<unknown> = Promise.resolve()

  return <T>(task: () => Promise<T>): Promise<T> => {
    const next = queue.then(task)
    queue = next.catch(() => undefined)
    return next
  }
}
