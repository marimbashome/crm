/** Returns the env var or throws loudly if missing/empty. Server-side use only. */
export function requireEnv(name: string): string {
  const v = process.env[name]
  if (v === undefined || v === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}
