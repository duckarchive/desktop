import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * Secure credentials storage manager
 * Uses Electron's safeStorage API for encryption and persistent storage
 */
export class CredentialsManager {
  private credentialsPath: string;

  constructor() {
    // Store credentials in user data directory
    const userDataPath = app.getPath('userData');
    this.credentialsPath = path.join(userDataPath, 'credentials.json');
  }

  /**
   * Check if credentials are available and valid
   */
  hasCredentials(): boolean {
    try {
      const creds = this.getCredentials();
      return !!(creds.username && creds.password);
    } catch {
      return false;
    }
  }

  /**
   * Get stored credentials (decrypted)
   */
  getCredentials(): WikiCredentials {
    try {
      if (!fs.existsSync(this.credentialsPath)) {
        return { username: '', password: '' };
      }

      const encryptedData = fs.readFileSync(this.credentialsPath, 'utf8');
      const data = JSON.parse(encryptedData);

      // Check if safeStorage is available (requires user to be logged in on some systems)
      if (safeStorage.isEncryptionAvailable()) {
        return {
          username: data.username ? safeStorage.decryptString(Buffer.from(data.username, 'base64')) : '',
          password: data.password ? safeStorage.decryptString(Buffer.from(data.password, 'base64')) : ''
        };
      } else {
        // Fallback: store as base64 (less secure but still obfuscated)
        return {
          username: data.username ? Buffer.from(data.username, 'base64').toString('utf8') : '',
          password: data.password ? Buffer.from(data.password, 'base64').toString('utf8') : ''
        };
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return { username: '', password: '' };
    }
  }

  /**
   * Store credentials securely
   */
  saveCredentials({ username, password }: WikiCredentials): boolean {
    try {
      let data: any;

      if (safeStorage.isEncryptionAvailable()) {
        // Use Electron's secure storage (encrypted)
        data = {
          username: username ? safeStorage.encryptString(username).toString('base64') : '',
          password: password ? safeStorage.encryptString(password).toString('base64') : '',
          encrypted: true,
          timestamp: Date.now()
        };
      } else {
        // Fallback: base64 encoding (obfuscation)
        data = {
          username: username ? Buffer.from(username).toString('base64') : '',
          password: password ? Buffer.from(password).toString('base64') : '',
          encrypted: false,
          timestamp: Date.now()
        };
      }

      // Ensure directory exists
      const dir = path.dirname(this.credentialsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(this.credentialsPath, JSON.stringify(data, null, 2));
      
      console.log('✅ Credentials saved securely to:', this.credentialsPath);
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  /**
   * Clear stored credentials
   */
  clearCredentials(): boolean {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        fs.unlinkSync(this.credentialsPath);
      }
      console.log('✅ Credentials cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      return false;
    }
  }

  /**
   * Get credentials storage info for debugging
   */
  getStorageInfo(): {
    path: string;
    exists: boolean;
    encrypted: boolean;
    timestamp?: number;
  } {
    try {
      const exists = fs.existsSync(this.credentialsPath);
      if (!exists) {
        return {
          path: this.credentialsPath,
          exists: false,
          encrypted: false
        };
      }

      const data = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      return {
        path: this.credentialsPath,
        exists: true,
        encrypted: !!data.encrypted,
        timestamp: data.timestamp
      };
    } catch {
      return {
        path: this.credentialsPath,
        exists: false,
        encrypted: false
      };
    }
  }

  /**
   * Validate credentials format
   */
  validateCredentials({ username, password }: WikiCredentials): { valid: boolean; message: string } {
    if (!username || !password) {
      return { valid: false, message: 'Username and password are required' };
    }

    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' };
    }

    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    // Check for bot username format (often contains @ for bot accounts)
    if (!username.includes('@') && !username.toLowerCase().includes('bot')) {
      return { 
        valid: true, 
        message: 'Попередження: Схоже, це не бот-акаунт. Переконайтеся, що ви використовуєте облікові дані бота.' 
      };
    }

    return { valid: true, message: 'Credentials look valid' };
  }
}
