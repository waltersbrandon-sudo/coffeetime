import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CoffeeTime } from "@/lib/types";
import { CircleBrew } from "@/lib/types/circles";

export interface ImportedBrewData {
  circleId: string;
  circleName: string;
  originalBrewId: string;
  originalCreatorId: string;
  originalCreatorName: string;
}

export async function importBrewFromCircle(
  userId: string,
  circleBrew: CircleBrew,
  circleId: string,
  circleName: string
): Promise<string> {
  const brewLogsRef = collection(db, "users", userId, "brewLogs");

  const { brew, postedBy, postedByName } = circleBrew;

  // Create new brew with import metadata
  const importedBrew = {
    timestamp: brew.timestamp,
    coffeeId: brew.coffeeId || null,
    coffeeName: brew.coffeeName || null,
    grinderId: brew.grinderId || null,
    grinderName: brew.grinderName || null,
    brewerId: brew.brewerId || null,
    brewerName: brew.brewerName || null,
    doseGrams: brew.doseGrams || null,
    waterGrams: brew.waterGrams || null,
    ratio: brew.ratio || null,
    waterTempF: brew.waterTempF || null,
    waterTempC: brew.waterTempC || null,
    grindSetting: brew.grindSetting || null,
    bloomTimeSeconds: brew.bloomTimeSeconds || null,
    bloomWaterGrams: brew.bloomWaterGrams || null,
    totalTimeSeconds: brew.totalTimeSeconds || null,
    techniqueNotes: brew.techniqueNotes || null,
    tastingNotes: brew.tastingNotes || null,
    rating: brew.rating || null,
    tdsPercent: brew.tdsPercent || null,
    extractionPercent: brew.extractionPercent || null,
    // Import tracking
    importedFrom: {
      circleId,
      circleName,
      originalBrewId: brew.id,
      originalCreatorId: postedBy,
      originalCreatorName: postedByName || "Unknown",
      importedAt: Timestamp.now(),
    },
    // Set the importer as the creator
    creatorId: userId,
    creatorDisplayName: null, // Will be set by caller if needed
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(brewLogsRef, importedBrew);
  return docRef.id;
}

export async function removeImportedBrew(
  userId: string,
  brewLogId: string
): Promise<void> {
  const brewLogRef = doc(db, "users", userId, "brewLogs", brewLogId);
  await deleteDoc(brewLogRef);
}

export async function isBrewAlreadyImported(
  userId: string,
  originalBrewId: string
): Promise<boolean> {
  const brewLogsRef = collection(db, "users", userId, "brewLogs");
  const q = query(
    brewLogsRef,
    where("importedFrom.originalBrewId", "==", originalBrewId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
