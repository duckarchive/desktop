import React from "react";
import ImageToPdfConverter from "@/components/ImageToPdfConverter";

const ImageToPdf: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold">Image to PDF Converter</h2>
        <p className="text-sm text-gray-400">
          Convert multiple images into a single PDF document with various formatting options.
        </p>
      </header>
      
      <ImageToPdfConverter />
    </div>
  );
};

export default ImageToPdf;
