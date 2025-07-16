import React, { useEffect, useState } from "react";
import ImageToPdfConverter from "@/components/ImageToPdfConverter";
import EnvironmentSetupModal from "@/components/EnvironmentSetupModal";
import { useElectronApi } from "@/providers/ElectronApiProvider";

export interface ImageToPdfEnvironmentStatus {
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

const ImageToPdf: React.FC = () => {
  const electronAPI = useElectronApi();
  const [environment, setEnvironment] = useState<ImageToPdfEnvironmentStatus>({
    checking: true,
    pythonAvailable: false,
    img2pdfAvailable: false,
    isWindows: false,
    needsSetup: false
  })

  // Check environment on component mount
  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    setEnvironment(prev => ({ ...prev, checking: true }))
    
    try {
      const result = await electronAPI.imageConverter.checkEnvironment()
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

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold">Зображення в PDF</h2>
        <EnvironmentSetupModal onEnvironmentChange={checkEnvironment} />
      </header>
      
      <ImageToPdfConverter
        environment={environment}
      />
    </div>
  );
};

export default ImageToPdf;
