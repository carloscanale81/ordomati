import React, { useState } from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
import { Card } from '../components/Card';
import { OrbBadge } from '../components/OrbBadge';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { OrdomaticaDataset, Characteristic } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';

export interface ConfigPhaseProps {
  dataset: OrdomaticaDataset;
  onUpdateDataset: (updater: (prev: OrdomaticaDataset) => OrdomaticaDataset) => void;
}

export const ConfigPhase: React.FC<ConfigPhaseProps> = ({ dataset, onUpdateDataset }) => {
  const { t } = useI18n();
  const { elements, characteristics, elementImages = [] } = dataset;

  const [activePicker, setActivePicker] = useState<{
    type: 'element' | 'char';
    idx: number;
    name: string;
    currentImage?: string;
  } | null>(null);

  // --- Element Handlers ---
  const handleAddElement = () => {
    onUpdateDataset(prev => {
      const n = prev.elements.length;
      const newName = String.fromCharCode(65 + n); // A, B, C...
      const nextElements = [...prev.elements, newName];
      const nextImages = [...(prev.elementImages || Array(n).fill('')), ''];

      const nextChars: Characteristic[] = prev.characteristics.map(char => ({
        ...char,
        rawInputs: [...(char.rawInputs || []), ''],
        vb: [...char.vb, 0],
        d: [...char.d.map(r => [...r, null]), Array(n + 1).fill(null).map((_, idx) => idx === n ? 0 : null)]
      }));

      return {
        ...prev,
        elements: nextElements,
        elementImages: nextImages,
        characteristics: nextChars
      };
    });
  };

  const handleEditElement = (idx: number, newName: string) => {
    onUpdateDataset(prev => {
      const nextElements = [...prev.elements];
      nextElements[idx] = newName;
      return { ...prev, elements: nextElements };
    });
  };

  const handleEditElementImage = (idx: number, newImg: string | undefined) => {
    onUpdateDataset(prev => {
      const nextImages = [...(prev.elementImages || Array(prev.elements.length).fill(''))];
      nextImages[idx] = newImg || '';
      return { ...prev, elementImages: nextImages };
    });
  };

  const handleRemoveElement = (idx: number) => {
    if (elements.length <= 1) return;
    onUpdateDataset(prev => {
      const nextElements = prev.elements.filter((_, i) => i !== idx);
      const nextImages = (prev.elementImages || []).filter((_, i) => i !== idx);
      const nextChars: Characteristic[] = prev.characteristics.map(char => ({
        ...char,
        rawInputs: (char.rawInputs || []).filter((_, i) => i !== idx),
        vb: char.vb.filter((_, i) => i !== idx),
        d: char.d.filter((_, i) => i !== idx).map(r => r.filter((_, j) => j !== idx))
      }));

      return {
        ...prev,
        elements: nextElements,
        elementImages: nextImages,
        characteristics: nextChars
      };
    });
  };

  // --- Dimension Handlers ---
  const handleAddChar = () => {
    onUpdateDataset(prev => {
      const n = prev.elements.length;
      const newName = `D${prev.characteristics.length + 1}`;
      const newChar: Characteristic = {
        id: Date.now(),
        name: newName,
        type: 'quantitative',
        min: 0,
        max: 100,
        g: 5,
        rawInputs: Array(n).fill(''),
        d: Array(n).fill(null).map((_, ri) => Array(n).fill(null).map((_, ci) => ri === ci ? 0 : null)),
        vb: Array(n).fill(0),
        prop: { type: 'triangular', limit: 10, l1: 5 },
        syn: { type: 'none', k: 1 },
        adj: { byPop: -1, normType: 'maximum', obj: 1 }
      };

      const m = prev.characteristics.length;
      const nextCMatrix = prev.cMatrix
        .map(row => [...row, 0])
        .concat([Array(m + 1).fill(0).map((_, i) => (i === m ? 1 : 0))]);

      const nextOwa = [...prev.owa, prev.owa.length > 0 ? Math.max(0.1, prev.owa[prev.owa.length - 1] - 0.1) : 1];

      return {
        ...prev,
        characteristics: [...prev.characteristics, newChar],
        cMatrix: nextCMatrix,
        owa: nextOwa
      };
    });
  };

  const handleEditCharName = (idx: number, newName: string) => {
    onUpdateDataset(prev => {
      const nextChars = [...prev.characteristics];
      nextChars[idx] = { ...nextChars[idx], name: newName };
      return { ...prev, characteristics: nextChars };
    });
  };

  const handleEditCharImage = (idx: number, newImg: string | undefined) => {
    onUpdateDataset(prev => {
      const nextChars = [...prev.characteristics];
      nextChars[idx] = { ...nextChars[idx], image: newImg };
      return { ...prev, characteristics: nextChars };
    });
  };

  const handleRemoveChar = (idx: number) => {
    if (characteristics.length <= 1) return;
    onUpdateDataset(prev => {
      const nextChars = prev.characteristics.filter((_, i) => i !== idx);
      const nextCMatrix = prev.cMatrix.filter((_, i) => i !== idx).map(row => row.filter((_, j) => j !== idx));
      const nextOwa = prev.owa.filter((_, i) => i !== idx);

      return {
        ...prev,
        characteristics: nextChars,
        cMatrix: nextCMatrix,
        owa: nextOwa
      };
    });
  };

  return (
    <div className="animate-in fade-in duration-500 w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Elements Card */}
      <Card title={t('config.elements.title')} className="w-full">
        <div className="space-y-2.5">
          {/* Add Element Button - Alone on the first line spanning full card width */}
          <button
            type="button"
            onClick={handleAddElement}
            className="w-full py-1.5 px-3 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold transition-colors cursor-pointer shadow-2xs hover:border-blue-400 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('config.elements.addElement')}</span>
          </button>

          {/* Element Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {elements.map((el, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 pl-1 pr-1.5 py-1 rounded-xl focus-within:ring-2 focus-within:ring-blue-400/60 transition-all shadow-2xs hover:border-blue-300 dark:hover:border-blue-700"
              >
                {/* Ball Avatar with Click to Customize Image */}
                <button
                  type="button"
                  onClick={() =>
                    setActivePicker({
                      type: 'element',
                      idx: i,
                      name: el,
                      currentImage: elementImages[i]
                    })
                  }
                  title={t('config.elements.imageTitleTooltip')}
                  className="relative group/avatar shrink-0 cursor-pointer"
                >
                  <OrbBadge
                    name={el}
                    image={elementImages[i]}
                    size="xs"
                    color="blue"
                  />
                  <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </button>

                <input
                  value={el}
                  onChange={e => handleEditElement(i, e.target.value)}
                  style={{ width: `${Math.max(2, (el || '').length + 1)}ch` }}
                  className="font-semibold text-blue-950 dark:text-blue-100 bg-transparent border-none p-0 text-sm focus:outline-none min-w-[28px] max-w-[180px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveElement(i)}
                  disabled={elements.length <= 1}
                  title={t('config.elements.removeElement')}
                  aria-label={t('config.elements.removeElement')}
                  className="text-blue-400/70 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none transition-colors p-0.5 cursor-pointer rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Dimensions Card */}
      <Card title={t('config.characteristics.title')} className="w-full">
        <div className="space-y-2.5">
          {/* Add Dimension Button - Alone on the first line spanning full card width */}
          <button
            type="button"
            onClick={handleAddChar}
            className="w-full py-1.5 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs hover:border-gray-400 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('config.characteristics.addCharacteristic')}</span>
          </button>

          {/* Dimension Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {characteristics.map((char, i) => (
              <div
                key={char.id}
                className="inline-flex items-center gap-1.5 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 pl-1 pr-1.5 py-1 rounded-xl focus-within:ring-2 focus-within:ring-blue-400/60 transition-all shadow-2xs hover:border-gray-300 dark:hover:border-gray-600"
              >
                {/* Ball Avatar with Click to Customize Image */}
                <button
                  type="button"
                  onClick={() =>
                    setActivePicker({
                      type: 'char',
                      idx: i,
                      name: char.name,
                      currentImage: char.image
                    })
                  }
                  title={t('config.characteristics.imageTitleTooltip')}
                  className="relative group/avatar shrink-0 cursor-pointer"
                >
                  <OrbBadge
                    name={char.name}
                    image={char.image}
                    size="xs"
                    isDimension={true}
                  />
                  <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </button>

                <input
                  value={char.name}
                  onChange={e => handleEditCharName(i, e.target.value)}
                  style={{ width: `${Math.max(2, (char.name || '').length + 1)}ch` }}
                  className="font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-none p-0 text-sm focus:outline-none min-w-[28px] max-w-[180px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveChar(i)}
                  disabled={characteristics.length <= 1}
                  title={t('config.characteristics.removeCharacteristic')}
                  aria-label={t('config.characteristics.removeCharacteristic')}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none transition-colors p-0.5 cursor-pointer rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Global Calculation Parameters Card */}
      <Card title={t('config.options.title')} className="w-full md:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-100 block">
              {t('config.options.decimalPrecision')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('config.options.decimalPrecisionHelp')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="8"
              step="1"
              value={dataset.decimalPrecision ?? 4}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                const clamped = isNaN(val) ? 4 : Math.max(0, Math.min(8, val));
                onUpdateDataset(prev => ({ ...prev, decimalPrecision: clamped }));
              }}
              className="w-24 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Image Picker Modal */}
      {activePicker && (
        <ImagePickerModal
          isOpen={true}
          onClose={() => setActivePicker(null)}
          title={activePicker.type === 'element' ? t('config.elementImageTitle') : t('char.config.imageTitle')}
          name={activePicker.name}
          currentImage={activePicker.currentImage}
          isDimension={activePicker.type === 'char'}
          onSave={newImg => {
            if (activePicker.type === 'element') {
              handleEditElementImage(activePicker.idx, newImg);
            } else {
              handleEditCharImage(activePicker.idx, newImg);
            }
          }}
        />
      )}
    </div>
  );
};
