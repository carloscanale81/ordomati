import React from 'react';
import { Shield, Github, Globe } from 'lucide-react';
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
        {/* Author Domain & Intellectual Property Notice */}
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-gray-800 dark:text-gray-200 font-bold text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>&copy; {currentYear} Carlos Cano Alegre</span>
            </span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <a
              href="https://carloscanoalegre.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-semibold"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>carloscanoalegre.com</span>
            </a>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            {isEs
              ? 'Todos los derechos reservados. Queda expresamente prohibida la reproducción total o parcial de esta obra, software o marco metodológico, así como su distribución, transformación o comunicación pública sin la previa autorización expresa y por escrito del autor.'
              : 'All rights reserved. Total or partial reproduction of this work, software, or methodological framework, as well as its distribution, transformation, or public communication without prior written permission of the author is strictly prohibited.'}
          </p>
        </div>

        {/* GitHub Project Link */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://github.com/ordomatics/ordomati"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700 font-semibold text-xs shadow-2xs"
            title={isEs ? 'Ver código fuente en GitHub' : 'View source code on GitHub'}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub / ordomati</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
