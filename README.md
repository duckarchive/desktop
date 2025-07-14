# Wikisource Manager - Electron Desktop App

A desktop application for uploading files to Wikisource with a simple, user-friendly interface.

## Features

- 🖥️ **Desktop GUI** - Clean, modern interface built with Electron
- 📁 **File Selection** - Click to browse or drag & drop PDF files
- 📊 **Progress Tracking** - Real-time upload progress with status updates
- � **Secure Credentials** - Built-in encrypted credentials storage (no .env files!)
- �🔒 **Secure Architecture** - Uses contextBridge for secure main-renderer communication
- 📦 **Cross-platform** - Runs on Windows, macOS, and Linux
- 🚀 **Fast Uploads** - Chunked upload support for large files
- ⚙️ **Settings UI** - Easy credential management through graphical interface

## Prerequisites

1. **Node.js** (v16 or higher)
2. **pnpm** package manager
3. **Wikimedia bot credentials** (get from Special:BotPasswords)

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the application:**
   ```bash
   pnpm build:electron
   ```

3. **Configure credentials:**
   - Launch the app: `pnpm electron`
   - Click the "⚙️ Settings" button in the footer
   - Enter your Wikimedia bot credentials
   - Click "Save Credentials"

   **New!** Credentials are now stored securely using Electron's built-in encryption, no more `.env` files needed!

## Development

### Run in development mode:
```bash
pnpm electron:dev
```

### Build for development:
```bash
pnpm build:electron
```

### Run the app:
```bash
pnpm electron
```

## File Naming Convention

Files must follow this naming pattern:
```
ARCHIVE FUND-DESCRIPTION-CASE. YEAR_RANGE. TITLE.pdf
```

Example:
```
ЦДКФФА 123-45-67. 1920-1925. Document Title.pdf
```

Where:
- `ЦДКФФА` - Archive abbreviation
- `123-45-67` - Fund-Description-Case numbers
- `1920-1925` - Date range
- `Document Title` - File title

## Building for Distribution

### Windows:
```bash
pnpm dist:win
```

This will create:
- `release/` directory with installer files
- NSIS installer for easy Windows installation

### All platforms:
```bash
pnpm dist
```

## Project Structure

```
src/
├── electron/              # Electron-specific code
│   ├── main.ts           # Main process (Node.js)
│   ├── preload.ts        # Preload script (security bridge)
│   ├── uploadService.ts  # Enhanced upload service
│   └── credentialsManager.ts # Secure credentials storage
├── renderer/             # Renderer process (Web UI)
│   ├── index.html        # Main UI with settings modal
│   └── renderer.js       # UI logic with credentials management
├── uploadFile.ts         # Original upload logic
├── parse.ts             # Filename parsing
├── templates.ts         # Wiki templates
└── index.ts             # Common configurations
```

## Security Features

- **Context Isolation** - Renderer process runs in isolated context
- **Preload Script** - Secure communication between main and renderer
- **No Node.js in Renderer** - Web content cannot access Node.js APIs directly
- **Controlled API** - Only specific functions exposed to renderer
- **Encrypted Credentials** - Uses Electron's safeStorage API for credential encryption
- **Secure Storage** - Credentials stored in OS-specific user data directories

## Supported Archives

The app supports uploading to various Ukrainian state archives including:
- ЦДКФФА, ЦДНТА, ЦДАЗУ, ЦДЕА
- Regional archives (ДАВіО, ДАВоО, ДАДнО, etc.)
- Specialized archives (ЦДІАК, ЦДАМЛМ, etc.)

## Troubleshooting

### Common Issues:

1. **"❌ Credentials missing"**
   - Click the ⚙️ Settings button in the app footer
   - Enter your Wikimedia bot username and password
   - Click "Save Credentials"

2. **"Failed to parse filename"**
   - Ensure filename follows the required format
   - Check that archive abbreviation is supported

3. **"Upload failed"**
   - Verify credentials are correct in Settings
   - Check internet connection
   - Ensure file is a valid PDF

4. **"Electron API not available"**
   - App may be running in browser instead of Electron
   - Rebuild and restart the application

5. **Can't save credentials**
   - Check username format (should be like "YourBot@project")
   - Ensure password is at least 8 characters
   - Verify app has write permissions to user data directory

### Development Issues:

1. **TypeScript errors**
   ```bash
   pnpm build
   ```

2. **Missing dependencies**
   ```bash
   pnpm install
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see package.json for details.

## Support

For issues and questions, please check the existing issues or create a new one in the repository.
