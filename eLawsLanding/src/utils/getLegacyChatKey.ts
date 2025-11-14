import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const legacyKeyCache = new Map<string, Uint8Array | null>();

export const getLegacyChatKey = async (chatId: string): Promise<Uint8Array | null> => {
    if (legacyKeyCache.has(chatId)) {
        return legacyKeyCache.get(chatId) ?? null;
    }

    const chatRef = doc(db, "userChats", chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
        legacyKeyCache.set(chatId, null);
        return null;
    }

    const chatData = chatSnapshot.data();
    const encodedKey = chatData?.secureKey;
    if (typeof encodedKey !== "string") {
        legacyKeyCache.set(chatId, null);
        return null;
    }

    try {
        const decoded = Uint8Array.from(atob(encodedKey), (c) => c.charCodeAt(0));
        legacyKeyCache.set(chatId, decoded);
        return decoded;
    } catch (err) {
        console.warn("Failed to decode legacy chat key:", err);
        legacyKeyCache.set(chatId, null);
        return null;
    }
};
