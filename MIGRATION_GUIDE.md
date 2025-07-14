# 🔄 Migration Guide: .env to Secure Credentials Storage

## What Changed?

We've replaced the `.env` file approach with a secure, user-friendly credentials management system built into the app.

## ✅ **New Credentials System Features:**

### 🔐 **Secure Storage:**
- Uses Electron's `safeStorage` API for encryption
- Credentials stored in user data directory
- Automatic fallback to base64 encoding if encryption unavailable
- No more plain text `.env` files

### 🖥️ **User-Friendly Interface:**
- Built-in Settings modal (⚙️ button)
- Visual credential status indicators
- Real-time validation and feedback
- Secure password handling (never displayed)

### 🔧 **Storage Locations:**
- **Windows:** `%APPDATA%/Wikisource Manager/credentials.json`
- **macOS:** `~/Library/Application Support/Wikisource Manager/credentials.json`
- **Linux:** `~/.config/Wikisource Manager/credentials.json`

## 🚀 **How to Use the New System:**

### 1. **First Time Setup:**
```
1. Launch the app
2. Click the "⚙️ Settings" button
3. Enter your Wikimedia bot credentials
4. Click "Save Credentials"
5. Credentials are now stored securely!
```

### 2. **Status Indicators:**
- ✅ **Green:** Credentials configured and ready
- ❌ **Red:** No credentials found
- Footer shows current username and encryption status

### 3. **Managing Credentials:**
- **Update:** Click Settings → Enter new credentials → Save
- **Clear:** Click Settings → Clear Credentials button
- **View Status:** Check footer or Settings modal storage info

## 🔄 **Migration Steps:**

### If you had `.env` file before:
1. **Note your credentials** from the old `.env` file
2. **Launch the updated app**
3. **Click Settings (⚙️)** in the footer
4. **Enter your credentials** in the modal
5. **Click Save Credentials**
6. **Delete the old `.env` file** (optional, no longer needed)

### For new users:
1. **Get Wikimedia bot credentials** from Special:BotPasswords
2. **Launch the app**
3. **Click Settings**
4. **Enter credentials and save**

## 🔍 **Troubleshooting:**

### "❌ Credentials missing" error:
1. Click the Settings button
2. Enter your bot username and password
3. Click Save Credentials

### Can't save credentials:
1. Check username format (should be like "YourBot@project")
2. Ensure password is at least 8 characters
3. Check app has write permissions to user data directory

### Forgot credentials:
1. Click Settings → Clear Credentials
2. Get new credentials from Wikimedia
3. Enter new credentials and save

## 🛡️ **Security Improvements:**

### Old System (.env):
- ❌ Plain text file in project directory
- ❌ Could be accidentally committed to git
- ❌ Visible to anyone with file access
- ❌ Required manual file editing

### New System:
- ✅ Encrypted using OS keychain (when available)
- ✅ Stored in secure user data directory
- ✅ Never exposed in project files
- ✅ User-friendly graphical interface
- ✅ Automatic validation
- ✅ Clear/update capabilities

## 🎯 **Developer Notes:**

### Code Changes:
- `CredentialsManager` class handles all credential operations
- Secure storage using Electron's `safeStorage` API
- IPC handlers for credential CRUD operations
- UI modal for user interaction

### API Methods:
```javascript
// Main process
credentialsManager.saveCredentials(username, password)
credentialsManager.getCredentials()
credentialsManager.clearCredentials()
credentialsManager.hasCredentials()

// Renderer process (via electronAPI)
window.electronAPI.saveCredentials(username, password)
window.electronAPI.getCredentials()
window.electronAPI.clearCredentials()
window.electronAPI.getCredentialsStatus()
```

## ✨ **Benefits:**

1. **Security:** Encrypted storage vs plain text
2. **User Experience:** GUI vs manual file editing  
3. **Cross-platform:** Works consistently on all OS
4. **Maintenance:** No more .env file management
5. **Distribution:** No need to distribute .env files
6. **Validation:** Real-time credential validation

The new system is more secure, user-friendly, and maintainable! 🎉
