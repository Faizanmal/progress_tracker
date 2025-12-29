'use client';

import { useEffect } from 'react';

export function ClientBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Remove any extension-added attributes that might cause hydration issues
    const body = document.body;
    const extensionAttrs = ['monica-id', 'monica-version'];
    extensionAttrs.forEach(attr => {
      if (body.hasAttribute(attr)) {
        body.removeAttribute(attr);
      }
    });
  }, []);

  return <>{children}</>;
}