import { useEffect, useState } from 'react'
import { usePageRefreshVersion } from './usePageRefresh'

export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: readonly unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageRefreshVersion = usePageRefreshVersion()

  useEffect(() => {
    let active = true

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const result = await load()
        if (active) setData(result)
      } catch (cause) {
        if (active) {
          const message =
            cause instanceof Error ? cause.message : 'Unable to load data.'
          setError(message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [...deps, pageRefreshVersion])

  return { data, loading, error }
}
