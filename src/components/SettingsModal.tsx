import React, { useState, useEffect } from "react";
import Button from "./Button";
import { useToastHelpers } from "@/providers/ToastProvider";

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
  onMessage: (message: Message) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  show,
  onClose,
  onCredentialsUpdated,
  onMessage,
}) => {
  const { showError } = useToastHelpers();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<any>(null);

  useEffect(() => {
    if (show) {
      loadCredentialsStatus();
    }
  }, [show]);

  const loadCredentialsStatus = async () => {
    if (!window.electronAPI) {
      showError("Electron API недоступне");
      return;
    }
    const status = await window.electronAPI.getCredentialsStatus();
    setCredentialsStatus(status);

    if (status.hasCredentials) {
      setUsername(status.username || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      onMessage({
        type: "error",
        text: "Будь ласка, заповніть всі поля",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!window.electronAPI) {
        throw new Error("Electron API недоступне");
      }

      const result = await window.electronAPI.saveCredentials(
        username.trim(),
        password.trim()
      );

      if (result.success) {
        onMessage({
          type: "success",
          text: "Облікові дані успішно збережено!",
        });
        if (result.warning) {
          onMessage({
            type: "warning",
            text: result.warning,
          });
        }
        onCredentialsUpdated();
        onClose();
        // Clear password for security
        setPassword("");
      } else {
        onMessage({
          type: "error",
          text: result.message || "Не вдалося зберегти облікові дані",
        });
      }
    } catch (error) {
      console.error("Failed to save credentials:", error);
      onMessage({
        type: "error",
        text: "Помилка збереження: " + (error as Error).message,
      });
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
      if (!window.electronAPI) {
        throw new Error("Electron API недоступне");
      }

      const result = await window.electronAPI.clearCredentials();

      if (result.success) {
        onMessage({
          type: "success",
          text: "Облікові дані видалено!",
        });
        setUsername("");
        setPassword("");
        onCredentialsUpdated();
      } else {
        onMessage({
          type: "error",
          text: result.message || "Не вдалося видалити облікові дані",
        });
      }
    } catch (error) {
      console.error("Failed to remove credentials:", error);
      onMessage({
        type: "error",
        text: "Помилка видалення: " + (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-black rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in slide-in-from-bottom-12 fade-in-0 duration-300">
        <span
          className="absolute top-4 right-4 text-2xl font-bold cursor-pointer text-gray-400 hover:text-gray-200 transition-colors p-1 leading-none"
          onClick={onClose}
        >
          &times;
        </span>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4 pr-8">
          Налаштування облікових даних
        </h2>

        <p className="text-gray-400 leading-relaxed mb-4">
          Для завантаження файлів до Вікібібліотеки потрібно створити бота та
          отримати облікові дані.
          <br />
          <a
            href="https://www.mediawiki.org/wiki/Special:BotPasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            🔗 Створити бота
          </a>
        </p>

        {credentialsStatus?.hasCredentials && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
            <strong className="text-green-800">
              ✅ Облікові дані збережено
            </strong>
            <br />
            <span className="text-green-700">
              Користувач: {credentialsStatus.username}
            </span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block mb-2 font-medium text-gray-200"
            >
              Ім'я бота:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ім'я бота (не ваш основний акаунт!)"
              disabled={isLoading}
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-md text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block mb-2 font-medium text-gray-200"
            >
              Пароль бота:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль бота (не ваш основний пароль!)"
              disabled={isLoading}
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-md text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-2 mt-8 flex-wrap">
            <Button type="submit" disabled={isLoading} loading={isLoading}>
              Зберегти
            </Button>

            {credentialsStatus?.hasCredentials && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleRemove}
                disabled={isLoading}
              >
                Видалити облікові дані
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Скасувати
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
