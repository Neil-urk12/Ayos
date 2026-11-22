import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

/**
 * Metro resolves @firebase/auth to its React Native build, which exports
 * getReactNativePersistence. TypeScript picks the package's top-level browser
 * `types` entry instead, so the function is missing from the types. This
 * declares it with the same signature as the RN build.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
