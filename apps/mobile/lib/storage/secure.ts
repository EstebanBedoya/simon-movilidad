import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'simon_jwt'

export const secureStorage = {
  getToken: (): Promise<string | null> => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string): Promise<void> => SecureStore.setItemAsync(TOKEN_KEY, token),
  removeToken: (): Promise<void> => SecureStore.deleteItemAsync(TOKEN_KEY),
}
