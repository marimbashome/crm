/** Returns the env var or throws loudly if missing/empty. Server-side use only. */
export function requireEnv(name: string): string {
  const v = process.env[name]
  return requireEnvValue(v, name)
}

/** Returns the provided env value or throws loudly if missing/empty. */
export function requireEnvValue(value: string | undefined, name: string): string {
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
