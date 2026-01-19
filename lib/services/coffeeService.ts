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
import { Coffee } from "@/lib/types";

function getCoffeesCollection(userId: string) {
  return collection(db, "users", userId, "coffees");
}

function getCoffeeDoc(userId: string, coffeeId: string) {
  return doc(db, "users", userId, "coffees", coffeeId);
}

export async function getCoffees(userId: string): Promise<Coffee[]> {
  const coffeesRef = getCoffeesCollection(userId);
  const q = query(coffeesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Coffee))
    .filter((coffee) => coffee.isActive !== false);
}

export async function getCoffee(
  userId: string,
  coffeeId: string
): Promise<Coffee | null> {
  const coffeeRef = getCoffeeDoc(userId, coffeeId);
  const snapshot = await getDoc(coffeeRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Coffee;
}

export async function addCoffee(
  userId: string,
  coffee: Omit<Coffee, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const coffeesRef = getCoffeesCollection(userId);

  const docRef = await addDoc(coffeesRef, {
    ...coffee,
    isActive: coffee.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCoffee(
  userId: string,
  coffeeId: string,
  updates: Partial<Omit<Coffee, "id" | "createdAt">>
): Promise<void> {
  const coffeeRef = getCoffeeDoc(userId, coffeeId);

  await updateDoc(coffeeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveCoffee(
  userId: string,
  coffeeId: string
): Promise<void> {
  const coffeeRef = getCoffeeDoc(userId, coffeeId);

  await updateDoc(coffeeRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCoffee(
  userId: string,
  coffeeId: string
): Promise<void> {
  const coffeeRef = getCoffeeDoc(userId, coffeeId);
  await deleteDoc(coffeeRef);
}
