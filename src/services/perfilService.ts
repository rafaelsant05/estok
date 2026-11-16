import AsyncStorage from '@react-native-async-storage/async-storage';
import {
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

const CHAVE_PERFIL = 'estok:perfil:';

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

function chavePerfil(uid: string) {
  return `${CHAVE_PERFIL}${uid}`;
}

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
    const salvo = await AsyncStorage.getItem(chavePerfil(uid));
    if (!salvo) return null;

    const dados = JSON.parse(salvo) as Partial<PerfilEmCache>;
    if (!dados.perfil || typeof dados.perfil !== 'object') return null;
    const campos = dados.perfil as Partial<PerfilUsuario>;

    return {
      perfil: {
        displayName: texto(campos.displayName, ''),
        photoUrl: typeof campos.photoUrl === 'string' ? campos.photoUrl : null,
        cpf: texto(campos.cpf, ''),
        role: texto(campos.role, ''),
        storeName: texto(campos.storeName, ''),
        defaultMinStock: estoqueMinimo(campos.defaultMinStock),
      },
      sincronizacaoPendente: dados.sincronizacaoPendente === true,
    };
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
    chavePerfil(uid),
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
    displayName: texto(dados.displayName, perfilLocal.displayName || perfilAuth.displayName),
    photoUrl: fotoRemota || perfilLocal.photoUrl || perfilAuth.photoUrl,
    cpf: texto(dados.cpf, perfilLocal.cpf),
    role: texto(dados.role, perfilLocal.role),
    storeName: texto(dados.storeName, perfilLocal.storeName),
    defaultMinStock:
      dados.defaultMinStock === null
        ? null
        : estoqueMinimo(dados.defaultMinStock) ?? perfilLocal.defaultMinStock,
  };
}

async function sincronizarPerfil(uid: string, perfil: PerfilUsuario) {
  await setDoc(
    doc(db, 'users', uid),
    {
      ...perfil,
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

  if (cache?.sincronizacaoPendente) {
    try {
      await sincronizarPerfil(uid, cache.perfil);
      await salvarCache(uid, cache.perfil, false);
      return { perfil: cache.perfil };
    } catch (erro) {
      return { perfil: cache.perfil, erro };
    }
  }

  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    const dados = snapshot.exists() ? snapshot.data() : {};
    const perfil = perfilDoFirestore(
      dados,
      cache?.perfil ?? criarPerfilPadrao(),
      perfilAuth,
    );
    await salvarCache(uid, perfil, false);
    return { perfil };
  } catch (erro) {
    return {
      perfil: cache?.perfil ?? perfilAuth,
      erro,
    };
  }
}

export async function salvarPerfilUsuario(uid: string, perfil: PerfilUsuario) {
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
