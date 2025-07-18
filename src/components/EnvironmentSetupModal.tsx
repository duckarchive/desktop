import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [environment, setEnvironment] = useState<EnvironmentStatus>({
    checking: true,
    pythonAvailable: false,
    img2pdfAvailable: false,
    isWindows: false,
    needsSetup: false,
  });
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
        const result = await electronAPI.imageConverter.setExePath(exePath);
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
      const pythonText =
        environment.pythonAvailable &&
        (environment.pythonVersion?.includes("Python")
          ? environment.pythonVersion
          : `Python ${environment.pythonVersion}`);
      const img2pdfText =
        environment.img2pdfAvailable &&
        ((environment.img2pdfExePath || environment.img2pdfVersion)?.includes(
          "img2pdf"
        )
          ? environment.img2pdfExePath || environment.img2pdfVersion
          : `img2pdf ${
              environment.img2pdfExePath || environment.img2pdfVersion
            }`);
      return (
        <span className="text-green-600">
          ✅ {[pythonText, img2pdfText].filter(Boolean).join(" | ")}
        </span>
      );
    }

    return (
      <span className="text-red-600">
        ❌ Потрібне налаштування. Натисніть для налаштування.
      </span>
    );
  };

  return (
    <>
      <div
        className="text-sm text-gray-600 cursor-pointer"
        onClick={onOpen}
        aria-label="Open environment setup modal"
      >
        {getStatusDisplay()}
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Налаштування конвертера
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Current Status */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Python:
                    </span>
                    <span
                      className={
                        environment.pythonAvailable
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {environment.pythonAvailable
                        ? `✅ ${environment.pythonVersion} (${environment.pythonPath})`
                        : "❌ Недоступний"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      img2pdf:
                    </span>
                    <span
                      className={
                        environment.img2pdfAvailable
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {environment.img2pdfAvailable
                        ? `✅ ${
                            environment.img2pdfExePath ||
                            environment.img2pdfVersion
                          }`
                        : "❌ Недоступний"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Система:
                    </span>
                    <span className="text-gray-900 dark:text-gray-300">
                      {environment.isWindows ? "Windows" : "Linux/Mac"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Setup Instructions */}
              {environment.needsSetup && environment.setupInstructions && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4">
                  <h3 className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">
                    Інструкції з налаштування
                  </h3>
                  <div className="text-yellow-700 dark:text-yellow-200 space-y-1">
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
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600 rounded-lg p-4">
                  <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">
                    Помилка
                  </h3>
                  <p className="text-red-700 dark:text-red-200 text-sm">
                    {environment.error}
                  </p>
                </div>
              )}

              {/* Result Display */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-600"
                      : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600"
                  }`}
                >
                  <p
                    className={
                      result.success
                        ? "text-green-700 dark:text-green-200"
                        : "text-red-700 dark:text-red-200"
                    }
                  >
                    {result.message}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="flex flex-wrap justify-end gap-3 w-full">
            {/* Auto-install img2pdf if Python is available */}
            {environment.pythonAvailable && !environment.img2pdfAvailable && (
              <Button
                color="primary"
                variant="bordered"
                onPress={handleInstallImg2pdf}
                isLoading={installing}
              >
                {installing ? "Встановлення img2pdf..." : "Встановити img2pdf"}
              </Button>
            )}

            {/* Select img2pdf.exe for Windows */}
            {!environment.pythonAvailable && environment.isWindows && (
              <Button
                color="primary"
                variant="bordered"
                onPress={handleSelectImg2pdfExe}
              >
                Вказати шлях до img2pdf.exe
              </Button>
            )}

            {/* Refresh button */}
            <Button
              onPress={handleRefreshEnvironment}
              isDisabled={environment.checking}
              color="primary"
            >
              {environment.checking ? "Перевірка..." : "Оновити"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EnvironmentSetupModal;
