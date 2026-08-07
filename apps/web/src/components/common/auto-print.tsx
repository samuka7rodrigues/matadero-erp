'use client';

import { useEffect } from 'react';

export function AutoPrint() {
  useEffect(() => {
    let printed = false;
    let timer: ReturnType<typeof setTimeout>;

    function printWhenReady() {
      if (printed) return;

      // Espera todas as imagens carregarem (senão ficam em branco no PDF).
      const images = Array.from(document.querySelectorAll('img'));
      const pending = images.filter((img) => !img.complete);

      if (pending.length === 0) {
        printed = true;
        window.print();
        return;
      }

      // Se ainda houver imagens a carregar, tenta de novo até carregarem.
      Promise.all(
        pending.map(
          (img) =>
            new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
              const t = setTimeout(() => resolve(true), 15000);
              img.addEventListener('load', () => clearTimeout(t), { once: true });
              img.addEventListener('error', () => clearTimeout(t), { once: true });
            })
        )
      ).then(() => {
        if (printed) return;
        printed = true;
        // Pequeno atraso para o browser pintar as imagens antes do print.
        setTimeout(() => window.print(), 150);
      });
    }

    // Fallback: se o documento já estiver completo, imprime; senão espera o load.
    if (document.readyState === 'complete') {
      timer = setTimeout(printWhenReady, 400);
    } else {
      window.addEventListener('load', () => {
        timer = setTimeout(printWhenReady, 400);
      });
    }

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
}
