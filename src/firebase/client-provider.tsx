'use client';

import { app, auth, firestore } from './config';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: This is a client component, so it will only run on the client.
  // This is intentional to avoid rendering Firebase on the server.
  // We can add SSR later if needed.
  return (
    <FirebaseProvider value={{ app, auth, firestore }}>
      {children}
    </FirebaseProvider>
  );
}
