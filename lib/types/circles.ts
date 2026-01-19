import { Timestamp } from "firebase/firestore";
import { CoffeeTime } from "./index";

export type CircleRole = "admin" | "contributor" | "viewer";

export interface Circle {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  inviteCode: string;
  memberCount: number;
  brewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CircleMember {
  id: string; // userId
  role: CircleRole;
  joinedAt: Timestamp;
  displayName: string | null;
}

export interface CircleBrew {
  id: string;
  brew: CoffeeTime;
  postedBy: string;
  postedByName: string | null;
  postedAt: Timestamp;
}

// User's circle membership (stored in users/{userId}/circleMembers/)
export interface UserCircleMembership {
  id: string; // circleId
  circleName: string;
  role: CircleRole;
  joinedAt: Timestamp;
}
