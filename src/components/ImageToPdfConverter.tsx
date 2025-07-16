import React, { useState, useEffect, useCallback } from 'react'
import Button from './Button'
import ProgressContainer from './ProgressContainer'
import { useToastHelpers } from '@/providers/ToastProvider'

interface ImageFile {
  filePath: string
  fileName: string
  fileSize: number
}

interface ConversionOptions {
  dpi: number
  rotation: 'auto' | 0 | 90 | 180 | 270
}

interface EnvironmentStatus {
  checking: boolean
  pythonAvailable: boolean
  pythonPath?: string
  pythonVersion?: string
  img2pdfAvailable: boolean
  img2pdfVersion?: string
  img2pdfExePath?: string
  isWindows: boolean
  needsSetup: boolean
  setupInstructions?: string[]
  error?: string
}

export const ImageToPdfConverter: React.FC = () => {
  const { showError } = useToastHelpers();
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState<{ progress: number; message: string } | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; outputPath?: string } | null>(null)
  const [environment, setEnvironment] = useState<EnvironmentStatus>({
    checking: true,
    pythonAvailable: false,
    img2pdfAvailable: false,
    isWindows: false,
    needsSetup: false
  })
  const [options, setOptions] = useState<ConversionOptions>({
    dpi: 300,
    rotation: 'auto'
  })
  const [installing, setInstalling] = useState(false)

  // Check environment on component mount
  useEffect(() => {
    checkEnvironment()
  }, [])

  // Set up progress listener
  useEffect(() => {
    if (!window.electronAPI) {
      showError("Electron API недоступне");
      return;
    }
    const handleProgress = (data: { progress: number; message: string }) => {
      setProgress(data)
    }

    window.electronAPI.imageConverter.onProgress(handleProgress)

    return () => {
      window.electronAPI?.imageConverter.removeProgressListener()
    }
  }, [])

  const checkEnvironment = async () => {
    if (!window.electronAPI) {
      showError("Electron API недоступне");
      return;
    }
    setEnvironment(prev => ({ ...prev, checking: true }))
    
    try {
      const result = await window.electronAPI.imageConverter.checkEnvironment()
      setEnvironment({
        checking: false,
        pythonAvailable: result.pythonAvailable,
        pythonPath: result.pythonPath,
        pythonVersion: result.pythonVersion,
        img2pdfAvailable: result.img2pdfAvailable,
        img2pdfVersion: result.img2pdfVersion,
        img2pdfExePath: result.img2pdfExePath,
        isWindows: result.isWindows,
        needsSetup: result.needsSetup,
        setupInstructions: result.setupInstructions,
        error: result.error
      })
    } catch (error) {
      setEnvironment({
        checking: false,
        pythonAvailable: false,
        img2pdfAvailable: false,
        isWindows: false,
        needsSetup: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleSelectImages = async () => {
    try {
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      const files = await window.electronAPI.openImages()
      if (files && files.length > 0) {
        setSelectedImages(files)
        setResult(null) // Clear previous result
      }
    } catch (error) {
      console.error('Error selecting images:', error)
    }
  }

  const handleInstallImg2pdf = async () => {
    setInstalling(true)
    try {
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      const result = await window.electronAPI.imageConverter.installImg2pdf()
      if (result.success) {
        await checkEnvironment() // Refresh environment status
      }
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Installation failed'
      })
    } finally {
      setInstalling(false)
    }
  }

  const handleSelectImg2pdfExe = async () => {
    try {
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      const exePath = await window.electronAPI.selectImg2pdfExe()
      if (exePath) {
        const result = await window.electronAPI.imageConverter.setExePath(exePath)
        if (result.success) {
          await checkEnvironment() // Refresh environment status
        }
        setResult(result)
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set exe path'
      })
    }
  }

  const handleConvert = async () => {
    if (selectedImages.length === 0) return

    setIsConverting(true)
    setProgress(null)
    setResult(null)

    try {
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      // Get output path from user
      const outputPath = await window.electronAPI.savePdf('converted_images.pdf')
      if (!outputPath) {
        setIsConverting(false)
        return
      }

      // Convert images
      const result = await window.electronAPI.imageConverter.convertToPdf(
        selectedImages.map(img => img.filePath),
        {
          outputPath,
          ...options
        }
      )

      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Conversion failed'
      })
    } finally {
      setIsConverting(false)
      setProgress(null)
    }
  }

  const removeImage = useCallback((filePath: string) => {
    setSelectedImages(prev => prev.filter(img => img.filePath !== filePath))
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (environment.checking) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Checking environment...</span>
        </div>
      </div>
    )
  }

  // Show setup instructions if needed
  if (environment.needsSetup) {
    return (
      <div className="bg-white rounded-lg p-6">
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <h3 className="text-yellow-800 font-medium mb-2">Setup Required</h3>
          {environment.setupInstructions && (
            <div className="text-yellow-700 space-y-1">
              {environment.setupInstructions.map((instruction, index) => (
                <p key={index} className="text-sm">
                  {instruction}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Step 1.1.2: Auto-install img2pdf if Python is available */}
          {environment.pythonAvailable && !environment.img2pdfAvailable && (
            <Button
              onClick={handleInstallImg2pdf}
              disabled={installing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {installing ? 'Installing img2pdf...' : 'Install img2pdf'}
            </Button>
          )}

          {/* Step 1.2.1: Select img2pdf.exe for Windows */}
          {!environment.pythonAvailable && environment.isWindows && (
            <Button
              onClick={handleSelectImg2pdfExe}
              className="bg-green-600 hover:bg-green-700"
            >
              Set img2pdf.exe Path
            </Button>
          )}

          {/* Always allow re-checking */}
          <Button
            onClick={checkEnvironment}
            variant="secondary"
          >
            Check Again
          </Button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Main conversion interface when setup is complete
  return (
    <div className="bg-white rounded-lg p-6">
      
      {/* Environment Status */}
      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
        <p className="text-green-700 text-sm">
          ✓ Ready to convert images to PDF
          {environment.pythonAvailable && environment.pythonVersion && (
            <span className="block">Python {environment.pythonVersion} with img2pdf {environment.img2pdfVersion}</span>
          )}
          {environment.img2pdfExePath && (
            <span className="block">Using img2pdf.exe: {environment.img2pdfExePath}</span>
          )}
        </p>
      </div>

      {/* Conversion Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DPI
          </label>
          <select
            value={options.dpi}
            onChange={(e) => setOptions(prev => ({ ...prev, dpi: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={150}>150 DPI</option>
            <option value={300}>300 DPI</option>
            <option value={600}>600 DPI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rotation
          </label>
          <select
            value={options.rotation}
            onChange={(e) => setOptions(prev => ({ ...prev, rotation: e.target.value as ConversionOptions['rotation'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto">Auto</option>
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
      </div>

      {/* File Selection */}
      <div className="mb-4">
        <Button onClick={handleSelectImages} disabled={isConverting}>
          Select Images
        </Button>
      </div>

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">
            Selected Images ({selectedImages.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedImages.map((image) => (
              <div
                key={image.filePath}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.fileName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(image.fileSize)}
                  </p>
                </div>
                <Button
                  onClick={() => removeImage(image.filePath)}
                  variant="secondary"
                  size="small"
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convert Button */}
      {selectedImages.length > 0 && (
        <div className="mb-4">
          <Button
            onClick={handleConvert}
            disabled={isConverting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConverting ? 'Converting...' : `Convert ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''} to PDF`}
          </Button>
        </div>
      )}

      {/* Progress */}
      {isConverting && progress && (
        <ProgressContainer
          show={true}
          progress={progress.progress}
          message={progress.message}
        />
      )}

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={result.success ? 'text-green-700' : 'text-red-700'}>
            {result.message}
          </p>
          {result.success && result.outputPath && (
            <p className="text-green-600 text-sm mt-1">
              Saved to: {result.outputPath}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageToPdfConverter
