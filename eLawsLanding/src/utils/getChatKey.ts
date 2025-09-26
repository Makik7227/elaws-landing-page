import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export async function getChatKey(chatId: string): Promise<Uint8Array | null> {
    const chatRef = doc(db, "userChats", chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) return null;
    const chatData = chatSnapshot.data();
    if (!chatData.secureKey) return null;

    return Uint8Array.from(atob(chatData.secureKey), c => c.charCodeAt(0));
}