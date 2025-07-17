import { useEffect, useState } from "react";
import { Link } from "@heroui/link";
import { useElectronApi } from "@/providers/ElectronApiProvider";

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const electronAPI = useElectronApi();
  const [version, setVersion] = useState("Завантаження...");

  useEffect(() => {
    electronAPI.getVersion().then((ver) => {
      setVersion(ver);
    }).catch((error) => {
      console.error("Failed to load version:", error);
      setVersion("Невідома");
    });
  }, []);

  return (
    <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-2">
      <Link
        href={`https://github.com/duckarchive/desktop/releases/v${version}`}
        target="_blank"
        rel="noopener noreferrer"
        size="sm"
        className="text-gray-500 hover:underline"
      >
        v{version}
      </Link>
      <span className="text-xs text-gray-400">|</span>
      <Link
        href="https://github.com/duckarchive/desktop"
        target="_blank"
        rel="noopener noreferrer"
        size="sm"
        className="text-gray-500 hover:underline"
      >
        Вихідний код
      </Link>
    </footer>
  );
};

export default Footer;
