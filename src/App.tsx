import React, { useState } from "react";
import Navbar, { NavigationPage } from "@/components/Navbar";
import WikisourcesManager from "@/containers/WikisourcesManager";
import ImageToPdf from "@/containers/ImageToPdf";
import Footer from "@/components/Footer";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('wikisources');

  const renderContent = () => {
    switch (activePage) {
      case 'wikisources':
        return <WikisourcesManager />;
      case 'imageToPdf':
        return <ImageToPdf />;
      default:
        return <WikisourcesManager />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Navbar activePage={activePage} onPageChange={setActivePage} />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
