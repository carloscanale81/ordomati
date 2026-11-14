import React, { useState, useRef } from 'react';
import { Upload, Link, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { OrbBadge } from './OrbBadge';
import { useI18n } from '../i18n/I18nContext';

export interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  name: string;
  currentImage?: string;
  isDimension?: boolean;
  onSave: (newImage: string | undefined) => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  title,
  name,
  currentImage,
  isDimension = false,
  onSave
}) => {
  const { t } = useI18n();
  const [selectedImage, setSelectedImage] = useState<string | undefined>(currentImage);
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentImage);
      setUrlInput(currentImage && !currentImage.startsWith('data:') ? currentImage : '');
    }
  }, [isOpen, currentImage]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('imagePicker.invalidFileAlert'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setSelectedImage(urlInput.trim());
    }
  };

  const handleRemove = () => {
    setSelectedImage(undefined);
    setUrlInput('');
  };

  const handleSave = () => {
    onSave(selectedImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('imagePicker.customize', { name })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sphere Preview Area */}
        <div className="flex flex-col items-center justify-center py-4 px-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            {t('imagePicker.spherePreview')}
          </span>
          <div className="relative group">
            <OrbBadge
              name={name}
              image={selectedImage}
              size="xl"
              isDimension={isDimension}
              className="ring-4 ring-white dark:ring-gray-800 shadow-xl"
            />
            {selectedImage && (
              <button
                type="button"
                onClick={handleRemove}
                title={t('imagePicker.remove')}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2">
            {name}
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('imagePicker.uploadTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>{t('imagePicker.urlTab')}</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 border-2 border-dashed border-blue-300 dark:border-blue-700/80 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{t('imagePicker.uploadPrompt')}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {t('imagePicker.uploadFormats')}
              </span>
            </button>
          </div>
        )}

        {/* Tab 2: URL Input */}
        {activeTab === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={t('imagePicker.urlPlaceholder')}
                className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                {t('imagePicker.load')}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t('imagePicker.urlHelp')}
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          {selectedImage ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('imagePicker.remove')}</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            >
              {t('imagePicker.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t('imagePicker.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
