# Environment Variables Configuration

## 🔑 **Answer to your question:**

Your `.env` variables are loaded **at runtime**, not during compilation. Here's how it works:

### **Development Mode:**
- ✅ Variables loaded from `.env` file in project root
- ✅ Hot reloading - changes take effect on app restart
- ✅ Uses `dotenv` to load variables

### **Production/Distribution:**
- ✅ Variables loaded from `.env` file next to the executable
- ✅ Fallback to `resources/.env` if main .env not found
- ⚠️ **You need to distribute .env file separately or create it on target machine**

## 📁 **File Locations:**

### Development:
```
wiki-manager/
├── .env                    ← Loaded here in development
├── src/
└── dist/
```

### Production (after installation):
```
YourApp/
├── WikisourceManager.exe   ← Your app
├── .env                    ← Create this file here
└── resources/
    └── .env.example        ← Template included in build
```

## 🛠️ **How to Fix Environment Issues:**

1. **For Development:**
   ```bash
   # Make sure .env exists in project root
   cp .env.example .env
   # Edit with your credentials
   nano .env
   ```

2. **For Distribution:**
   ```bash
   # The app will look for .env in these locations (in order):
   # 1. Next to the executable
   # 2. In resources/ directory
   # 3. Will show error if not found
   ```

3. **Current Status Check:**
   - Run the app and check the footer
   - It will show "✅ Credentials configured" or "❌ Credentials missing"
   - Will display the expected .env file path

## 🚀 **Best Practices:**

### For End Users:
1. Install the app
2. Copy `.env.example` to `.env` (same directory as exe)
3. Edit `.env` with real credentials
4. Restart the app

### For Developers:
1. Never commit `.env` with real credentials
2. Always include `.env.example` with placeholders
3. Document required environment variables

## 🔍 **Debugging Environment Issues:**

1. **Check the console output** - the app logs where it's looking for .env
2. **Check the UI footer** - shows credential status
3. **Verify file permissions** - ensure .env is readable

## ⚡ **Environment Loading Order:**

```
1. App starts
2. Checks if development or production mode
3. Determines .env file path:
   - Development: project_root/.env
   - Production: executable_directory/.env
   - Fallback: executable_directory/resources/.env
4. Loads variables if file exists
5. Validates required variables (USERNAME, PASSWORD)
6. Shows status in UI
```

This approach ensures:
- ✅ Security (credentials not hardcoded)
- ✅ Flexibility (different configs per environment)
- ✅ User-friendly (clear error messages)
- ✅ Maintainable (standard .env pattern)
