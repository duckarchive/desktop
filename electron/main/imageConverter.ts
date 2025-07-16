import { spawn, exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import * as os from 'os'

const execAsync = promisify(exec)

export interface ConversionOptions {
  outputPath?: string
  dpi?: string
  rotation?: string
}

export interface ConversionResult {
  success: boolean
  outputPath?: string
  message: string
  error?: string
}

export interface EnvironmentStatus {
  pythonAvailable: boolean
  pythonPath?: string
  pythonVersion?: string
  img2pdfAvailable: boolean
  img2pdfVersion?: string
  img2pdfExePath?: string // For Windows standalone exe
  isWindows: boolean
  needsSetup: boolean
  setupInstructions?: string[]
}

export class ImageConverter {
  private pythonPath: string | null = null
  private img2pdfAvailable: boolean = false
  private img2pdfExePath: string | null = null
  private isWindows: boolean = os.platform() === 'win32'

  /**
   * Main environment check following the plan:
   * 1. Check if Python installed
   * 1.1 If Python installed -> check if img2pdf installed
   * 1.2 If Python NOT installed -> check if Windows (for standalone exe option)
   */
  async checkEnvironment(): Promise<EnvironmentStatus> {
    const status: EnvironmentStatus = {
      pythonAvailable: false,
      img2pdfAvailable: false,
      isWindows: this.isWindows,
      needsSetup: false
    }

    // Step 1: Check if Python is installed
    const pythonCheck = await this.checkPythonInstallation()
    
    if (pythonCheck.available) {
      // Step 1.1: Python is installed, check img2pdf
      status.pythonAvailable = true
      status.pythonPath = pythonCheck.pythonPath
      status.pythonVersion = pythonCheck.version
      this.pythonPath = pythonCheck.pythonPath || null

      const img2pdfCheck = await this.checkImg2pdfInstallation()
      if (img2pdfCheck.available) {
        // Step 1.1.1: img2pdf is installed and ready
        status.img2pdfAvailable = true
        status.img2pdfVersion = img2pdfCheck.version
        this.img2pdfAvailable = true
      } else {
        // Step 1.1.2: img2pdf NOT installed, needs auto-installation
        status.needsSetup = true
        status.setupInstructions = [
          'img2pdf package is not installed.',
          'Click "Install img2pdf" to automatically install it via pip.',
          'If automatic installation fails, you can install manually:',
          `${pythonCheck.pythonPath} -m pip install img2pdf`
        ]
      }
    } else {
      // Step 1.2: Python NOT installed
      if (this.isWindows) {
        // Step 1.2.1: Windows - check for standalone exe or guide to download
        const exeCheck = await this.checkImg2pdfExe()
        if (exeCheck.available) {
          status.img2pdfAvailable = true
          status.img2pdfExePath = exeCheck.exePath
          this.img2pdfExePath = exeCheck.exePath || null
        } else {
          status.needsSetup = true
          status.setupInstructions = [
            'Python is not installed on your system.',
            'For Windows, you can use the standalone img2pdf.exe:',
            '1. Download img2pdf.exe from: https://gitlab.mister-muffin.de/josch/img2pdf/releases',
            '2. Save it to a folder (e.g., C:\\Tools\\img2pdf.exe)',
            '3. Click "Set img2pdf.exe Path" and select the downloaded file',
            '',
            'Alternatively, install Python from python.org and restart the app.'
          ]
        }
      } else {
        // Step 1.2.2: Non-Windows - must install Python
        status.needsSetup = true
        status.setupInstructions = [
          'Python is not installed on your system.',
          'Please install Python 3.x from one of these sources:',
          '• Official Python: https://www.python.org/downloads/',
          '• Package manager: sudo apt install python3 (Ubuntu/Debian)',
          '• Package manager: brew install python3 (macOS)',
          '',
          'After installing Python, restart the application.'
        ]
      }
    }

    return status
  }

  /**
   * Check if Python is installed and which command works
   */
  private async checkPythonInstallation(): Promise<{
    available: boolean
    pythonPath?: string
    version?: string
  }> {
    const pythonCommands = ['python3', 'python', 'py']
    
    for (const cmd of pythonCommands) {
      try {
        const { stdout } = await execAsync(`${cmd} --version`)
        const version = stdout.trim()
        return {
          available: true,
          pythonPath: cmd,
          version
        }
      } catch {
        continue
      }
    }
    
    return { available: false }
  }

  /**
   * Check if img2pdf is installed in Python environment
   */
  private async checkImg2pdfInstallation(): Promise<{
    available: boolean
    version?: string
  }> {
    if (!this.pythonPath) return { available: false }

    try {
      const { stdout } = await execAsync(`${this.pythonPath} -c "import img2pdf; print(img2pdf.__version__)"`)
      return {
        available: true,
        version: stdout.trim()
      }
    } catch {
      return { available: false }
    }
  }

  /**
   * Check if img2pdf.exe is available (Windows standalone)
   */
  private async checkImg2pdfExe(): Promise<{
    available: boolean
    exePath?: string
  }> {
    // Check if we have a saved path from previous setup
    if (this.img2pdfExePath && fs.existsSync(this.img2pdfExePath)) {
      return {
        available: true,
        exePath: this.img2pdfExePath
      }
    }

    // Check common locations where user might have placed it
    const commonPaths = [
      path.join(process.env.USERPROFILE || '', 'Downloads', 'img2pdf.exe'),
      path.join('C:', 'Tools', 'img2pdf.exe'),
      path.join('C:', 'img2pdf', 'img2pdf.exe')
    ]

    for (const exePath of commonPaths) {
      if (fs.existsSync(exePath)) {
        this.img2pdfExePath = exePath
        return {
          available: true,
          exePath
        }
      }
    }

    return { available: false }
  }

  /**
   * Step 1.1.2: Automatically install img2pdf via pip
   */
  async installImg2pdf(): Promise<{ success: boolean; message: string }> {
    if (!this.pythonPath) {
      return {
        success: false,
        message: 'Python is not available. Please install Python first.'
      }
    }

    try {
      const { stdout, stderr } = await execAsync(`${this.pythonPath} -m pip install img2pdf`)
      
      // Verify installation
      const verification = await this.checkImg2pdfInstallation()
      if (verification.available) {
        this.img2pdfAvailable = true
        return {
          success: true,
          message: `img2pdf successfully installed (version ${verification.version})`
        }
      } else {
        return {
          success: false,
          message: 'Installation completed but img2pdf verification failed. Try manual installation.'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        message: `Auto-installation failed: ${errorMessage}. Please install manually: ${this.pythonPath} -m pip install img2pdf`
      }
    }
  }

  /**
   * Set custom path for img2pdf.exe (Windows)
   */
  async setImg2pdfExePath(exePath: string): Promise<{ success: boolean; message: string }> {
    if (!fs.existsSync(exePath)) {
      return {
        success: false,
        message: 'File does not exist at the specified path.'
      }
    }

    // Verify it's actually img2pdf.exe by trying to get version
    return new Promise((resolve) => {
      exec(`"${exePath}" --version`, (error, stdout, stderr) => {
        if (error || !stdout.includes('img2pdf')) {
          resolve({
            success: false,
            message: 'The selected file does not appear to be img2pdf.exe'
          })
        } else {
          this.img2pdfExePath = exePath
          resolve({
            success: true,
            message: `img2pdf.exe path set successfully: ${exePath}`
          })
        }
      })
    })
  }

  /**
   * Convert images to PDF using either Python img2pdf or standalone exe
   */
  async convertImagesToPdf(
    imagePaths: string[],
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    // Validate that we have a working conversion method
    if (!this.img2pdfAvailable && !this.img2pdfExePath) {
      return {
        success: false,
        message: 'img2pdf is not available. Please complete the setup first.',
        error: 'SETUP_REQUIRED'
      }
    }

    // Validate input files
    for (const imagePath of imagePaths) {
      if (!fs.existsSync(imagePath)) {
        return {
          success: false,
          message: `Image file not found: ${imagePath}`,
          error: 'FILE_NOT_FOUND'
        }
      }
    }

    // Determine output path
    let outputPath = options.outputPath
    if (!outputPath) {
      const firstImageDir = path.dirname(imagePaths[0])
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      outputPath = path.join(firstImageDir, `converted_images_${timestamp}.pdf`)
    }

    try {
      // Choose conversion method
      if (this.img2pdfAvailable && this.pythonPath) {
        return await this.convertWithPython(imagePaths, outputPath, options)
      } else if (this.img2pdfExePath) {
        return await this.convertWithExe(imagePaths, outputPath, options)
      } else {
        return {
          success: false,
          message: 'No conversion method available',
          error: 'NO_METHOD'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Convert using Python img2pdf
   */
  private async convertWithPython(
    imagePaths: string[],
    outputPath: string,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    const args = this.buildImg2pdfArgs(imagePaths, outputPath, options)
    
    return new Promise((resolve) => {
      const process = spawn(this.pythonPath!, ['-m', 'img2pdf', ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      process.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            outputPath,
            message: `Successfully converted ${imagePaths.length} image(s) to PDF using Python img2pdf`
          })
        } else {
          resolve({
            success: false,
            message: `Python conversion failed with exit code ${code}`,
            error: stderr || stdout || 'Unknown error'
          })
        }
      })

      process.on('error', (error) => {
        resolve({
          success: false,
          message: `Failed to start Python conversion: ${error.message}`,
          error: error.message
        })
      })
    })
  }

  /**
   * Convert using standalone img2pdf.exe
   */
  private async convertWithExe(
    imagePaths: string[],
    outputPath: string,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    const args = this.buildImg2pdfArgs(imagePaths, outputPath, options)
    
    return new Promise((resolve) => {
      const process = spawn(this.img2pdfExePath!, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      process.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            outputPath,
            message: `Successfully converted ${imagePaths.length} image(s) to PDF using img2pdf.exe`
          })
        } else {
          resolve({
            success: false,
            message: `Exe conversion failed with exit code ${code}`,
            error: stderr || stdout || 'Unknown error'
          })
        }
      })

      process.on('error', (error) => {
        resolve({
          success: false,
          message: `Failed to start exe conversion: ${error.message}`,
          error: error.message
        })
      })
    })
  }

  /**
   * Build command line arguments for img2pdf
   */
  private buildImg2pdfArgs(
    imagePaths: string[],
    outputPath: string,
    options: ConversionOptions
  ): string[] {
    const args: string[] = []

    // Output file
    args.push('-o', outputPath)

    // DPI
    if (options.dpi) {
      args.push('--imgsize', `${options.dpi}dpi`)
    }

    // Rotation
    if (options.rotation !== undefined) {
      if (options.rotation === 'auto') {
        args.push(`--auto-orient`)
      } else {
        args.push('--rotation', options.rotation.toString())
      }
    }

    // Add image files
    args.push(...imagePaths)

    return args
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): string[] {
    return [
      'jpg', 'jpeg', 'png', 'tiff', 'tif', 
      'bmp', 'gif', 'webp', 'jp2', 'j2k',
      'jpf', 'jpx', 'jpm', 'mj2'
    ]
  }

  /**
   * Validate if files are supported image formats
   */
  validateImageFiles(filePaths: string[]): { valid: boolean; unsupportedFiles: string[] } {
    const supportedFormats = this.getSupportedFormats()
    const unsupportedFiles: string[] = []

    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase().slice(1)
      if (!supportedFormats.includes(ext)) {
        unsupportedFiles.push(filePath)
      }
    }

    return {
      valid: unsupportedFiles.length === 0,
      unsupportedFiles
    }
  }
}

// Export singleton instance
export const imageConverter = new ImageConverter()
