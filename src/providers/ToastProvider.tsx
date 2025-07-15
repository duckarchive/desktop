import clsx from "clsx";
import React, { createContext, useContext, useState, useCallback } from "react";

// Import the base Message interface
interface Message {
  type: "success" | "error" | "warning";
  text: string;
  html?: boolean;
}

// Extended Message interface for toast functionality
interface ToastMessage extends Message {
  id: string;
  duration?: number; // Auto-dismiss duration in ms
  timestamp: number;
}

// Toast Context interface
interface ToastContextType {
  messages: ToastMessage[];
  addToast: (message: Omit<ToastMessage, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: Omit<ToastMessage, "id" | "timestamp">) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newToast: ToastMessage = {
        ...message,
        id,
        timestamp: Date.now(),
        duration: message.duration || 5000, // Default 5 seconds
      };

      setMessages((prev) => [...prev, newToast]);

      // Auto-dismiss if duration is set
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setMessages([]);
  }, []);

  const value: ToastContextType = {
    messages,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Individual Toast Component
const Toast: React.FC<{ message: ToastMessage; onClose: () => void }> = ({
  message,
  onClose,
}) => {
  const getToastStyles = (type: ToastMessage["type"]) => {
    switch (type) {
      case "success":
        return `bg-green-50/90 border-green-500 text-green-800`;
      case "error":
        return `bg-red-50/90 border-red-500 text-red-800`;
      case "warning":
        return `bg-yellow-50/90 border-yellow-500 text-yellow-800`;
      default:
        return `bg-blue-50/90 border-blue-500 text-blue-800`;
    }
  };

  const getIcon = (type: ToastMessage["type"]) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      className={clsx(
        "p-4 rounded-lg cursor-pointer flex gap-2 items-center transition-all duration-300 ease-in-out transform hover:scale-105",
        getToastStyles(message.type)
      )}
      onClick={onClose}
    >
      <span className="text-xl leading-0">{getIcon(message.type)}</span>
      <p className="text-sm font-medium leading-relaxed">
        {message.text}
      </p>
    </div>
  );
};

// Toast Container Component
const ToastContainer: React.FC = () => {
  const { messages, removeToast } = useToast();

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full flex flex-col gap-1">
      {messages.map((message) => (
        <Toast
          key={message.id}
          message={message}
          onClose={() => removeToast(message.id)}
        />
      ))}
    </div>
  );
};

export const useToastHelpers = () => {
  const { addToast } = useToast();

  const showSuccess = (message: string, duration?: number) => {
    addToast({
      type: "success",
      text: message,
      duration,
    });
  };

  const showError = (message: string, duration?: number) => {
    addToast({
      type: "error",
      text: message,
      duration, // Errors stay longer
    });
  };

  const showWarning = (message: string, duration?: number) => {
    addToast({
      type: "warning",
      text: message,
      duration,
    });
  };

  const showInfo = (message: string, duration?: number) => {
    addToast({
      type: "success", // Using success type for info messages
      text: message,
      duration,
    });
  };

  const showPersistent = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    addToast({
      type,
      text: message,
      duration: 0, // 0 means no auto-dismiss
    });
  };

  const showHtml = (
    type: "success" | "error" | "warning",
    htmlContent: string,
    duration?: number
  ) => {
    addToast({
      type,
      text: htmlContent,
      html: true,
      duration: duration || 5000,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPersistent,
    showHtml,
  };
};
