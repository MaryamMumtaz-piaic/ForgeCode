export async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, duration: Date.now() - start };
}

export function timedSync<T>(fn: () => T): { result: T; duration: number } {
  const start = Date.now();
  const result = fn();
  return { result, duration: Date.now() - start };
}
