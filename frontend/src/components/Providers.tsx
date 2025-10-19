'use client';

import { ReactNode } from 'react';
import { ToastProvider } from './Toast';
import { ModalProvider } from './Modal';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </ToastProvider>
  );
}

