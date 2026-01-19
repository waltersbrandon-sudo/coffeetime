import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile } from "@/lib/types/sharing";

// Generate a unique 6-character profile code (e.g., "JAVA42")
function generateProfileCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed I and O to avoid confusion
  const numbers = "0123456789";

  let code = "";
  // 4 letters + 2 numbers
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

// Get user profile document reference
function getUserDoc(userId: string) {
  return doc(db, "users", userId);
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = getUserDoc(userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as UserProfile;
}

// Create or update user profile
export async function createUserProfile(
  userId: string,
  displayName: string | null,
  photoURL: string | null
): Promise<UserProfile> {
  const existingProfile = await getUserProfile(userId);

  if (existingProfile) {
    // Update existing profile
    await updateDoc(getUserDoc(userId), {
      displayName,
      photoURL,
      updatedAt: serverTimestamp(),
    });

    return {
      ...existingProfile,
      displayName,
      photoURL,
    };
  }

  // Generate a unique profile code
  let profileCode = generateProfileCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existingWithCode = await getUserByProfileCode(profileCode);
    if (!existingWithCode) {
      break;
    }
    profileCode = generateProfileCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique profile code");
  }

  const newProfile: Omit<UserProfile, "id"> = {
    profileCode,
    displayName,
    photoURL,
    isPublic: false,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(getUserDoc(userId), newProfile);

  return {
    id: userId,
    ...newProfile,
  };
}

// Ensure user has a profile (create if doesn't exist)
export async function ensureUserProfile(
  userId: string,
  displayName: string | null,
  photoURL: string | null
): Promise<UserProfile> {
  const existingProfile = await getUserProfile(userId);

  if (existingProfile) {
    return existingProfile;
  }

  return createUserProfile(userId, displayName, photoURL);
}

// Get user by profile code
export async function getUserByProfileCode(
  profileCode: string
): Promise<UserProfile | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("profileCode", "==", profileCode.toUpperCase()));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as UserProfile;
}

// Update profile visibility
export async function updateProfileVisibility(
  userId: string,
  isPublic: boolean
): Promise<void> {
  await updateDoc(getUserDoc(userId), {
    isPublic,
    updatedAt: serverTimestamp(),
  });
}

// Update display name
export async function updateDisplayName(
  userId: string,
  displayName: string
): Promise<void> {
  await updateDoc(getUserDoc(userId), {
    displayName,
    updatedAt: serverTimestamp(),
  });
}
