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
      label: "Wikisources Manager",
      icon: "📚",
      description: "Upload and manage files to Wikisources",
    },
    {
      id: "imageToPdf" as NavigationPage,
      label: "Image to PDF",
      icon: "🖼️",
      description: "Convert images to PDF documents",
    },
  ];

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-200 h-full relative">
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Качиний Помічник
          </h1>
          <p className="text-sm text-gray-600">Archive Management Tools</p>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={clsx(
                "w-full text-left p-2 bg-white rounded-lg transition-colors duration-150 cursor-pointer border-0",
                {
                  "bg-gray-800":
                    activePage === item.id,
                  "hover:bg-gray-200 text-gray-700 border border-transparent":
                    activePage !== item.id,
                }
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.description}
                  </div>
                </div>
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
