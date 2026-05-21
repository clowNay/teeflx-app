import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const API_HOST = 'https://api.teeflx.com'

// The handoff token must always be minted on the production API because the
// web checkout always exchanges it against production — regardless of which
// API the native app normally talks to in dev.
export const PRODUCTION_API_HOST = 'https://api.teeflx.com'

const TOKEN_KEY = 'dgu_access_token'

// SecureStore is native-only — fall back to localStorage on web
export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY)
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(TOKEN_KEY, token); return }
  return SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') { localStorage.removeItem(TOKEN_KEY); return }
  return SecureStore.deleteItemAsync(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}, extraHeaders: Record<string, string> = {}): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${API_HOST}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `access_token=${token}` } : {}),
      ...options.headers,
      ...extraHeaders,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, headers),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { API_HOST }
