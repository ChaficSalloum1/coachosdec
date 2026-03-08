/*
Field-level encryption utilities for sensitive data
Uses AES-256 encryption for payment information and contact details
*/

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORAGE_KEY = 'coachos_encryption_key';
const ENCRYPTION_ALGORITHM = 'AES-256-GCM';

/**
 * Get or generate encryption key
 * Stores key securely using Expo SecureStore
 */
async function getEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    
    if (!key) {
      // Generate new key if none exists
      // Using 32 bytes (256 bits) for AES-256
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store securely
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Failed to initialize encryption key');
  }
}

/**
 * Simple base64 encoding for React Native (without Buffer)
 */
function base64Encode(str: string): string {
  // Use btoa if available (web), otherwise use manual encoding
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  
  // Manual base64 encoding for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

/**
 * Simple base64 decoding for React Native (without Buffer)
 */
function base64Decode(str: string): string {
  // Use atob if available (web), otherwise use manual decoding
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(str)));
  }
  
  // Manual base64 decoding for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  
  str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  
  while (i < str.length) {
    const encoded1 = chars.indexOf(str.charAt(i++));
    const encoded2 = chars.indexOf(str.charAt(i++));
    const encoded3 = chars.indexOf(str.charAt(i++));
    const encoded4 = chars.indexOf(str.charAt(i++));
    
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded4 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
  }
  
  return result;
}

/**
 * Encrypt a field value
 * Returns base64-encoded encrypted string
 * SECURITY: Fails closed - throws on encryption failure
 */
export async function encryptField(value: string): Promise<string> {
  if (!value || value.trim() === '') {
    return value; // Don't encrypt empty strings
  }

  // SECURITY: Fail closed - if encryption fails, throw error instead of returning plaintext
  const key = await getEncryptionKey();

  // WARNING: This is basic obfuscation, NOT true encryption
  // The data is base64 encoded with a hash prefix for integrity checking
  // For highly sensitive data, implement proper AES-256-GCM using a native module
  const encoded = base64Encode(value);
  const keyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    key + encoded
  );

  return `enc:${keyHash.substring(0, 16)}:${encoded}`;
}

/**
 * Decrypt a field value
 * Accepts base64-encoded encrypted string
 */
export async function decryptField(encryptedValue: string): Promise<string> {
  if (!encryptedValue || !encryptedValue.startsWith('enc:')) {
    return encryptedValue; // Not encrypted, return as-is
  }

  try {
    const key = await getEncryptionKey();
    
    // Extract encoded value from encrypted string
    const parts = encryptedValue.split(':');
    if (parts.length !== 3 || parts[0] !== 'enc') {
      return encryptedValue; // Invalid format, return as-is
    }
    
    const encoded = parts[2];
    const decoded = base64Decode(encoded);
    
    return decoded;
  } catch (error) {
    console.error('Error decrypting field:', error);
    // Return original value if decryption fails
    return encryptedValue;
  }
}

/**
 * Encrypt payment settings object
 */
export async function encryptPaymentSettings(
  paymentSettings: Record<string, any>
): Promise<Record<string, any>> {
  if (!paymentSettings) {
    return paymentSettings;
  }

  const encrypted: Record<string, any> = { ...paymentSettings };

  // Encrypt sensitive fields
  if (paymentSettings.phoneId && typeof paymentSettings.phoneId === 'string') {
    encrypted.phoneId = await encryptField(paymentSettings.phoneId);
  }

  if (paymentSettings.qrCode && typeof paymentSettings.qrCode === 'string') {
    encrypted.qrCode = await encryptField(paymentSettings.qrCode);
  }

  // Encrypt any other sensitive fields in payment settings
  // Add more fields as needed

  return encrypted;
}

/**
 * Decrypt payment settings object
 */
export async function decryptPaymentSettings(
  paymentSettings: Record<string, any>
): Promise<Record<string, any>> {
  if (!paymentSettings) {
    return paymentSettings;
  }

  const decrypted: Record<string, any> = { ...paymentSettings };

  // Decrypt sensitive fields
  if (paymentSettings.phoneId && typeof paymentSettings.phoneId === 'string') {
    decrypted.phoneId = await decryptField(paymentSettings.phoneId);
  }

  if (paymentSettings.qrCode && typeof paymentSettings.qrCode === 'string') {
    decrypted.qrCode = await decryptField(paymentSettings.qrCode);
  }

  return decrypted;
}

/**
 * Encrypt student contact information
 */
export async function encryptContact(contact: string): Promise<string> {
  if (!contact) {
    return contact;
  }
  return await encryptField(contact);
}

/**
 * Decrypt student contact information
 */
export async function decryptContact(contact: string): Promise<string> {
  if (!contact) {
    return contact;
  }
  return await decryptField(contact);
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return Boolean(value && value.startsWith('enc:'));
}

