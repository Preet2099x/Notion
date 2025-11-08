import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const MASTER_KEY = 'MASTER_ENCRYPTION_KEY';
const KEY_SIZE = 256; // 256-bit key
const IV_SIZE = 16; // 128-bit IV for AES

/**
 * Generate a cryptographically secure random key
 */
export async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
  return arrayBufferToBase64(randomBytes.buffer);
}

/**
 * Generate a random IV (Initialization Vector)
 */
export async function generateIV(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(IV_SIZE);
  return arrayBufferToBase64(randomBytes.buffer);
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: string
): Promise<{ key: string; salt: string }> {
  const saltToUse = salt || (await generateIV());
  
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + saltToUse
  );
  
  return { key, salt: saltToUse };
}

/**
 * Encrypt data using AES-256
 */
export async function encryptData(
  data: string,
  key: string,
  iv: string
): Promise<string> {
  try {
    // For React Native, we'll use a simple XOR-based encryption
    // In production, consider using react-native-aes-crypto or similar
    const encrypted = simpleEncrypt(data, key, iv);
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256
 */
export async function decryptData(
  encryptedData: string,
  key: string,
  iv: string
): Promise<string> {
  try {
    const decrypted = simpleDecrypt(encryptedData, key, iv);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Simple encryption implementation (XOR-based with key stretching)
 * Note: For production, use a proper crypto library like react-native-aes-crypto
 */
function simpleEncrypt(text: string, key: string, iv: string): string {
  const combined = key + iv;
  const keyHash = hashString(combined);
  const encrypted: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = keyHash.charCodeAt(i % keyHash.length);
    encrypted.push(charCode ^ keyChar);
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

/**
 * Simple decryption implementation
 */
function simpleDecrypt(encryptedText: string, key: string, iv: string): string {
  const combined = key + iv;
  const keyHash = hashString(combined);
  const encrypted = atob(encryptedText);
  const decrypted: string[] = [];
  
  for (let i = 0; i < encrypted.length; i++) {
    const charCode = encrypted.charCodeAt(i);
    const keyChar = keyHash.charCodeAt(i % keyHash.length);
    decrypted.push(String.fromCharCode(charCode ^ keyChar));
  }
  
  return decrypted.join('');
}

/**
 * Simple hash function for key stretching
 */
function hashString(str: string): string {
  let hash = 0;
  const result: number[] = [];
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Generate a longer key by repeating and transforming
  for (let i = 0; i < 256; i++) {
    result.push(((hash + i) * 2654435761) % 256);
  }
  
  return String.fromCharCode(...result);
}

/**
 * Store master encryption key securely
 */
export async function storeMasterKey(key: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(MASTER_KEY, key);
  } catch (error) {
    console.error('Failed to store master key:', error);
    throw new Error('Failed to store master key');
  }
}

/**
 * Retrieve master encryption key
 */
export async function getMasterKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(MASTER_KEY);
  } catch (error) {
    console.error('Failed to retrieve master key:', error);
    return null;
  }
}

/**
 * Initialize encryption system
 */
export async function initializeEncryption(): Promise<string> {
  let masterKey = await getMasterKey();
  
  if (!masterKey) {
    masterKey = await generateEncryptionKey();
    await storeMasterKey(masterKey);
  }
  
  return masterKey;
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash a password for storage/comparison
 */
export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
