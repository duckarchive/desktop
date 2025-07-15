# Качиний Помічник (Duck Helper)

<div align="center">
  <img width="100%" alt="робоче вікно програми" src="https://github.com/user-attachments/assets/c9a57cea-a6a8-4556-a8b4-cdc3c484b96b" />
  
  **Desktop app with helper functions for genealogy research and archival records management**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Electron](https://img.shields.io/badge/Electron-33.x-9feaf9.svg)](https://electronjs.org/)
  [![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
</div>

## 🦆 About

**Качиний Помічник** (Duck Helper) is a desktop application developed by the [DuckArchive team](https://github.com/duckarchive) to simplify genealogy research and archival records management. The app provides specialized tools for working with Ukrainian historical archives and Wikisource projects.

## ✨ Features

### 📁 File Uploader for Ukrainian Archives Wikisource Project
Streamlines the upload process for Ukrainian archival documents with:

- **Automatic PDF Creation**: Convert images to PDF format automatically
- **Multi-file Support**: Upload multiple PDF files simultaneously
- **Smart File Naming**: Generate proper standardized names for files
- **Page Management**: Create and modify related Wikisource pages automatically
- **Progress Tracking**: Real-time upload progress with detailed status updates
- **Credential Management**: Secure storage of Wikimedia bot credentials

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/duckarchive/desktop.git
   cd desktop
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Build for production**
   ```bash
   pnpm build
   ```

### Development

The project uses:
- **Electron** - Desktop app framework
- **React** - Frontend UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework

```bash
# Development with hot reload
pnpm dev

# Run tests
pnpm test

# Build application
pnpm build

# Preview production build
pnpm preview
```

## 🛠️ Tech Stack

- **[Electron](https://electronjs.org/)** - Cross-platform desktop apps
- **[React](https://reactjs.org/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[mwn](https://github.com/siddharthvp/mwn)** - MediaWiki API client

## 🏗️ Project Structure

```
├── electron/              # Electron main process
│   ├── main/              # Main process modules
│   │   ├── index.ts       # Main entry point
│   │   ├── bot.ts         # WikiMedia bot integration
│   │   ├── parse.ts       # File name parsing
│   │   ├── uploadService.ts # File upload service
│   │   └── ...
│   └── preload/           # Preload scripts
├── src/                   # React renderer process
│   ├── components/        # React components
│   ├── assets/           # Static assets
│   └── ...
├── build/                # Build assets (icons, etc.)
├── dist-electron/        # Built electron files
└── dist/                 # Built renderer files
```

## 🔧 Configuration

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// tsconfig.json & vite.config.ts
"@/*"  → "src/*"      // Frontend components
"~/*"  → "electron/*" // Electron modules
```

### Environment Setup

For debugging, the app uses VS Code integration:

```json
// package.json
"debug": {
  "env": {
    "VITE_DEV_SERVER_URL": "http://127.0.0.1:7777/"
  }
}
```

## 🐛 Debugging

### VS Code Debugging
1. Run the "Before Debug" task
2. Set breakpoints in TypeScript files
3. Press F5 or use "Run & Debug" panel

### DevTools
- **Renderer Process**: DevTools open automatically in development
- **Main Process**: Use VS Code debugger or console.log

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [DuckArchive Team](https://github.com/duckarchive) - Project maintainers
- [Ukrainian Wikisource](https://uk.wikisource.org/) - Target platform
- [Electron Vite React](https://github.com/electron-vite/electron-vite-react) - Base template

## 📞 Support

- **Website**: [duckarchive.com](https://duckarchive.com)
- **Issues**: [GitHub Issues](https://github.com/duckarchive/desktop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/duckarchive/desktop/discussions)

---

<div align="center">
  Made with ❤️ by the DuckArchive Team for the Ukrainian genealogy community
</div>
