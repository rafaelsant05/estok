import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore: getReactNativePersistence existe no build nativo, mas não nos tipos
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type FirebaseEnvKey =
  | 'EXPO_PUBLIC_FIREBASE_API_KEY'
  | 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'
  | 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'
  | 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  | 'EXPO_PUBLIC_FIREBASE_APP_ID';

function obterEnv(chave: FirebaseEnvKey): string {
  const valor = process.env[chave]?.trim();
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${chave} não configurada. Verifique o arquivo .env e as chaves do Firebase.`,
    );
  }
  return valor;
}

export const firebaseConfig: FirebaseOptions = {
  apiKey: obterEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: obterEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: obterEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
  messagingSenderId: obterEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: obterEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function criarAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = criarAuth();
export const db = getFirestore(app);