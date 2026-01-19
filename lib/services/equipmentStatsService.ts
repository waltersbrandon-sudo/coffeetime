import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { EquipmentStats, EquipmentType, EquipmentUsage } from "@/lib/types/equipmentStats";

function getStatsDoc(userId: string) {
  return doc(db, "users", userId, "equipmentStats", "stats");
}

export async function getEquipmentStats(userId: string): Promise<EquipmentStats> {
  const statsRef = getStatsDoc(userId);
  const snapshot = await getDoc(statsRef);

  if (!snapshot.exists()) {
    return {
      coffees: {},
      grinders: {},
      brewers: {},
    };
  }

  return snapshot.data() as EquipmentStats;
}

export async function updateEquipmentUsage(
  userId: string,
  equipmentType: EquipmentType,
  equipmentId: string
): Promise<void> {
  if (!equipmentId) return;

  const statsRef = getStatsDoc(userId);
  const snapshot = await getDoc(statsRef);

  const currentStats: EquipmentStats = snapshot.exists()
    ? (snapshot.data() as EquipmentStats)
    : { coffees: {}, grinders: {}, brewers: {} };

  const currentUsage = currentStats[equipmentType][equipmentId] || { count: 0 };
  const newUsage: EquipmentUsage = {
    count: currentUsage.count + 1,
    lastUsed: Timestamp.now(),
  };

  await setDoc(
    statsRef,
    {
      [equipmentType]: {
        ...currentStats[equipmentType],
        [equipmentId]: newUsage,
      },
    },
    { merge: true }
  );
}

export async function updateAllEquipmentUsage(
  userId: string,
  coffeeId?: string | null,
  grinderId?: string | null,
  brewerId?: string | null
): Promise<void> {
  const updates: Promise<void>[] = [];

  if (coffeeId) {
    updates.push(updateEquipmentUsage(userId, "coffees", coffeeId));
  }
  if (grinderId) {
    updates.push(updateEquipmentUsage(userId, "grinders", grinderId));
  }
  if (brewerId) {
    updates.push(updateEquipmentUsage(userId, "brewers", brewerId));
  }

  await Promise.all(updates);
}
