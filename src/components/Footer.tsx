import React from "react";
import Button from "./Button";

interface FooterProps {
  version: string;
}

const Footer: React.FC<FooterProps> = ({
  version,
}) => {
  return (
    <footer className="mt-4 text-center text-xs text-gray-400">
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
      <span className="mx-2">|</span>
      <a
        href="https://uk.wikisource.org/wiki/%D0%90%D1%80%D1%85%D1%96%D0%B2:%D0%90%D1%80%D1%85%D1%96%D0%B2%D0%B8"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:underline"
      >
        📚 Архіви на Вікіджерелах
      </a>
    </footer>
  );
};

export default Footer;
