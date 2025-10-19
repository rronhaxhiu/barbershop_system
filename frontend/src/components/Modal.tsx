'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

interface ModalContextType {
  confirm: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

interface ActiveModal extends ModalOptions {
  id: string;
  resolve: (value: boolean) => void;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ActiveModal | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const confirm = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      setModal({
        id,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modal) {
      modal.resolve(true);
      setModal(null);
    }
  };

  const handleCancel = () => {
    if (modal) {
      modal.resolve(false);
      setModal(null);
    }
  };

  const getModalStyles = (type?: string) => {
    switch (type) {
      case 'danger':
        return {
          icon: (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ),
          confirmClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ),
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        };
      case 'success':
        return {
          icon: (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          confirmClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        };
      default:
        return {
          icon: (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          confirmClass: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        };
    }
  };

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {modal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity animate-fade-in"
              onClick={handleCancel}
            />
            
            {/* Modal */}
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-lg animate-scale-in">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="sm:flex sm:items-start">
                  {getModalStyles(modal.type).icon}
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-2">
                      {modal.title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {modal.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`inline-flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm sm:w-auto transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getModalStyles(modal.type).confirmClass}`}
                >
                  {modal.confirmText || 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {modal.cancelText || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </ModalContext.Provider>
  );
}

