import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Follower, Following, FeedBrew } from "@/lib/types/sharing";
import { CoffeeTime } from "@/lib/types";
import { getUserByProfileCode, getUserProfile } from "./userProfileService";

// Collection references
function getFollowersCollection(userId: string) {
  return collection(db, "users", userId, "followers");
}

function getFollowingCollection(userId: string) {
  return collection(db, "users", userId, "following");
}

function getFollowerDoc(userId: string, followerId: string) {
  return doc(db, "users", userId, "followers", followerId);
}

function getFollowingDoc(userId: string, followedId: string) {
  return doc(db, "users", userId, "following", followedId);
}

// Follow a user by their profile code
export async function followUser(
  currentUserId: string,
  currentUserDisplayName: string | null,
  profileCode: string
): Promise<void> {
  // Find the user by profile code
  const targetUser = await getUserByProfileCode(profileCode);

  if (!targetUser) {
    throw new Error("User not found with that profile code");
  }

  if (targetUser.id === currentUserId) {
    throw new Error("You cannot follow yourself");
  }

  // Check if already following
  const existingFollowing = await getDoc(getFollowingDoc(currentUserId, targetUser.id));
  if (existingFollowing.exists()) {
    throw new Error("You are already following this user");
  }

  const now = serverTimestamp();

  // Add to current user's following list
  const followingData: Omit<Following, "id"> = {
    followedAt: now as any,
    followedDisplayName: targetUser.displayName,
    followedProfileCode: targetUser.profileCode,
  };

  await setDoc(getFollowingDoc(currentUserId, targetUser.id), followingData);

  // Add to target user's followers list
  const followerData: Omit<Follower, "id"> = {
    followedAt: now as any,
    followerDisplayName: currentUserDisplayName,
  };

  await setDoc(getFollowerDoc(targetUser.id, currentUserId), followerData);
}

// Unfollow a user
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  // Remove from current user's following list
  await deleteDoc(getFollowingDoc(currentUserId, targetUserId));

  // Remove from target user's followers list
  await deleteDoc(getFollowerDoc(targetUserId, currentUserId));
}

// Get list of users the current user is following
export async function getFollowing(userId: string): Promise<Following[]> {
  const followingRef = getFollowingCollection(userId);
  const q = query(followingRef, orderBy("followedAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Following[];
}

// Get list of followers for a user
export async function getFollowers(userId: string): Promise<Follower[]> {
  const followersRef = getFollowersCollection(userId);
  const q = query(followersRef, orderBy("followedAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Follower[];
}

// Check if current user is following target user
export async function isFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  const followingDoc = await getDoc(getFollowingDoc(currentUserId, targetUserId));
  return followingDoc.exists();
}

// Get feed of brews from followed users
export async function getFollowingFeed(
  userId: string,
  limitCount: number = 50
): Promise<FeedBrew[]> {
  // First get all users being followed
  const following = await getFollowing(userId);

  if (following.length === 0) {
    return [];
  }

  // Get recent brews from each followed user
  const feedBrews: FeedBrew[] = [];

  for (const followed of following) {
    try {
      // Get the followed user's profile to check if they're public
      const profile = await getUserProfile(followed.id);

      if (!profile || !profile.isPublic) {
        // Skip non-public users
        continue;
      }

      // Get their recent brews
      const brewLogsRef = collection(db, "users", followed.id, "brewLogs");
      const q = query(
        brewLogsRef,
        orderBy("timestamp", "desc"),
        limit(10) // Get last 10 brews per user
      );

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const brew = {
          id: doc.id,
          ...doc.data(),
        } as CoffeeTime;

        feedBrews.push({
          id: `${followed.id}_${brew.id}`,
          brew,
          userId: followed.id,
          userDisplayName: followed.followedDisplayName,
          userProfileCode: followed.followedProfileCode,
          timestamp: brew.timestamp,
        });
      }
    } catch (error) {
      console.error(`Error fetching brews for user ${followed.id}:`, error);
      // Continue with other users
    }
  }

  // Sort by timestamp descending and limit
  feedBrews.sort((a, b) => {
    const aTime = a.timestamp?.toMillis() || 0;
    const bTime = b.timestamp?.toMillis() || 0;
    return bTime - aTime;
  });

  return feedBrews.slice(0, limitCount);
}

// Get following count
export async function getFollowingCount(userId: string): Promise<number> {
  const followingRef = getFollowingCollection(userId);
  const snapshot = await getDocs(followingRef);
  return snapshot.size;
}

// Get followers count
export async function getFollowersCount(userId: string): Promise<number> {
  const followersRef = getFollowersCollection(userId);
  const snapshot = await getDocs(followersRef);
  return snapshot.size;
}
