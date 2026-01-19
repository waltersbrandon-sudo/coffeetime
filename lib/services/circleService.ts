import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CoffeeTime } from "@/lib/types";
import {
  Circle,
  CircleMember,
  CircleBrew,
  CircleRole,
  UserCircleMembership,
} from "@/lib/types/circles";

// Generate a random alphanumeric invite code
function generateInviteCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Collection references
function getCirclesCollection() {
  return collection(db, "circles");
}

function getCircleDoc(circleId: string) {
  return doc(db, "circles", circleId);
}

function getCircleMembersCollection(circleId: string) {
  return collection(db, "circles", circleId, "members");
}

function getCircleMemberDoc(circleId: string, userId: string) {
  return doc(db, "circles", circleId, "members", userId);
}

function getCircleBrewsCollection(circleId: string) {
  return collection(db, "circles", circleId, "brews");
}

function getCircleBrewDoc(circleId: string, brewId: string) {
  return doc(db, "circles", circleId, "brews", brewId);
}

function getUserCircleMembersCollection(userId: string) {
  return collection(db, "users", userId, "circleMembers");
}

function getUserCircleMemberDoc(userId: string, circleId: string) {
  return doc(db, "users", userId, "circleMembers", circleId);
}

// Create a new circle
export async function createCircle(
  userId: string,
  userDisplayName: string | null,
  name: string,
  description: string | null
): Promise<Circle> {
  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await getCircleByInviteCode(inviteCode);
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique invite code");
  }

  const circleData = {
    name,
    description,
    createdBy: userId,
    inviteCode,
    memberCount: 1,
    brewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const circleRef = await addDoc(getCirclesCollection(), circleData);
  const circleId = circleRef.id;

  // Add creator as admin member
  const memberData: Omit<CircleMember, "id"> = {
    role: "admin",
    joinedAt: serverTimestamp() as any,
    displayName: userDisplayName,
  };
  await setDoc(getCircleMemberDoc(circleId, userId), memberData);

  // Add to user's circle memberships
  const userMembershipData: Omit<UserCircleMembership, "id"> = {
    circleName: name,
    role: "admin",
    joinedAt: serverTimestamp() as any,
  };
  await setDoc(getUserCircleMemberDoc(userId, circleId), userMembershipData);

  return {
    id: circleId,
    ...circleData,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  } as Circle;
}

