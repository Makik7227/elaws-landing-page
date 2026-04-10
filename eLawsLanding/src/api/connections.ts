import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

type Role = "lawyer" | "client";

export type UserProfile = {
    uid: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
};

export async function findUserByIdentifier(
    identifier: string,
    targetRole: Role
): Promise<UserProfile | null> {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    const normalizedUsername = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    const queries = [
        query(
            collection(db, "users"),
            where("email", "==", trimmed),
            where("role", "==", targetRole)
        ),
        query(
            collection(db, "users"),
            where("username", "==", normalizedUsername),
            where("role", "==", targetRole)
        ),
    ];

    for (const q of queries) {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data() as Record<string, unknown>;
            return {
                uid: doc.id,
                email: typeof data.email === "string" ? data.email : undefined,
                username: typeof data.username === "string" ? data.username : undefined,
                firstName: typeof data.firstName === "string" ? data.firstName : undefined,
                lastName: typeof data.lastName === "string" ? data.lastName : undefined,
                role: data.role as Role | undefined,
            };
        }
    }

    return null;
}

export async function sendFriendRequest(toUid: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("not-authenticated");
    if (user.uid === toUid) throw new Error("self");

    const friendsSnap = await getDocs(
        query(collection(db, "friendships"), where("participants", "array-contains", user.uid))
    );
    const alreadyFriends = friendsSnap.docs.some((docSnap) => {
        const data = docSnap.data() as { participants?: string[] };
        return Array.isArray(data.participants) && data.participants.includes(toUid);
    });
    if (alreadyFriends) throw new Error("already-connected");

    const requestsSnap = await getDocs(
        query(collection(db, "friendRequests"), where("participants", "array-contains", user.uid))
    );
    const pending = requestsSnap.docs.some((docSnap) => {
        const data = docSnap.data() as { participants?: string[] };
        return Array.isArray(data.participants) && data.participants.includes(toUid);
    });
    if (pending) throw new Error("already-requested");

    await addDoc(collection(db, "friendRequests"), {
        from: user.uid,
        to: toUid,
        participants: [user.uid, toUid],
        status: "pending",
        createdAt: serverTimestamp(),
    });
}

export async function removeConnection(connectionId: string): Promise<void> {
    await deleteDoc(doc(db, "friendships", connectionId));
}
