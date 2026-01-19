import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Brewer } from "@/lib/types";

function getBrewersCollection(userId: string) {
  return collection(db, "users", userId, "brewers");
}

function getBrewerDoc(userId: string, brewerId: string) {
  return doc(db, "users", userId, "brewers", brewerId);
}

export async function getBrewers(userId: string): Promise<Brewer[]> {
  const brewersRef = getBrewersCollection(userId);
  const q = query(brewersRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Brewer))
    .filter((brewer) => brewer.isActive !== false);
}

export async function getBrewer(
  userId: string,
  brewerId: string
): Promise<Brewer | null> {
  const brewerRef = getBrewerDoc(userId, brewerId);
  const snapshot = await getDoc(brewerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Brewer;
}

export async function addBrewer(
  userId: string,
  brewer: Omit<Brewer, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const brewersRef = getBrewersCollection(userId);

  const docRef = await addDoc(brewersRef, {
    ...brewer,
    isActive: brewer.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBrewer(
  userId: string,
  brewerId: string,
  updates: Partial<Omit<Brewer, "id" | "createdAt">>
): Promise<void> {
  const brewerRef = getBrewerDoc(userId, brewerId);

  await updateDoc(brewerRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveBrewer(
  userId: string,
  brewerId: string
): Promise<void> {
  const brewerRef = getBrewerDoc(userId, brewerId);

  await updateDoc(brewerRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBrewer(
  userId: string,
  brewerId: string
): Promise<void> {
  const brewerRef = getBrewerDoc(userId, brewerId);
  await deleteDoc(brewerRef);
}
