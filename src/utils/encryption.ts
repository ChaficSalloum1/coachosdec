/*
Field-level encryption utilities for sensitive data
Uses AES-256 encryption for payment information and contact details
*/

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils';

const ENCRYPTION_KEY_STORAGE_KEY = 'coachos_encryption_key';
const ENCRYPTION_VERSION = 'v2';
const PAYMENT_SETTINGS_ENCRYPTED_FIELDS = [
  'phoneId',
  'qrCode',
  'revolutLink',
  'irisAlias',
  'iban',
  'ibanBeneficiaryName',
  'cancellationPolicy',
];

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
 * Legacy base64 decoding for pre-v2 values.
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
 * Encrypt a field value with AES-256-GCM.
 * Returns enc:v2:<nonce-hex>:<ciphertext-and-tag-hex>
 */
export async function encryptField(value: string): Promise<string> {
  if (!value || value.trim() === '') {
    return value; // Don't encrypt empty strings
  }

  const key = hexToBytes(await getEncryptionKey());
  const nonce = await Crypto.getRandomBytesAsync(12);
  const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(value));

  return `enc:${ENCRYPTION_VERSION}:${bytesToHex(nonce)}:${bytesToHex(ciphertext)}`;
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
    const parts = encryptedValue.split(':');

    if (parts.length === 4 && parts[0] === 'enc' && parts[1] === ENCRYPTION_VERSION) {
      const key = hexToBytes(await getEncryptionKey());
      const nonce = hexToBytes(parts[2]);
      const ciphertext = hexToBytes(parts[3]);
      return bytesToUtf8(gcm(key, nonce).decrypt(ciphertext));
    }

    // Legacy v1 format was enc:<hash-prefix>:<base64>. It was obfuscation,
    // not encryption, so decode it once and let the next save re-encrypt as v2.
    if (parts.length === 3 && parts[0] === 'enc') {
      return base64Decode(parts[2]);
    }

    if (parts[0] !== 'enc') {
      return encryptedValue; // Invalid format, return as-is
    }

    return encryptedValue;
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

  for (const field of PAYMENT_SETTINGS_ENCRYPTED_FIELDS) {
    if (paymentSettings[field] && typeof paymentSettings[field] === 'string') {
      encrypted[field] = await encryptField(paymentSettings[field]);
    }
  }

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

  for (const field of PAYMENT_SETTINGS_ENCRYPTED_FIELDS) {
    if (paymentSettings[field] && typeof paymentSettings[field] === 'string') {
      decrypted[field] = await decryptField(paymentSettings[field]);
    }
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
