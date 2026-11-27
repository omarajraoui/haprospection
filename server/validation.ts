export class RequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function field(value: unknown, maximum: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new RequestError(400, `Saisissez une valeur de 1 à ${maximum} caractères.`)
  }
  return value.trim()
}

export function searchCriteria(body: Record<string, unknown>) {
  return {
    product: field(body.product, 100),
    market: field(body.market, 100),
    role: field(body.role, 100),
    origin: body.origin === undefined || body.origin === '' ? undefined : field(body.origin, 100),
  }
}

export function dateField(value: unknown, optional = false) {
  if (optional && value === '') return ''
  const date = field(value, 10)
  const timestamp = Date.parse(date)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp)
    || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new RequestError(400, 'Saisissez une date valide.')
  }
  return date
}

export function sourceUrl(value: unknown) {
  try {
    const url = new URL(field(value, 2048))
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href
  } catch {
    // Malformed URLs and unsupported URL schemes share the same message.
  }
  throw new RequestError(400, 'Saisissez une URL HTTP ou HTTPS valide.')
}
