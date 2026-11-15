import React from 'react';
import { Shield, Globe } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface AppFooterProps {
  className?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({ className = '' }) => {
  const { language } = useI18n();
  const isEs = language === 'es';
  const currentYear = new Date().getFullYear();

  return (
    <footer
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
};
