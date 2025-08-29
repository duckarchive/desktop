import Footer from "@/components/Footer";
import clsx from "clsx";
import React from "react";

export type NavigationPage = "wikisources" | "imageToPdf";

interface NavbarProps {
  activePage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onPageChange }) => {
  const navigationItems = [
    {
      id: "wikisources" as NavigationPage,
      label: "PDF на Вікіджерела",
      icon: "📚",
      description: "Завантажуйте та керуйте файлами для Вікіджерел",
    },
    {
      id: "imageToPdf" as NavigationPage,
      label: "Зображення в PDF",
      icon: "🖼️",
      description: "Конвертуйте зображення у PDF документи",
    },
  ];

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-200 h-full relative">
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Качиний Помічник
          </h1>
        </div>

        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={clsx(
                "w-full text-left p-2 rounded-lg transition-colors duration-150 cursor-pointer border-0 text-gray-800",
                {
                  "bg-gray-800 text-white": activePage === item.id,
                  "hover:bg-gray-200 hover:text-gray-700 bg-white": activePage !== item.id,
                }
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      <Footer />
    </aside>
  );
};

export default Navbar;
