import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase/config";

export type ItemType = "coffee" | "grinder" | "brewer";

/**
 * Get the storage path for a thumbnail
 */
function getThumbnailPath(
  userId: string | "catalog",
  type: ItemType,
  itemId: string
): string {
  const typeFolder = type === "coffee" ? "coffees" : type === "grinder" ? "grinders" : "brewers";

  if (userId === "catalog") {
    return `thumbnails/catalog/${typeFolder}/${itemId}.jpg`;
  }
  return `thumbnails/users/${userId}/${typeFolder}/${itemId}.jpg`;
}

/**
 * Convert a base64 string to a Blob
 */
export function base64ToBlob(base64: string, mimeType: string = "image/jpeg"): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Upload a thumbnail to Firebase Storage
 * @returns The download URL of the uploaded thumbnail
 */
export async function uploadThumbnail(
  userId: string | "catalog",
  type: ItemType,
  itemId: string,
  imageBlob: Blob
): Promise<string> {
  const path = getThumbnailPath(userId, type, itemId);
  const storageRef = ref(storage, path);

  const metadata = {
    contentType: imageBlob.type || "image/jpeg",
    customMetadata: {
      userId: userId,
      itemType: type,
      itemId: itemId,
      uploadedAt: new Date().toISOString(),
    },
  };

  await uploadBytes(storageRef, imageBlob, metadata);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}

/**
 * Delete a thumbnail from Firebase Storage
 */
export async function deleteThumbnail(
  userId: string | "catalog",
  type: ItemType,
  itemId: string
): Promise<void> {
  const path = getThumbnailPath(userId, type, itemId);
  const storageRef = ref(storage, path);

  try {
    await deleteObject(storageRef);
  } catch (error: unknown) {
    // Ignore "object-not-found" errors - the file may not exist
    if (error instanceof Error && error.message.includes("object-not-found")) {
      return;
    }
    throw error;
  }
}

/**
 * Get the download URL for a thumbnail
 * @returns The download URL or null if not found
 */
export async function getThumbnailURL(
  userId: string | "catalog",
  type: ItemType,
  itemId: string
): Promise<string | null> {
  const path = getThumbnailPath(userId, type, itemId);
  const storageRef = ref(storage, path);

  try {
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error: unknown) {
    // Return null if the file doesn't exist
    if (error instanceof Error && error.message.includes("object-not-found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Upload a thumbnail from a base64 string
 * @returns The download URL of the uploaded thumbnail
 */
export async function uploadThumbnailFromBase64(
  userId: string | "catalog",
  type: ItemType,
  itemId: string,
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const blob = base64ToBlob(base64Image, mimeType);
  return uploadThumbnail(userId, type, itemId, blob);
}
