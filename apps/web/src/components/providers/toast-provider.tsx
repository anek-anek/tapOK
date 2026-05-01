'use client';

import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#000000',
          borderRadius: '0px',
          border: '2px solid #000000',
          boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          padding: '12px 16px',
          fontWeight: '600',
          fontSize: '14px',
          maxWidth: '400px',
        },
        success: {
          iconTheme: {
            primary: '#000000',
            secondary: '#4ADE80',
          },
          style: {
            background: '#4ADE80',
          },
        },
        error: {
          iconTheme: {
            primary: '#000000',
            secondary: '#F87171',
          },
          style: {
            background: '#F87171',
          },
        },
      }}
    />
  );
};
