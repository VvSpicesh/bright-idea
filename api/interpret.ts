import {
  environment,
  handleOptions,
  jsonResponse,
  readLimitedJson,
  rejectDisallowedOrigin,
  requestInterpretation,
  secureEqual,
  validateInterpretInput,
  withCors,
} from './_shared'

async function handle(request: Request): Promise<Response> {
  const env = environment()
  const rejected = rejectDisallowedOrigin(request, env.ALLOWED_ORIGIN)
  if (rejected) return rejected
  const options = handleOptions(request, env.ALLOWED_ORIGIN)
  if (options) return options
  if (request.method !== 'POST') return withCors(jsonResponse({ error: 'Method not allowed' }, 405), request, env.ALLOWED_ORIGIN)

  let body: unknown
  try {
    body = await readLimitedJson(request)
  } catch (error) {
    const message = error instanceof Error && error.message === 'BODY_TOO_LARGE' ? 'Request body too large' : 'Invalid JSON body'
    return withCors(jsonResponse({ error: message }, 400), request, env.ALLOWED_ORIGIN)
  }

  if (!env.APP_PASSWORD) return withCors(jsonResponse({ error: 'Server is not configured' }, 500), request, env.ALLOWED_ORIGIN)
  const suppliedPassword = body && typeof body === 'object' && typeof (body as Record<string, unknown>).password === 'string'
    ? (body as Record<string, unknown>).password as string
    : ''
  if (!secureEqual(suppliedPassword, env.APP_PASSWORD)) {
    return withCors(jsonResponse({ error: 'Unauthorized' }, 401), request, env.ALLOWED_ORIGIN)
  }
  if (!validateInterpretInput(body)) return withCors(jsonResponse({ error: 'Invalid request parameters' }, 400), request, env.ALLOWED_ORIGIN)
  if (!env.AI_API_KEY || !env.AI_BASE_URL || !env.AI_MODEL) {
    return withCors(jsonResponse({ error: 'Server is not configured' }, 500), request, env.ALLOWED_ORIGIN)
  }

  try {
    const text = await requestInterpretation(body, {
      AI_API_KEY: env.AI_API_KEY,
      AI_BASE_URL: env.AI_BASE_URL,
      AI_MODEL: env.AI_MODEL,
    })
    return withCors(jsonResponse({ text }, 200), request, env.ALLOWED_ORIGIN)
  } catch {
    return withCors(jsonResponse({ error: 'AI service unavailable' }, 502), request, env.ALLOWED_ORIGIN)
  }
}

export default { fetch: handle }