// Get circle by ID
export async function getCircle(circleId: string): Promise<Circle | null> {
  const snapshot = await getDoc(getCircleDoc(circleId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Circle;
}

// Get circle by invite code
export async function getCircleByInviteCode(
  inviteCode: string
): Promise<Circle | null> {
  const q = query(
    getCirclesCollection(),
    where("inviteCode", "==", inviteCode.toUpperCase())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Circle;
}

// Join a circle by invite code
export async function joinCircle(
  userId: string,
  userDisplayName: string | null,
  inviteCode: string,
  role: CircleRole = "contributor"
): Promise<Circle> {
  const circle = await getCircleByInviteCode(inviteCode);

  if (!circle) {
    throw new Error("Circle not found with that invite code");
  }

  // Check if already a member
  const existingMember = await getDoc(getCircleMemberDoc(circle.id, userId));
  if (existingMember.exists()) {
    throw new Error("You are already a member of this circle");
  }

  const batch = writeBatch(db);

  // Add as member
  const memberData: Omit<CircleMember, "id"> = {
    role,
    joinedAt: serverTimestamp() as any,
    displayName: userDisplayName,
  };
  batch.set(getCircleMemberDoc(circle.id, userId), memberData);

  // Update member count
  batch.update(getCircleDoc(circle.id), {
    memberCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // Add to user's memberships
  const userMembershipData: Omit<UserCircleMembership, "id"> = {
    circleName: circle.name,
    role,
    joinedAt: serverTimestamp() as any,
  };
  batch.set(getUserCircleMemberDoc(userId, circle.id), userMembershipData);

  await batch.commit();

  return circle;
}

// Leave a circle
export async function leaveCircle(
  userId: string,
  circleId: string
): Promise<void> {
  const memberDoc = await getDoc(getCircleMemberDoc(circleId, userId));

  if (!memberDoc.exists()) {
    throw new Error("You are not a member of this circle");
  }

  const member = memberDoc.data() as CircleMember;

  // Check if user is the only admin
  if (member.role === "admin") {
    const admins = await getDocs(
      query(
        getCircleMembersCollection(circleId),
        where("role", "==", "admin")
      )
    );

    if (admins.size <= 1) {
      throw new Error(
        "You are the only admin. Transfer ownership or delete the circle."
      );
    }
  }

  const batch = writeBatch(db);

  // Remove from circle members
  batch.delete(getCircleMemberDoc(circleId, userId));

  // Update member count
  batch.update(getCircleDoc(circleId), {
    memberCount: increment(-1),
    updatedAt: serverTimestamp(),
  });

  // Remove from user's memberships
  batch.delete(getUserCircleMemberDoc(userId, circleId));

  await batch.commit();
}

// Get circle members
export async function getCircleMembers(
  circleId: string
): Promise<CircleMember[]> {
  const q = query(
    getCircleMembersCollection(circleId),
    orderBy("joinedAt", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CircleMember[];
}

// Get user's circles
export async function getUserCircles(
  userId: string
): Promise<UserCircleMembership[]> {
  const q = query(
    getUserCircleMembersCollection(userId),
    orderBy("joinedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserCircleMembership[];
}

// Post a brew to circle
export async function postBrewToCircle(
  userId: string,
  userDisplayName: string | null,
  circleId: string,
  brew: CoffeeTime
): Promise<string> {
  // Check if user is a member with posting rights
  const memberDoc = await getDoc(getCircleMemberDoc(circleId, userId));

  if (!memberDoc.exists()) {
    throw new Error("You are not a member of this circle");
  }

  const member = memberDoc.data() as CircleMember;

  if (member.role === "viewer") {
    throw new Error("You do not have permission to post in this circle");
  }

  const brewData: Omit<CircleBrew, "id"> = {
    brew,
    postedBy: userId,
    postedByName: userDisplayName,
    postedAt: serverTimestamp() as any,
  };

  const brewRef = await addDoc(getCircleBrewsCollection(circleId), brewData);

  // Update brew count
  await updateDoc(getCircleDoc(circleId), {
    brewCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  return brewRef.id;
}

// Get circle brews
export async function getCircleBrews(
  circleId: string,
  limitCount: number = 50
): Promise<CircleBrew[]> {
  const q = query(
    getCircleBrewsCollection(circleId),
    orderBy("postedAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CircleBrew[];
}

// Delete a brew from circle
export async function deleteCircleBrew(
  userId: string,
  circleId: string,
  brewId: string
): Promise<void> {
  const brewDoc = await getDoc(getCircleBrewDoc(circleId, brewId));

  if (!brewDoc.exists()) {
    throw new Error("Brew not found");
  }

  const brew = brewDoc.data() as CircleBrew;
  const memberDoc = await getDoc(getCircleMemberDoc(circleId, userId));
  const member = memberDoc.exists() ? (memberDoc.data() as CircleMember) : null;

  // Check permissions
  if (brew.postedBy !== userId && member?.role !== "admin") {
    throw new Error("You do not have permission to delete this brew");
  }

  await deleteDoc(getCircleBrewDoc(circleId, brewId));

  // Update brew count
  await updateDoc(getCircleDoc(circleId), {
    brewCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
}

// Update member role
export async function updateMemberRole(
  adminUserId: string,
  circleId: string,
  targetUserId: string,
  newRole: CircleRole
): Promise<void> {
  // Check if requester is admin
  const adminDoc = await getDoc(getCircleMemberDoc(circleId, adminUserId));

  if (!adminDoc.exists() || adminDoc.data().role !== "admin") {
    throw new Error("You must be an admin to change member roles");
  }

  await updateDoc(getCircleMemberDoc(circleId, targetUserId), {
    role: newRole,
  });

  await updateDoc(getUserCircleMemberDoc(targetUserId, circleId), {
    role: newRole,
  });
}

// Remove member from circle
export async function removeMember(
  adminUserId: string,
  circleId: string,
  targetUserId: string
): Promise<void> {
  // Check if requester is admin
  const adminDoc = await getDoc(getCircleMemberDoc(circleId, adminUserId));

  if (!adminDoc.exists() || adminDoc.data().role !== "admin") {
    throw new Error("You must be an admin to remove members");
  }

  if (adminUserId === targetUserId) {
    throw new Error("You cannot remove yourself. Use leave circle instead.");
  }

  const batch = writeBatch(db);

  batch.delete(getCircleMemberDoc(circleId, targetUserId));
  batch.update(getCircleDoc(circleId), {
    memberCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
  batch.delete(getUserCircleMemberDoc(targetUserId, circleId));

  await batch.commit();
}

// Delete circle (admin only)
export async function deleteCircle(
  userId: string,
  circleId: string
): Promise<void> {
  const circle = await getCircle(circleId);

  if (!circle) {
    throw new Error("Circle not found");
  }

  if (circle.createdBy !== userId) {
    throw new Error("Only the circle creator can delete it");
  }

  // Delete all members
  const members = await getCircleMembers(circleId);
  const batch = writeBatch(db);

  for (const member of members) {
    batch.delete(getCircleMemberDoc(circleId, member.id));
    batch.delete(getUserCircleMemberDoc(member.id, circleId));
  }

  // Delete the circle
  batch.delete(getCircleDoc(circleId));

  await batch.commit();
}

// Update circle info
export async function updateCircle(
  userId: string,
  circleId: string,
  updates: { name?: string; description?: string | null }
): Promise<void> {
  const memberDoc = await getDoc(getCircleMemberDoc(circleId, userId));

  if (!memberDoc.exists() || memberDoc.data().role !== "admin") {
    throw new Error("You must be an admin to update circle info");
  }

  await updateDoc(getCircleDoc(circleId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Update circle name in all user memberships if name changed
  if (updates.name) {
    const members = await getCircleMembers(circleId);
    const batch = writeBatch(db);

    for (const member of members) {
      batch.update(getUserCircleMemberDoc(member.id, circleId), {
        circleName: updates.name,
      });
    }

    await batch.commit();
  }
}

// Check if user is member of circle
export async function isCircleMember(
  userId: string,
  circleId: string
): Promise<boolean> {
  const memberDoc = await getDoc(getCircleMemberDoc(circleId, userId));
  return memberDoc.exists();
}

// Get user's role in circle
export async function getUserCircleRole(
  userId: string,
  circleId: string
): Promise<CircleRole | null> {
  const memberDoc = await getDoc(getCircleMemberDoc(circleId, userId));

  if (!memberDoc.exists()) {
    return null;
  }

  return memberDoc.data().role as CircleRole;
}
