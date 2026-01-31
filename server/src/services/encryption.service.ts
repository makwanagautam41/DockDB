/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data (connection strings)
 * Uses AES-256-CBC algorithm
 */

import crypto from 'crypto';
import { logError } from '../utils/logger.util';

class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    if (encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }

    this.key = Buffer.from(encryptionKey, 'utf-8');
  }

  /**
   * Encrypt text using AES-256-CBC
   * @param text - Plain text to encrypt
   * @returns Encrypted text in format: iv:encryptedData
   */
  encrypt(text: string): string {
    try {
      // Generate random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf-8', 'hex');
      encrypted += cipher.final('hex');

      // Return IV and encrypted data separated by colon
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      logError('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt text using AES-256-CBC
   * @param encryptedText - Encrypted text in format: iv:encryptedData
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    try {
      // Split IV and encrypted data
      const parts = encryptedText.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');

      return decrypted;
    } catch (error) {
      logError('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Validate if text is encrypted (has correct format)
   */
  isEncrypted(text: string): boolean {
    const parts = text.split(':');
    return parts.length === 2 && parts[0].length === 32 && parts[1].length > 0;
  }
}

// Export singleton instance
export default new EncryptionService();
