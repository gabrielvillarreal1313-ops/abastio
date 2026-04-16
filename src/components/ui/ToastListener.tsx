'use client';

/**
 * ToastListener — Componente invisible que dispara toasts desde query params.
 * Se coloca en páginas Server Component que reciben redirects con ?toast=CODIGO.
 */

import { Suspense } from 'react';
import { useToastFromUrl } from '@/hooks/useToastFromUrl';

function ToastListenerInner() {
  useToastFromUrl();
  return null;
}

export function ToastListener() {
  return (
    <Suspense fallback={null}>
      <ToastListenerInner />
    </Suspense>
  );
}
