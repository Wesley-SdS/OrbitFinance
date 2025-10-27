export type EvolutionConfig = {
  baseUrl: string
  session: string
  token?: string
}

export function getEvolutionConfig(): EvolutionConfig | null {
  const baseUrl = process.env.WA_EVOLUTION_BASE_URL
  const session = process.env.WA_EVOLUTION_SESSION
  if (!baseUrl || !session) return null
  const token = process.env.WA_EVOLUTION_TOKEN
  return { baseUrl: baseUrl.replace(/\/$/, ''), session, token: token || undefined }
}

