import React, { useState, useEffect } from "react";
import Button from "./Button";
import { useElectronApi } from "@/providers/ElectronApiProvider";

interface EnvironmentStatus {
  checking: boolean;
  pythonAvailable: boolean;
  pythonPath?: string;
  pythonVersion?: string;
  img2pdfAvailable: boolean;
  img2pdfVersion?: string;
  img2pdfExePath?: string;
  isWindows: boolean;
  needsSetup: boolean;
  setupInstructions?: string[];
  error?: string;
}

interface EnvironmentSetupModalProps {
  onEnvironmentChange: () => void;
}

const EnvironmentSetupModal: React.FC<EnvironmentSetupModalProps> = ({
  onEnvironmentChange,
}) => {
  const electronAPI = useElectronApi();
  const [environment, setEnvironment] = useState<EnvironmentStatus>({
    checking: true,
    pythonAvailable: false,
    img2pdfAvailable: false,
    isWindows: false,
    needsSetup: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    outputPath?: string;
  } | null>(null);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    setEnvironment((prev) => ({ ...prev, checking: true }));

    try {
      const result = await electronAPI.imageConverter.checkEnvironment();
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
        error: result.error,
      });
    } catch (error) {
      setEnvironment({
        checking: false,
        pythonAvailable: false,
        img2pdfAvailable: false,
        isWindows: false,
        needsSetup: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleInstallImg2pdf = async () => {
    setInstalling(true);
    try {
      const result = await electronAPI.imageConverter.installImg2pdf();
      if (result.success) {
        await checkEnvironment(); // Refresh environment status
        onEnvironmentChange(); // Notify parent component
      }
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Installation failed",
      });
    } finally {
      setInstalling(false);
    }
  };

  const handleSelectImg2pdfExe = async () => {
    try {
      const exePath = await electronAPI.selectImg2pdfExe();
      if (exePath) {
        const result = await electronAPI.imageConverter.setExePath(
          exePath
        );
        if (result.success) {
          await checkEnvironment(); // Refresh environment status
          onEnvironmentChange(); // Notify parent component
        }
        setResult(result);
      }
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to set exe path",
      });
    }
  };

  const handleRefreshEnvironment = async () => {
    await checkEnvironment();
    onEnvironmentChange();
  };

  const getStatusDisplay = () => {
    if (environment.checking) {
      return (
        <span className="text-yellow-600">🔄 Перевірка налаштувань...</span>
      );
    }

    if (!environment.needsSetup) {
      const { pythonAvailable, pythonVersion, img2pdfVersion, img2pdfExePath, img2pdfAvailable } = environment;
      const pythonText = pythonAvailable && pythonVersion;
      const img2pdfText = img2pdfAvailable && (img2pdfExePath || img2pdfVersion);
      return (
        <span className="text-green-600">
          ✅ {pythonText} | img2pdf {img2pdfText}
        </span>
      );
    }

    return (
      <span className="text-red-600">
        ❌ Потрібне налаштування. Натисніть для налаштування.
      </span>
    );
  };

  if (!isModalOpen) {
    return (
      <div
        className="text-sm text-gray-600 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        aria-label="Open environment setup modal"
      >
        {getStatusDisplay()}
      </div>
    );
  } else {
    return (
      <>
        <div
          id="environment-setup-modal"
          className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-black rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in slide-in-from-bottom-12 fade-in-0 duration-300">
            <span
              className="absolute top-4 right-4 text-2xl font-bold cursor-pointer text-gray-400 hover:text-gray-200 transition-colors p-1 leading-none"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h2 className="text-2xl font-semibold text-gray-200 mb-4 pr-8">
              Налаштування конвертера
            </h2>

            <div className="space-y-4">
              {/* Current Status */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-200 mb-3">
                  Поточний статус
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Python:</span>
                    <span
                      className={
                        environment.pythonAvailable
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {environment.pythonAvailable
                        ? `✅ ${environment.pythonVersion} (${environment.pythonPath})`
                        : "❌ Недоступний"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">img2pdf:</span>
                    <span
                      className={
                        environment.img2pdfAvailable
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {environment.img2pdfAvailable
                        ? `✅ ${environment.img2pdfVersion}`
                        : "❌ Недоступний"}
                    </span>
                  </div>

                  {environment.img2pdfExePath && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">img2pdf.exe:</span>
                      <span className="text-green-400 text-xs">
                        ✅ {environment.img2pdfExePath}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-400">Система:</span>
                    <span className="text-gray-300">
                      {environment.isWindows ? "Windows" : "Linux/Mac"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Setup Instructions */}
              {environment.needsSetup && environment.setupInstructions && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-medium mb-2">
                    Інструкції з налаштування
                  </h3>
                  <div className="text-yellow-200 space-y-1">
                    {environment.setupInstructions.map((instruction, index) => (
                      <p key={index} className="text-sm">
                        {instruction}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {environment.error && (
                <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
                  <h3 className="text-red-400 font-medium mb-2">Помилка</h3>
                  <p className="text-red-200 text-sm">{environment.error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Auto-install img2pdf if Python is available */}
                {environment.pythonAvailable &&
                  !environment.img2pdfAvailable && (
                    <Button
                      onClick={handleInstallImg2pdf}
                      disabled={installing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {installing
                        ? "Встановлення img2pdf..."
                        : "Встановити img2pdf"}
                    </Button>
                  )}

                {/* Select img2pdf.exe for Windows */}
                {!environment.pythonAvailable && environment.isWindows && (
                  <Button
                    onClick={handleSelectImg2pdfExe}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Обрати img2pdf.exe
                  </Button>
                )}

                {/* Refresh button */}
                <Button
                  onClick={handleRefreshEnvironment}
                  variant="secondary"
                  disabled={environment.checking}
                >
                  {environment.checking ? "Перевірка..." : "Оновити статус"}
                </Button>

                {/* Close button */}
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                >
                  Закрити
                </Button>
              </div>

              {/* Result Display */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-green-900/30 border border-green-600"
                      : "bg-red-900/30 border border-red-600"
                  }`}
                >
                  <p
                    className={
                      result.success ? "text-green-200" : "text-red-200"
                    }
                  >
                    {result.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default EnvironmentSetupModal;
