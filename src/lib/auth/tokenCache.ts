import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const createTokenCache = () => {
  return {
    async getToken(key: string) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (err) {
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (err) {
        // ignore write error
      }
    },
    async clearToken(key: string) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (err) {
        // ignore delete error
      }
    },
  };
};

// SecureStore is not supported on web; Clerk handles storage automatically on web
export const tokenCache = Platform.OS !== "web" ? createTokenCache() : undefined;
