import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
  query,
  type WhereFilterOp,
  QueryConstraint,
  limit,
  where,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { firebaseApp } from './firebaseApp';
import { env } from '$env/dynamic/public';
import { dev } from '$app/environment';

export { arrayUnion } from 'firebase/firestore';

export const db = getFirestore(firebaseApp);
if (dev && env.PUBLIC_FIREBASE_USE_EMULATOR && !(db as any)._settingsFrozen) {
  // https://stackoverflow.com/a/74723593/9967802
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export function generateId(): string {
  return doc(collection(db, 'fake_path')).id;
}

export async function add(path: string, data: any): Promise<string> {
  const col = collection(db, path);
  const ref = await addDoc(col, data);
  return ref.id;
}

export async function set(path: string, data: any): Promise<void> {
  const ref = doc(db, path);
  await setDoc(ref, data);
}

export async function update(path: string, data: any): Promise<void> {
  const docRef = doc(db, path);
  await updateDoc(docRef, data);
}

export async function remove(path: string): Promise<void> {
  const docRef = doc(db, path);
  await deleteDoc(docRef);
}

export function subscribeToCollection<T>(
  params: {
    path: string;
    limit?: number;
    where?: { field: string; op: WhereFilterOp; value: unknown }[];
    orderBy?: { field: string; direction: 'asc' | 'desc' };
  },
  callback: (data: T[]) => void,
): () => void {
  const col = collection(db, params.path);
  const queryConstraints: QueryConstraint[] = [];
  if (params.limit) {
    queryConstraints.push(limit(params.limit));
  }
  if (params.where) {
    for (const { field, op, value } of params.where) {
      queryConstraints.push(where(field, op, value));
    }
  }
  if (params.orderBy) {
    queryConstraints.push(orderBy(params.orderBy.field, params.orderBy.direction));
  }
  const q = query(col, ...queryConstraints);
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    callback(data);
  });
}

export function subscribeToDocument<T>(path: string, callback: (data: T) => void): () => void {
  const docRef = doc(db, path);
  return onSnapshot(docRef, doc => {
    const data = { ...doc.data(), id: doc.id } as T;
    callback(data);
  });
}
