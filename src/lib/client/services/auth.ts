import { dev } from '$app/environment';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { firebaseApp } from './firebaseApp';

const auth = getAuth(firebaseApp);

if (dev) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export async function signUp(email: string, password: string): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log(userCredential.user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

export async function signInWithGoogle(): Promise<void> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    console.log(credential, user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

export function signOut(): void {
  auth.signOut();
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
}
