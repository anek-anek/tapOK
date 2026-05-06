'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useAuthFormReset(resetFields: () => void) {
  const formRef = useRef<HTMLFormElement>(null);

  const clearForm = useCallback(() => {
    resetFields();
    formRef.current?.reset();
  }, [resetFields]);

  useEffect(() => {
    const handlePageShow = () => {
      clearForm();
    };

    const handlePageHide = () => {
      clearForm();
    };

    clearForm();
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    const form = formRef.current;
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      form?.reset();
    };
  }, [clearForm]);

  return { formRef, clearForm };
}
