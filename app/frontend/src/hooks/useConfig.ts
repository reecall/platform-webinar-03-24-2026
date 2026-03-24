import { useState, useEffect, useCallback } from 'react'
import { getHealth } from '@/api/reecall'

interface ConfigState {
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

export function useConfig() {
  const [state, setState] = useState<ConfigState>({
    isConnected: false,
    isLoading: true,
    error: null,
  })

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await getHealth()
      setState({ isConnected: true, isLoading: false, error: null })
    } catch (err) {
      setState({
        isConnected: false,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      })
    }
  }, [])

  useEffect(() => {
    checkHealth() // eslint-disable-line react-hooks/set-state-in-effect -- async setState after await is not synchronous
  }, [checkHealth])

  return { ...state, retry: checkHealth }
}
