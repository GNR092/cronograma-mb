import { createClient } from '@supabase/supabase-js'

export const EVIDENCE_BUCKET = 'evidencias'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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
