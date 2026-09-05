import { environment, handleOptions, jsonResponse, rejectDisallowedOrigin, withCors } from './_shared'

async function handle(request: Request): Promise<Response> {
  const env = environment()
  const rejected = rejectDisallowedOrigin(request, env.ALLOWED_ORIGIN)
  if (rejected) return rejected
  const options = handleOptions(request, env.ALLOWED_ORIGIN)
  if (options) return options
  if (request.method !== 'GET') return withCors(jsonResponse({ error: 'Method not allowed' }, 405), request, env.ALLOWED_ORIGIN)

  return withCors(jsonResponse({ status: 'ok', model: env.AI_MODEL || 'not-configured' }, 200), request, env.ALLOWED_ORIGIN)
}

export default { fetch: handle }
