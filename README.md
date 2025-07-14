# Wikisource Manager - Electron Desktop App

A desktop application for uploading files to Wikisource with a simple, user-friendly interface.

## Features

- 🖥️ **Desktop GUI** - Clean, modern interface built with Electron
- 📁 **File Selection** - Click to browse or drag & drop PDF files
- 📊 **Progress Tracking** - Real-time upload progress with status updates
- 🔒 **Secure** - Uses contextBridge for secure main-renderer communication
- 📦 **Cross-platform** - Runs on Windows, macOS, and Linux
- 🚀 **Fast Uploads** - Chunked upload support for large files

## Prerequisites

1. **Node.js** (v16 or higher)
2. **pnpm** package manager
3. **Wikimedia bot credentials** (username and password)

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure credentials:**
   ```bash
   cp .env.example .env
   # Edit .env file with your Wikimedia bot credentials
   ```

   **Important:** Environment variables are loaded at **runtime**, not during compilation. The app will:
   - ✅ Load `.env` from project root in development
   - ✅ Look for `.env` next to executable in production
   - ✅ Show credential status in the app footer
   - ⚠️ Display helpful error messages if credentials are missing

3. **Build the application:**
   ```bash
   pnpm build:electron
   ```

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
├── electron/           # Electron-specific code
│   ├── main.ts        # Main process (Node.js)
│   ├── preload.ts     # Preload script (security bridge)
│   └── uploadService.ts # Enhanced upload service
├── renderer/          # Renderer process (Web UI)
│   ├── index.html     # Main UI
│   └── renderer.js    # UI logic
├── uploadFile.ts      # Original upload logic
├── parse.ts          # Filename parsing
├── templates.ts      # Wiki templates
└── index.ts          # Common configurations
```

## Security Features

- **Context Isolation** - Renderer process runs in isolated context
- **Preload Script** - Secure communication between main and renderer
- **No Node.js in Renderer** - Web content cannot access Node.js APIs directly
- **Controlled API** - Only specific functions exposed to renderer

## Supported Archives

The app supports uploading to various Ukrainian state archives including:
- ЦДКФФА, ЦДНТА, ЦДАЗУ, ЦДЕА
- Regional archives (ДАВіО, ДАВоО, ДАДнО, etc.)
- Specialized archives (ЦДІАК, ЦДАМЛМ, etc.)

## Troubleshooting

### Common Issues:

1. **"Failed to parse filename"**
   - Ensure filename follows the required format
   - Check that archive abbreviation is supported

2. **"Upload failed"**
   - Verify .env credentials are correct
   - Check internet connection
   - Ensure file is a valid PDF

3. **"Electron API not available"**
   - App may be running in browser instead of Electron
   - Rebuild and restart the application

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
