import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryConstraint,
  DocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CoffeeTime } from "@/lib/types";
import { updateAllEquipmentUsage } from "./equipmentStatsService";

export interface GetCoffeeTimesOptions {
  startDate?: Date;
  endDate?: Date;
  coffeeId?: string;
  brewerId?: string;
  grinderId?: string;
  minRating?: number;
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
}

export interface PaginatedCoffeeTimes {
  coffeeTimes: CoffeeTime[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

function getBrewLogsCollection(userId: string) {
  return collection(db, "users", userId, "brewLogs");
}

function getBrewLogDoc(userId: string, brewLogId: string) {
  return doc(db, "users", userId, "brewLogs", brewLogId);
}

export async function getCoffeeTimes(
  userId: string,
  options: GetCoffeeTimesOptions = {}
): Promise<PaginatedCoffeeTimes> {
  const {
    startDate,
    endDate,
    coffeeId,
    brewerId,
    grinderId,
    minRating,
    pageSize = 20,
    lastDoc,
  } = options;

  const brewLogsRef = getBrewLogsCollection(userId);
  const constraints: QueryConstraint[] = [];

  if (startDate) {
    constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
  }

  if (endDate) {
    constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
  }

  if (coffeeId) {
    constraints.push(where("coffeeId", "==", coffeeId));
  }

  if (brewerId) {
    constraints.push(where("brewerId", "==", brewerId));
  }

  if (grinderId) {
    constraints.push(where("grinderId", "==", grinderId));
  }

  if (minRating !== undefined) {
    constraints.push(where("rating", ">=", minRating));
  }

  constraints.push(orderBy("timestamp", "desc"));
  constraints.push(limit(pageSize + 1));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(brewLogsRef, ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const coffeeTimes = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CoffeeTime[];

  return {
    coffeeTimes,
    lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
    hasMore,
  };
}

export async function getCoffeeTime(
  userId: string,
  brewLogId: string
): Promise<CoffeeTime | null> {
  const brewLogRef = getBrewLogDoc(userId, brewLogId);
  const snapshot = await getDoc(brewLogRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CoffeeTime;
}

function calculateExtraction(
  tdsPercent?: number | null,
  waterGrams?: number | null,
  doseGrams?: number | null
): number | null {
  if (!tdsPercent || !waterGrams || !doseGrams || doseGrams === 0) {
    return null;
  }
  // Extraction % = (TDS% * water) / dose
  return Number(((tdsPercent * waterGrams) / doseGrams).toFixed(2));
}

export async function addCoffeeTime(
  userId: string,
  brewLog: Omit<CoffeeTime, "id" | "createdAt" | "updatedAt">,
  creatorDisplayName?: string | null
): Promise<string> {
  const brewLogsRef = getBrewLogsCollection(userId);

  // Calculate extraction if TDS provided
  const extractionPercent = calculateExtraction(
    brewLog.tdsPercent,
    brewLog.waterGrams,
    brewLog.doseGrams
  );

  const docRef = await addDoc(brewLogsRef, {
    ...brewLog,
    extractionPercent,
    creatorId: userId,
    creatorDisplayName: creatorDisplayName || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update equipment usage stats (fire and forget)
  updateAllEquipmentUsage(
    userId,
    brewLog.coffeeId,
    brewLog.grinderId,
    brewLog.brewerId
  ).catch(console.error);

  return docRef.id;
}

export async function updateCoffeeTime(
  userId: string,
  brewLogId: string,
  updates: Partial<Omit<CoffeeTime, "id" | "createdAt">>
): Promise<void> {
  const brewLogRef = getBrewLogDoc(userId, brewLogId);

  // Recalculate extraction if TDS, water, or dose is updated
  let extractionPercent = updates.extractionPercent;
  if (
    updates.tdsPercent !== undefined ||
    updates.waterGrams !== undefined ||
    updates.doseGrams !== undefined
  ) {
    extractionPercent = calculateExtraction(
      updates.tdsPercent,
      updates.waterGrams,
      updates.doseGrams
    );
  }

  await updateDoc(brewLogRef, {
    ...updates,
    ...(extractionPercent !== undefined && { extractionPercent }),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCoffeeTime(
  userId: string,
  brewLogId: string
): Promise<void> {
  const brewLogRef = getBrewLogDoc(userId, brewLogId);
  await deleteDoc(brewLogRef);
}
