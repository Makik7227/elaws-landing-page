import { XChaCha20Poly1305 } from "@stablelib/xchacha20poly1305";

// 🔑 Generate a secure random key (32 bytes)
export function generateSecureKey(): Uint8Array {
    const key = new Uint8Array(32);
    crypto.getRandomValues(key);
    return key;
}

// --- Base64 helpers for Uint8Array ---
function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// 🔒 Encrypt a message using XChaCha20Poly1305
export function encryptMessage(plainText: string, key: Uint8Array): string {
    const cipher = new XChaCha20Poly1305(key);
    const nonce = new Uint8Array(24);
    crypto.getRandomValues(nonce);

    const encrypted = cipher.seal(nonce, new TextEncoder().encode(plainText));

    return `${bytesToBase64(nonce)}:${bytesToBase64(encrypted)}`;
}

// 🔓 Decrypt a message
export function decryptMessage(encryptedText: string, key: Uint8Array): string {
    const cipher = new XChaCha20Poly1305(key);

    const [nonceBase64, encryptedBase64] = encryptedText.split(":");
    if (!nonceBase64 || !encryptedBase64) {
        throw new Error("Invalid encrypted text format");
    }

    const nonce = base64ToBytes(nonceBase64);
    const encryptedBytes = base64ToBytes(encryptedBase64);

    const decrypted = cipher.open(nonce, encryptedBytes);
    if (!decrypted) throw new Error("Decryption failed");

    return new TextDecoder().decode(decrypted);
}