import { Timestamp } from "firebase/firestore";

export interface EquipmentUsage {
  count: number;
  lastUsed: Timestamp;
}

export interface EquipmentStats {
  coffees: Record<string, EquipmentUsage>;
  grinders: Record<string, EquipmentUsage>;
  brewers: Record<string, EquipmentUsage>;
}

export type EquipmentType = "coffees" | "grinders" | "brewers";
