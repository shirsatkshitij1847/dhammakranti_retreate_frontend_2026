export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
export const SESSION_TOKEN_KEY = 'triratna-retreat-access-token'

export async function requestApi(path, options = {}, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    let emailNotification
    try {
      const body = await response.json()
      if (typeof body.error === 'string') message = body.error
      emailNotification = body.emailNotification
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }

    const requestError = new Error(message)
    requestError.status = response.status
    requestError.emailNotification = emailNotification
    throw requestError
  }

  if (response.status === 204) return null
  return response.json()
}
