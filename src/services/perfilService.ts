import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import {
  getDownloadURL,
  getStorage,
  ref,
  StringFormat,
  uploadString,
} from 'firebase/storage';
import { auth, app, db, firebaseConfig } from './firebase';
import { criarPerfilPadrao, PerfilUsuario } from '../store/useAuthStore';
import { chavePerfilStorage } from '../constants/storageKeys';

type PerfilEmCache = {
  perfil: PerfilUsuario;
  sincronizacaoPendente: boolean;
};

type ResultadoCarregamento = {
  perfil: PerfilUsuario;
  erro?: unknown;
};

export type ResultadoFoto = {
  photoUrl: string;
  somenteLocal: boolean;
  erro?: unknown;
};

function texto(valor: unknown, fallback: string): string {
  return typeof valor === 'string' ? valor : fallback;
}

function estoqueMinimo(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0
    ? valor
    : null;
}

async function lerCache(uid: string): Promise<PerfilEmCache | null> {
  try {
    const salvo = await AsyncStorage.getItem(chavePerfilStorage(uid));
    if (!salvo) return null;

    const dados = JSON.parse(salvo) as Partial<PerfilEmCache>;
    if (!dados.perfil || typeof dados.perfil !== 'object') return null;
    const campos = dados.perfil as Partial<PerfilUsuario>;

    const perfil: PerfilUsuario = {
      displayName: texto(campos.displayName, ''),
      photoUrl: typeof campos.photoUrl === 'string' ? campos.photoUrl : null,
      storeName: texto(campos.storeName, ''),
      defaultMinStock: estoqueMinimo(campos.defaultMinStock),
      onboardingConcluido:
        typeof campos.onboardingConcluido === 'boolean'
          ? campos.onboardingConcluido
          : undefined,
    };
    const sincronizacaoPendente = dados.sincronizacaoPendente === true;
    if ('cpf' in campos || 'role' in campos) {
      await salvarCache(uid, perfil, sincronizacaoPendente);
    }
    return { perfil, sincronizacaoPendente };
  } catch (erro) {
    console.warn('Não foi possível ler o perfil salvo neste dispositivo.', erro);
    return null;
  }
}

async function salvarCache(
  uid: string,
  perfil: PerfilUsuario,
  sincronizacaoPendente: boolean,
) {
  await AsyncStorage.setItem(
    chavePerfilStorage(uid),
    JSON.stringify({ perfil, sincronizacaoPendente } satisfies PerfilEmCache),
  );
}

function perfilDoFirestore(
  dados: Record<string, unknown>,
  perfilLocal: PerfilUsuario,
  perfilAuth: PerfilUsuario,
): PerfilUsuario {
  const fotoRemota = texto(dados.photoUrl, '');
  return {
    displayName: texto(
      dados.nome,
      texto(dados.displayName, perfilLocal.displayName || perfilAuth.displayName),
    ),
    photoUrl: fotoRemota || perfilLocal.photoUrl || perfilAuth.photoUrl,
    storeName: texto(dados.storeName, perfilLocal.storeName),
    defaultMinStock:
      dados.defaultMinStock === null
        ? null
        : estoqueMinimo(dados.defaultMinStock) ?? perfilLocal.defaultMinStock,
    onboardingConcluido:
      typeof dados.onboardingConcluido === 'boolean'
        ? dados.onboardingConcluido
        : undefined,
  };
}

async function sincronizarPerfil(uid: string, perfil: PerfilUsuario) {
  await setDoc(
    doc(db, 'users', uid),
    {
      nome: perfil.displayName,
      storeName: perfil.storeName,
      defaultMinStock: perfil.defaultMinStock,
      ...(typeof perfil.onboardingConcluido === 'boolean'
        ? { onboardingConcluido: perfil.onboardingConcluido }
        : {}),
      cpf: deleteField(),
      role: deleteField(),
      photoUrl: perfil.photoUrl?.startsWith('http') ? perfil.photoUrl : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function carregarPerfilUsuario(
  uid: string,
  displayNameAuth: string | null,
  photoUrlAuth: string | null,
): Promise<ResultadoCarregamento> {
  const cache = await lerCache(uid);
  const perfilAuth = {
    ...criarPerfilPadrao(),
    displayName: displayNameAuth ?? '',
    photoUrl: photoUrlAuth,
  };

  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    const dados = snapshot.exists() ? snapshot.data() : {};

    if (snapshot.exists() && ('cpf' in dados || 'role' in dados)) {
      try {
        await setDoc(
          doc(db, 'users', uid),
          { cpf: deleteField(), role: deleteField() },
          { merge: true },
        );
      } catch (erro) {
        console.warn('Não foi possível remover campos legados do perfil.', erro);
      }
    }

    if (!snapshot.exists() && cache?.sincronizacaoPendente) {
      return { perfil: cache.perfil };
    }

    if (cache?.sincronizacaoPendente) {
      try {
        await sincronizarPerfil(uid, cache.perfil);
        await salvarCache(uid, cache.perfil, false);
        return { perfil: cache.perfil };
      } catch (erro) {
        return { perfil: cache.perfil, erro };
      }
    }

    const perfil = perfilDoFirestore(
      dados,
      cache?.perfil ?? criarPerfilPadrao(),
      perfilAuth,
    );
    try {
      await salvarCache(uid, perfil, false);
    } catch (erro) {
      return { perfil, erro };
    }
    return { perfil };
  } catch (erro) {
    return {
      perfil: cache?.perfil ?? perfilAuth,
      erro,
    };
  }
}

export async function salvarPerfilUsuario(
  uid: string,
  perfil: PerfilUsuario,
  exigirSincronizacao = false,
) {
  if (exigirSincronizacao) {
    await sincronizarPerfil(uid, perfil);
    await salvarCache(uid, perfil, false);
  } else {
    await salvarCache(uid, perfil, true);

    try {
      await sincronizarPerfil(uid, perfil);
    } catch (erro) {
      return { sincronizado: false, erro };
    }

    try {
      await salvarCache(uid, perfil, false);
    } catch (erro) {
      console.warn('O perfil foi sincronizado, mas o cache local não foi atualizado.', erro);
    }
  }

  const usuarioAtual = auth.currentUser;
  if (usuarioAtual?.uid === uid) {
    try {
      await updateProfile(usuarioAtual, {
        displayName: perfil.displayName,
        photoURL: perfil.photoUrl?.startsWith('http') ? perfil.photoUrl : null,
      });
    } catch (erro) {
      console.warn('Não foi possível atualizar o perfil do Firebase Authentication.', erro);
    }
  }

  return { sincronizado: true };
}

export async function salvarFotoPerfil(
  uid: string,
  uri: string,
  base64: string | null | undefined,
  mimeType: string | null | undefined,
): Promise<ResultadoFoto> {
  if (!firebaseConfig.storageBucket || !base64) {
    return { photoUrl: uri, somenteLocal: true };
  }

  try {
    const referencia = ref(getStorage(app), `users/${uid}/profile/avatar.jpg`);
    await uploadString(referencia, base64, StringFormat.BASE64, {
      contentType: mimeType || 'image/jpeg',
    });
    return {
      photoUrl: await getDownloadURL(referencia),
      somenteLocal: false,
    };
  } catch (erro) {
    return { photoUrl: uri, somenteLocal: true, erro };
  }
}
