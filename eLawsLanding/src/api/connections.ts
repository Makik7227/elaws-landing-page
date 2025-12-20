import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
    from: string;
    to: string;
    status: FriendRequestStatus;
    createdAt?: unknown;
}

export interface UserProfile {
    uid: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: "client" | "lawyer";
}

export async function sendFriendRequest(toUid: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    await addDoc(collection(db, "friendRequests"), {
        from: user.uid,
        to: toUid,
        participants: [user.uid, toUid],
        status: "pending",
        createdAt: serverTimestamp(),
    });
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const reqRef = doc(db, "friendRequests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error("Request not found");

    const req = reqSnap.data() as FriendRequest;
    if (req.to !== user.uid) throw new Error("Not authorized");
    if (req.status !== "pending") throw new Error("Request already handled");

    await updateDoc(reqRef, { status: "accepted" });
    await addDoc(collection(db, "friendships"), {
        requestId,
        participants: [req.from, req.to],
        createdAt: serverTimestamp(),
    });
    await deleteDoc(reqRef);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const reqRef = doc(db, "friendRequests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error("Request not found");

    const req = reqSnap.data() as FriendRequest;
    if (req.to !== user.uid) throw new Error("Not authorized");
    if (req.status !== "pending") throw new Error("Request already handled");
    await deleteDoc(reqRef);
}

export async function removeFriend(friendUid: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const q = query(collection(db, "friendships"), where("participants", "array-contains", user.uid));
    const snap = await getDocs(q);
    const deletions = snap.docs
        .filter((d) => {
            const data = d.data() as { participants?: string[] };
            return Array.isArray(data.participants) && data.participants.includes(friendUid);
        })
        .map((d) => deleteDoc(doc(db, "friendships", d.id)));

    await Promise.all(deletions);
}

export async function searchUsersByUsername(username: string): Promise<UserProfile[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const meSnap = await getDoc(doc(db, "users", user.uid));
    const myRole = (meSnap.data()?.role as "client" | "lawyer") ?? "client";
    const targetRole = myRole === "client" ? "lawyer" : "client";

    const q = query(
        collection(db, "users"),
        where("username", "==", username),
        where("role", "==", targetRole)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
                uid: d.id,
                email: (data.email as string) ?? "",
                username: data.username as string | undefined,
                firstName: data.firstName as string | undefined,
                lastName: data.lastName as string | undefined,
                role: data.role as "client" | "lawyer" | undefined,
            };
        })
        .filter((profile) => profile.uid !== user.uid);
}
