import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const EVIDENCE_BUCKET = 'evidencias'

// Created lazily (on first real use, at request time) instead of at module load —
// `next build` imports every route to collect page data, and SUPABASE_URL isn't
// set as a build-time env var, which would crash the build if created eagerly.
let client: SupabaseClient | undefined
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const c = getClient()
    return Reflect.get(c, prop, c)
  },
})

const SIGNED_URL_TTL = 60 * 60 // 1 hour

// Signs every path in a single request instead of one request per file —
// firing them individually in parallel causes connection failures once a note has many files.
export async function signFileUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (paths.length === 0) return map
  const { data } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  data?.forEach(d => { if (d.signedUrl && !d.error) map.set(d.path ?? '', d.signedUrl) })
  return map
}
