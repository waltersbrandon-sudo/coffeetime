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
import { Grinder } from "@/lib/types";

function getGrindersCollection(userId: string) {
  return collection(db, "users", userId, "grinders");
}

function getGrinderDoc(userId: string, grinderId: string) {
  return doc(db, "users", userId, "grinders", grinderId);
}

export async function getGrinders(userId: string): Promise<Grinder[]> {
  const grindersRef = getGrindersCollection(userId);
  const q = query(grindersRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Grinder))
    .filter((grinder) => grinder.isActive !== false);
}

export async function getGrinder(
  userId: string,
  grinderId: string
): Promise<Grinder | null> {
  const grinderRef = getGrinderDoc(userId, grinderId);
  const snapshot = await getDoc(grinderRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Grinder;
}

export async function addGrinder(
  userId: string,
  grinder: Omit<Grinder, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const grindersRef = getGrindersCollection(userId);

  const docRef = await addDoc(grindersRef, {
    ...grinder,
    isActive: grinder.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateGrinder(
  userId: string,
  grinderId: string,
  updates: Partial<Omit<Grinder, "id" | "createdAt">>
): Promise<void> {
  const grinderRef = getGrinderDoc(userId, grinderId);

  await updateDoc(grinderRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveGrinder(
  userId: string,
  grinderId: string
): Promise<void> {
  const grinderRef = getGrinderDoc(userId, grinderId);

  await updateDoc(grinderRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGrinder(
  userId: string,
  grinderId: string
): Promise<void> {
  const grinderRef = getGrinderDoc(userId, grinderId);
  await deleteDoc(grinderRef);
}
