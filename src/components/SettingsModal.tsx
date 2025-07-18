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
import { Input } from "@heroui/input";
import { useToastHelpers } from "@/providers/ToastProvider";
import { useElectronApi } from "@/providers/ElectronApiProvider";
import { Link } from "@heroui/link";

interface SettingsModalProps {
  username?: string;
  onSave: (username?: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onSave,
  username: defaultUsername = "",
}) => {
  const { showError, showSuccess, showWarning } = useToastHelpers();
  const electronAPI = useElectronApi();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      showError("Будь ласка, заповніть всі поля");
      return;
    }

    setIsLoading(true);

    try {
      const result = await electronAPI.saveCredentials({
        username: trimmedUsername,
        password: trimmedPassword
      });

      if (result.success) {
        showSuccess("Облікові дані успішно збережено!");
        if (result.warning) {
          showWarning(result.warning);
        }
      } else {
        showError(result.message || "Не вдалося зберегти облікові дані");
      }

      onSave(trimmedUsername);
      setPassword("");
      onClose();
    } catch (error) {
      console.error("Failed to save credentials:", error);
      showError("Помилка збереження: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Ви впевнені, що хочете видалити збережені облікові дані?")) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await electronAPI.clearCredentials();

      if (result.success) {
        showSuccess("Облікові дані видалено!");
        setUsername("");
        setPassword("");
        onSave(undefined);
      } else {
        showError(result.message || "Не вдалося видалити облікові дані");
      }
    } catch (error) {
      console.error("Failed to remove credentials:", error);
      showError("Помилка видалення: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="text-sm text-gray-600 cursor-pointer"
        onClick={onOpen}
        aria-label="Open settings modal"
      >
        {defaultUsername ? (
          <span className="text-green-600">
            ✅&nbsp;{defaultUsername}
          </span>
        ) : (
          <span className="text-red-600">
            ❌ Облікові дані відсутні. Натисніть, щоб налаштувати.
          </span>
        )}
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            Налаштування облікових даних
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 leading-relaxed">
              Для завантаження файлів до Вікіджерел потрібно&nbsp;
              <Link
                href="https://www.mediawiki.org/wiki/Special:BotPasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                створити бота.
              </Link>
            </p>

            {defaultUsername && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                ✅ Облікові дані збережено
              </div>
            )}
            <Input
              type="text"
              label="Ім'я бота"
              placeholder="Ім'я бота (не ваш основний акаунт!)"
              value={username}
              onValueChange={setUsername}
              isDisabled={isLoading}
              isRequired
            />

            <Input
              type="password"
              label="Пароль бота"
              placeholder="Пароль бота (не ваш основний пароль!)"
              value={password}
              onValueChange={setPassword}
              isDisabled={isLoading}
              isRequired
            />
          </ModalBody>
          <ModalFooter className="flex flex-wrap justify-end gap-3 w-full">
            {defaultUsername && (
              <Button
                color="danger"
                variant="light"
                onPress={handleRemove}
                isDisabled={isLoading}
              >
                Видалити облікові дані
              </Button>
            )}
            <Button
              type="submit"
              color="primary"
              isDisabled={isLoading}
              isLoading={isLoading}
            >
              Зберегти
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SettingsModal;
