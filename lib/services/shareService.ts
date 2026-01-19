import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CoffeeTime } from "@/lib/types";
import { PublicBrew } from "@/lib/types/sharing";

// Generate a random alphanumeric string
function generateShareId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Collection reference
function getPublicBrewsCollection() {
  return collection(db, "publicBrews");
}

function getPublicBrewDoc(shareId: string) {
  return doc(db, "publicBrews", shareId);
}

// Create a public share for a brew
export async function createPublicShare(
  userId: string,
  userDisplayName: string | null,
  brew: CoffeeTime
): Promise<string> {
  // Check if this brew is already shared
  const existingShare = await getPublicShareByBrewId(userId, brew.id);
  if (existingShare) {
    return existingShare.shareId;
  }

  // Generate a unique share ID
  let shareId = generateShareId();
  let attempts = 0;
  const maxAttempts = 5;

  // Ensure uniqueness
  while (attempts < maxAttempts) {
    const existingDoc = await getDoc(getPublicBrewDoc(shareId));
    if (!existingDoc.exists()) {
      break;
    }
    shareId = generateShareId();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique share ID");
  }

  const publicBrew: Omit<PublicBrew, "shareId"> = {
    originalBrewId: brew.id,
    ownerUserId: userId,
    ownerDisplayName: userDisplayName,
    brew: brew,
    createdAt: serverTimestamp() as any,
    viewCount: 0,
  };

  await setDoc(getPublicBrewDoc(shareId), {
    shareId,
    ...publicBrew,
  });

  return shareId;
}

// Get a public brew by share ID (no auth required)
export async function getPublicBrew(shareId: string): Promise<PublicBrew | null> {
  const docRef = getPublicBrewDoc(shareId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as PublicBrew;
}

// Increment view count for a public brew
export async function incrementViewCount(shareId: string): Promise<void> {
  const docRef = getPublicBrewDoc(shareId);
  await setDoc(docRef, { viewCount: increment(1) }, { merge: true });
}

// Get public share by original brew ID
export async function getPublicShareByBrewId(
  userId: string,
  brewId: string
): Promise<PublicBrew | null> {
  const q = query(
    getPublicBrewsCollection(),
    where("ownerUserId", "==", userId),
    where("originalBrewId", "==", brewId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as PublicBrew;
}

// Delete a public share
export async function deletePublicShare(
  userId: string,
  shareId: string
): Promise<void> {
  const publicBrew = await getPublicBrew(shareId);

  if (!publicBrew) {
    throw new Error("Share not found");
  }

  if (publicBrew.ownerUserId !== userId) {
    throw new Error("You do not have permission to delete this share");
  }

  await deleteDoc(getPublicBrewDoc(shareId));
}

// Get all public shares for a user
export async function getUserPublicShares(userId: string): Promise<PublicBrew[]> {
  const q = query(
    getPublicBrewsCollection(),
    where("ownerUserId", "==", userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as PublicBrew);
}
