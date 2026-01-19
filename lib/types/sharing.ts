import { Timestamp } from "firebase/firestore";
import { CoffeeTime } from "./index";

// Public Brew (shared via link)
export interface PublicBrew {
  shareId: string;
  originalBrewId: string;
  ownerUserId: string;
  ownerDisplayName: string | null;
  brew: CoffeeTime;
  createdAt: Timestamp;
  viewCount: number;
}

export interface ShareOptions {
  includeNotes?: boolean;
}

// User Profile for social features
export interface UserProfile {
  id: string;
  profileCode: string; // Unique 6-char code, e.g., "JAVA42"
  displayName: string | null;
  photoURL: string | null;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Following relationships
export interface Follower {
  id: string; // The follower's userId
  followedAt: Timestamp;
  followerDisplayName: string | null;
}

export interface Following {
  id: string; // The followed user's userId
  followedAt: Timestamp;
  followedDisplayName: string | null;
  followedProfileCode: string;
}

// Feed item (brew from followed user)
export interface FeedBrew {
  id: string;
  brew: CoffeeTime;
  userId: string;
  userDisplayName: string | null;
  userProfileCode: string;
  timestamp: Timestamp;
}
