'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ease-in-out transform";
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${getToastStyles(toast.type)} pointer-events-auto animate-slide-in-right`}
              style={{
                animation: 'slideInRight 0.3s ease-out'
              }}
            >
              {getIcon(toast.type)}
              <div className="flex-1">
                <p className="font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

