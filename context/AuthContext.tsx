import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken, PRODUCTION_API_HOST } from '@/lib/api'
import type { Player } from '@/lib/types'

interface MeResponse {
  player: Player | null
  unionData: unknown | null
}

interface AuthContextValue {
  player: Player | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) {
        setPlayer(null)
        return
      }
      const { player } = await api.get<MeResponse>('/oauth/me')
      setPlayer(player)
    } catch (err) {
      console.error('[AuthContext] loadMe failed:', err)
      setPlayer(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const signIn = useCallback(async (token: string) => {
    await setToken(token)
    await loadMe()
  }, [loadMe])

  const signOut = useCallback(async () => {
    const token = await getToken()

    // Revoke the DGU token server-side and clear the cookie
    await fetch(`${PRODUCTION_API_HOST}/oauth/logout`, {
      method: 'POST',
      headers: { Cookie: `access_token=${token}` },
    }).catch(() => {})

    await clearToken()
    setPlayer(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        player,
        isLoading,
        isAuthenticated: !!player,
        signIn,
        signOut,
        refresh: loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
