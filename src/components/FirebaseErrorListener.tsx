'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In a real app, you might use a toast notification or a dedicated error UI.
      // For development, we'll throw it so Next.js can display its error overlay.
      // This provides a rich, interactive debugging experience.
      if (process.env.NODE_ENV === 'development') {
        // We throw the error in a timeout to break out of the current React render cycle
        // and ensure Next.js catches it as an unhandled runtime error.
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // In production, you might log this to an error reporting service.
        console.error(error.message);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  // This component does not render anything.
  return null;
}
