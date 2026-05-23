import { MMKV } from 'react-native-mmkv'

export const mmkvCache = new MMKV({ id: 'simon_cache' })

export const mmkvCacheStorage = {
  getItem: (key: string): string | null => mmkvCache.getString(key) ?? null,
  setItem: (key: string, value: string): void => mmkvCache.set(key, value),
  removeItem: (key: string): void => mmkvCache.delete(key),
}
