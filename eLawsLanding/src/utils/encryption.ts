import { XChaCha20Poly1305 } from "@stablelib/xchacha20poly1305";

export function generateSecureKey(): Uint8Array {
    const key = new Uint8Array(32);
    crypto.getRandomValues(key);
    return key;
}

export function encryptMessage(plainText: string, key: Uint8Array): string {
    const cipher = new XChaCha20Poly1305(key);
    const nonce = new Uint8Array(24);
    crypto.getRandomValues(nonce);
    const encrypted = cipher.seal(nonce, new TextEncoder().encode(plainText));
    return `${Buffer.from(nonce).toString("base64")}:${Buffer.from(encrypted).toString("base64")}`;
}

export function decryptMessage(encryptedText: string, key: Uint8Array): string {
    const cipher = new XChaCha20Poly1305(key);
    const [nonceBase64, encryptedBase64] = encryptedText.split(":");
    const nonce = Buffer.from(nonceBase64, "base64");
    const encryptedBytes = Buffer.from(encryptedBase64, "base64");
    const decrypted = cipher.open(nonce, encryptedBytes);
    if (!decrypted) throw new Error("Decryption failed");
    return new TextDecoder().decode(decrypted);
}