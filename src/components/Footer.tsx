import { useEffect, useState } from "react";
import Button from "./Button";
import { useToastHelpers } from "@/providers/ToastProvider";

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const { showError } = useToastHelpers();
  const [version, setVersion] = useState("Завантаження...");

  useEffect(() => {
    if (!window.electronAPI) {
      showError("Electron API недоступне");
      return;
    }
    window.electronAPI.getVersion().then((ver) => {
      setVersion(ver);
    }).catch((error) => {
      console.error("Failed to load version:", error);
      setVersion("Невідома");
    });
  }, []);

  return (
    <footer className="mt-4 text-center text-xs text-gray-400 absolute bottom-0 left-0 right-0 p-4">
      <a
        href={`https://github.com/duckarchive/desktop/releases/v${version}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:underline"
      >
        Версія: {version}
      </a>
      <span className="mx-2">|</span>
      <a
        href="https://github.com/duckarchive/desktop"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:underline"
      >
        📂 Вихідний код
      </a>
    </footer>
  );
};

export default Footer;
