// Web Crypto API Utilities

// 1. Generate RSA Key Pair (Public/Private) for the user
export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
    return keyPair;
};

// 2. Export Key to Base64 (to send to server)
export const exportKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey(
        "spki", // SubjectPublicKeyInfo for Public Key
        key
    );
    return arrayBufferToBase64(exported);
};

// 3. Import Key from Base64 (received from server)
export const importPublicKey = async (base64Key) => {
    const binaryDer = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
};

// 4. Encrypt Message (Hybrid: AES for data, RSA for AES key)
export const encryptMessage = async (message, recipientPublicKey) => {
    // A. Generate a one-time AES Session Key
    const sessionKey = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt"]
    );

    // B. Encrypt the message with AES
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        sessionKey,
        encodedMessage
    );

    // C. Encrypt the AES Session Key with Recipient's RSA Public Key
    const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
    const encryptedSessionKey = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        recipientPublicKey,
        rawSessionKey
    );

    // Return everything needed to decrypt
    return {
        iv: arrayBufferToBase64(iv),
        content: arrayBufferToBase64(encryptedContent),
        key: arrayBufferToBase64(encryptedSessionKey)
    };
};

// 5. Decrypt Message
export const decryptMessage = async (encryptedPackage, privateKey) => {
    try {
        const { iv, content, key } = encryptedPackage;

        // A. Decrypt the AES Session Key using our Private Key
        const decryptedSessionKeyRaw = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            base64ToArrayBuffer(key)
        );

        // B. Import the AES Session Key
        const sessionKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedSessionKeyRaw,
            "AES-GCM",
            true,
            ["decrypt"]
        );

        // C. Decrypt the Content
        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: base64ToArrayBuffer(iv)
            },
            sessionKey,
            base64ToArrayBuffer(content)
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedContent);
    } catch (e) {
        console.error("Decryption failed", e);
        return "⚠️ Decryption Error: Missing Key"; // Fallback text
    }
};

// Helpers
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
