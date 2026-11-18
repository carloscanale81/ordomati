import React, { forwardRef, useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface AppFooterProps {
  className?: string;
  variant?: 'standard' | 'sidebar';
}

/**
 * Hook to detect whether the right container's footer is currently visible within its scrollable root.
 */
export function useIsFooterVisible(
  rootRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>
): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let currentRoot: HTMLElement | null = null;
    let currentFooter: HTMLElement | null = null;

    const checkVisibility = () => {
      const root = rootRef.current;
      const footer = footerRef.current;

      if (!root || !footer) {
        setIsVisible(false);
        return;
      }

      // If elements changed (e.g. view switch or re-mount), rebind scroll listener and observer
      if (root !== currentRoot || footer !== currentFooter) {
        if (observer) observer.disconnect();
        if (currentRoot) currentRoot.removeEventListener('scroll', checkVisibility);

        currentRoot = root;
        currentFooter = footer;

        currentRoot.addEventListener('scroll', checkVisibility, { passive: true });

        if (typeof IntersectionObserver !== 'undefined') {
          observer = new IntersectionObserver(
            entries => {
              for (const entry of entries) {
                if (entry.isIntersecting) {
                  setIsVisible(true);
                }
              }
            },
            {
              root: currentRoot,
              threshold: [0, 0.01, 0.1]
            }
          );
          observer.observe(currentFooter);
        }
      }

      const rootRect = root.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();

      // Check if footer rectangle overlaps with root's visible bounding rect
      const inView =
        footerRect.top < rootRect.bottom &&
        footerRect.bottom > rootRect.top &&
        footerRect.left < rootRect.right &&
        footerRect.right > rootRect.left;

      setIsVisible(inView);
    };

    // Run check immediately
    checkVisibility();

    // Capture-phase scroll listener catches scrolling inside any container (including overflow-y-auto root)
    window.addEventListener('scroll', checkVisibility, { passive: true, capture: true });
    window.addEventListener('resize', checkVisibility, { passive: true });
    const interval = setInterval(checkVisibility, 200);

    return () => {
      if (observer) observer.disconnect();
      if (currentRoot) currentRoot.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('scroll', checkVisibility, { capture: true });
      window.removeEventListener('resize', checkVisibility);
      clearInterval(interval);
    };
  }, [rootRef, footerRef]);

  return isVisible;
}

export const AppFooter = forwardRef<HTMLElement, AppFooterProps>(
  ({ className = '', variant = 'standard' }, ref) => {
    const { language } = useI18n();
    const isEs = language === 'es';
    const currentYear = new Date().getFullYear();

    // 1. Sidebar Variant: Rendered at the bottom of the left menu
    // Displays GitHub, TESEO, and BULERIA buttons first, then copyright, domain, and license.
    if (variant === 'sidebar') {
      return (
        <div className={`space-y-3.5 select-none text-xs text-gray-500 dark:text-gray-400 ${className}`}>
          {/* Action Links: GitHub, TESEO & BULERIA */}
          <div className="space-y-1.5">
            <a
              href="https://github.com/carloscanale81/ordomati"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-2xs"
              title={isEs ? 'Ver código fuente en GitHub' : 'View source code on GitHub'}
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="truncate">GitHub / ordomati</span>
            </a>

            <div className="grid grid-cols-2 gap-1.5">
              <a
                href="https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-[11px] shadow-2xs"
                title={isEs ? 'Ficha de la Tesis en el Sistema TESEO' : 'Doctoral Thesis in TESEO System'}
              >
                <img src="/favicons/teseo.png" alt="TESEO" className="w-3.5 h-3.5 shrink-0 object-contain rounded-xs" />
                <span className="truncate">TESEO</span>
              </a>

              <a
                href="https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-[11px] shadow-2xs"
                title={isEs ? 'Repositorio Institucional BULERIA (ULe)' : 'Institutional Repository BULERIA (ULe)'}
              >
                <img src="/favicons/buleria.png" alt="BULERIA" className="w-3.5 h-3.5 shrink-0 object-contain rounded-xs" />
                <span className="truncate">BULERIA (ULe)</span>
              </a>
            </div>
          </div>

          {/* Author domain & Copyright notice */}
          <div className="space-y-1.5 text-center">
            <div className="flex flex-col items-center gap-0.5 text-gray-800 dark:text-gray-200 font-bold text-[11px]">
              <span>&copy; {currentYear} Carlos Caño Alegre</span>
              <a
                href="https://www.carloscanoalegre.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-semibold"
              >
                <Globe className="w-3 h-3" />
                <span>www.carloscanoalegre.com</span>
              </a>
            </div>

            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {isEs
                ? 'Licencia CC BY-NC 4.0 Internacional. Reproducción permitida citando autoría original de Carlos Caño Alegre. Prohibido uso comercial sin autorización.'
                : 'CC BY-NC 4.0 License. Attribution to Carlos Caño Alegre required. Commercial use strictly prohibited without written authorization.'}
            </p>
          </div>
        </div>
      );
    }

    // 2. Standard Variant: Rendered at the bottom of the main right container
    return (
      <footer
        ref={ref}
        className={`mt-12 pt-6 pb-10 border-t border-gray-200/80 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 select-none ${className}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Author Domain, Thesis References & Intellectual Property Notice */}
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-gray-800 dark:text-gray-200 font-bold text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span>&copy; {currentYear} Carlos Caño Alegre</span>
              </span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <a
                href="https://www.carloscanoalegre.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-semibold"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>www.carloscanoalegre.com</span>
              </a>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              {isEs
                ? 'Licencia Creative Commons Atribución-NoComercial 4.0 Internacional (CC BY-NC 4.0). Se permite la reproducción, distribución y comunicación pública citando la autoría original de Carlos Caño Alegre. Queda expresamente prohibido su uso con fines comerciales o lucrativos sin autorización previa por escrito.'
                : 'Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) License. Reproduction and distribution permitted with attribution to Carlos Caño Alegre. Commercial or lucrative use strictly prohibited without prior written authorization.'}
            </p>
          </div>

          {/* GitHub Project Link & Thesis References (TESEO & BULERIA - Universidad de León)*/}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center md:justify-end">
            <a
              href="https://github.com/carloscanale81/ordomati"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-2xs"
              title={isEs ? 'Ver código fuente en GitHub' : 'View source code on GitHub'}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub / ordomati</span>
            </a>
            <a
              href="https://aplicaciones.ciencia.gob.es/teseo/#/tesis/O397308/detalle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-2xs"
              title={isEs ? 'Ficha de la Tesis en el Sistema TESEO (Ministerio de Ciencia e Innovación)' : 'Doctoral Thesis in TESEO System'}
            >
              <img src="/favicons/teseo.png" alt="TESEO" className="w-3.5 h-3.5 shrink-0 object-contain rounded-xs" />
              <span>TESEO</span>
            </a>
            <a
              href="https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-2xs"
              title={isEs ? 'Repositorio Institucional BULERIA (Biblioteca de la Universidad de León)' : 'Institutional Repository BULERIA (University of León Library)'}
            >
              <img src="/favicons/buleria.png" alt="BULERIA" className="w-3.5 h-3.5 shrink-0 object-contain rounded-xs" />
              <span>BULERIA (ULe)</span>
            </a>
          </div>
        </div>
      </footer>
    );
  }
);

AppFooter.displayName = 'AppFooter';
