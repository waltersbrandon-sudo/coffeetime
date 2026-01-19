import { Timestamp } from "firebase/firestore";

export interface Coffee {
  id: string;
  name: string;
  roaster?: string | null;
  origin?: string | null;
  region?: string | null;
  farm?: string | null;
  process?: string | null;
  variety?: string | null;
  elevation?: number | null;
  roastLevel?: string | null;
  roastDate?: Timestamp | null;
  flavorNotes?: string[] | null;
  photoURL?: string | null;
  thumbnailURL?: string | null;  // AI-generated or uploaded thumbnail in Firebase Storage
  notes?: string | null;
  isActive?: boolean | null;
  isCatalogItem?: boolean | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Grinder {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  type?: string | null;
  burrType?: string | null;
  burrSize?: number | null;
  settingsMin?: number | null;
  settingsMax?: number | null;
  settingsType?: string | null;
  photoURL?: string | null;
  thumbnailURL?: string | null;  // AI-generated or uploaded thumbnail in Firebase Storage
  notes?: string | null;
  isActive?: boolean | null;
  isCatalogItem?: boolean | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Brewer {
  id: string;
  name: string;
  brand?: string | null;
  type?: string | null;
  material?: string | null;
  capacityMl?: number | null;
  filterType?: string | null;
  photoURL?: string | null;
  thumbnailURL?: string | null;  // AI-generated or uploaded thumbnail in Firebase Storage
  notes?: string | null;
  isActive?: boolean | null;
  isCatalogItem?: boolean | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CoffeeTime {
  id: string;
  timestamp: Timestamp;
  coffeeId?: string | null;
  coffeeName?: string | null;
  grinderId?: string | null;
  grinderName?: string | null;
  brewerId?: string | null;
  brewerName?: string | null;
  doseGrams?: number | null;
  waterGrams?: number | null;
  ratio?: number | null;
  waterTempF?: number | null;
  waterTempC?: number | null;
  grindSetting?: number | null;
  bloomTimeSeconds?: number | null;
  bloomWaterGrams?: number | null;
  totalTimeSeconds?: number | null;
  techniqueNotes?: string | null;
  tastingNotes?: string | null;
  rating?: number | null;
  photoURL?: string | null;
  rawVoiceInput?: string | null;
  // TDS & Extraction
  tdsPercent?: number | null;
  extractionPercent?: number | null;
  // Creator identity
  creatorId?: string | null;
  creatorDisplayName?: string | null;
  // Import tracking
  importedFrom?: {
    circleId: string;
    circleName: string;
    originalBrewId: string;
    originalCreatorId: string;
    originalCreatorName: string;
    importedAt: Timestamp;
  } | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
