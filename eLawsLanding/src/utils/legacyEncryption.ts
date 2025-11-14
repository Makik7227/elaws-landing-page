import { XChaCha20Poly1305 } from "@stablelib/xchacha20poly1305";

const base64ToBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

export const decryptLegacyMessage = (encryptedText: string, key: Uint8Array): string => {
    const [nonceBase64, encryptedBase64] = encryptedText.split(":");
    if (!nonceBase64 || !encryptedBase64) {
        throw new Error("Invalid encrypted text format");
    }

    const cipher = new XChaCha20Poly1305(key);
    const nonce = base64ToBytes(nonceBase64);
    const encryptedBytes = base64ToBytes(encryptedBase64);

    const decrypted = cipher.open(nonce, encryptedBytes);
    if (!decrypted) throw new Error("Decryption failed");

    return new TextDecoder().decode(decrypted);
};
