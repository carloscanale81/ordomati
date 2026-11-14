import {
  OrdomaticaDataset,
  Characteristic,
  CharacteristicType,
  PropagationType,
  SynergyType,
  NormType,
  Semantics
} from '../logic/types';
import { OrdomaticaCaseFile } from './types';

/**
 * Resizes an array, padding with a default value or truncating to target size.
 */
export const resizeArray = <T>(arr: T[] | undefined, size: number, defVal: T): T[] => {
  const res = [...(arr || [])];
  while (res.length < size) res.push(defVal);
  return res.slice(0, size);
};

/**
 * Resizes a square or rectangular matrix to size x size.
 */
export const resizeMatrix = <T>(mat: T[][] | undefined, size: number, defVal: T): T[][] => {
  const res = resizeArray(mat, size, [] as T[]);
  return res.map(row => resizeArray(row, size, defVal));
};

/**
 * Normalizes legacy or localized characteristic types to standard domain values.
 */
const normalizeType = (type: string | undefined): CharacteristicType => {
  if (type === 'cualitativa' || type === 'qualitative') return 'qualitative';
  return 'quantitative';
};

const normalizeSemantics = (sem: string | undefined): Semantics => {
  if (sem === 'soporte' || sem === 'support') return 'support';
  return 'core';
};

const normalizePropagationType = (propType: string | undefined): PropagationType => {
  if (propType === 'inhibida' || propType === 'inhibited') return 'inhibited';
  if (propType === 'rectangular') return 'rectangular';
  if (propType === 'trapezoidal') return 'trapezoidal';
  if (propType === 'sinusoidal') return 'sinusoidal';
  if (propType === 'custom' || propType === 'personalizada') return 'custom';
  return 'triangular';
};

const normalizeSynergyType = (synType: string | undefined): SynergyType => {
  if (synType === 'factor') return 'factor';
  if (synType === 'custom' || synType === 'personalizada') return 'custom';
  return 'none';
};

const normalizeNormType = (normType: string | undefined): NormType => {
  if (normType === 'objetivo' || normType === 'target') return 'target';
  return 'maximum';
};

/**
 * Serializes a complete Ordomatics case to a JSON string.
 * All data, parameters, vectors, and matrices are preserved regardless of whether fields are empty or not,
 * allowing the user to resume their exact analysis session at any time.
 */
export const serializeFullCase = (dataset: OrdomaticaDataset): string => {
  const caseFile: OrdomaticaCaseFile = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    dataset: {
      elements: [...dataset.elements],
      elementImages: dataset.elementImages ? [...dataset.elementImages] : undefined,
      decimalPrecision: dataset.decimalPrecision ?? 4,
      characteristics: dataset.characteristics.map(c => ({
        id: c.id,
        name: c.name ?? '',
        image: c.image,
        type: c.type ?? 'quantitative',
        min: c.min ?? 0,
        max: c.max ?? 100,
        scaleMode: c.scaleMode,
        minMode: c.minMode,
        maxMode: c.maxMode,
        scaleSource: c.scaleSource,
        g: c.g ?? 5,
        sem: c.sem ?? 'core',
        rawInputs: [...(c.rawInputs || [])],
        d: (c.d || []).map(row => [...row]),
        vb: [...(c.vb || [])],
        prop: {
          type: c.prop?.type ?? 'triangular',
          limit: c.prop?.limit ?? 10,
          l1: c.prop?.l1 ?? 0,
          ...(c.prop?.customExpr ? { customExpr: c.prop.customExpr } : {})
        },
        syn: {
          type: c.syn?.type ?? 'none',
          k: c.syn?.k ?? 1,
          ...(c.syn?.customExpr ? { customExpr: c.syn.customExpr } : {})
        },
        adj: {
          targetValue: c.adj?.targetValue ?? 'vc',
          byPop: c.adj?.byPop ?? -1,
          normType: c.adj?.normType ?? 'maximum',
          obj: c.adj?.obj ?? 1
        },
        calcTarget: c.calcTarget ?? 'vc',
        ...(c.affinityEntryStage ? { affinityEntryStage: c.affinityEntryStage } : {}),
        ...(c.customA ? { customA: c.customA.map(row => [...row]) } : {}),
        ...(c.customAA ? { customAA: c.customAA.map(row => [...row]) } : {}),
        ...(c.customAC ? { customAC: c.customAC.map(row => [...row]) } : {}),
        ...(c.locks ? { locks: { ...c.locks } } : {})
      })),
      cMatrix: (dataset.cMatrix || []).map(row => [...row]),
      owa: [...(dataset.owa || [])]
    }
  };

  return JSON.stringify(caseFile, null, 2);
};

/**
 * Deserializes an exported case JSON, restoring the complete analysis session.
 * Automatically handles dimension alignment and validates matrix consistency.
 */
export const deserializeFullCase = (rawJsonData: any): OrdomaticaDataset => {
  const parsed = typeof rawJsonData === 'string' ? JSON.parse(rawJsonData) : rawJsonData;
  const data = parsed?.dataset || parsed;

  const elements: string[] = Array.isArray(data.elements) && data.elements.length > 0
    ? data.elements
    : ['A', 'B', 'C', 'D'];
  const n = elements.length;

  const elementImages: string[] = Array.isArray(data.elementImages)
    ? resizeArray(data.elementImages, n, '')
    : Array(n).fill('');

  const rawChars = Array.isArray(data.characteristics) && data.characteristics.length > 0
    ? data.characteristics
    : [];

  const characteristics: Characteristic[] = rawChars.map((c: any, i: number) => {
    return {
      id: c.id ?? Date.now() + i,
      name: c.name || `C${i + 1}`,
      image: typeof c.image === 'string' ? c.image : undefined,
      type: normalizeType(c.type),
      min: typeof c.min === 'number' ? c.min : 0,
      max: typeof c.max === 'number' ? c.max : 100,
      scaleMode: c.scaleMode === 'dynamic' ? 'dynamic' : 'manual',
      minMode: c.minMode === 'dynamic' ? 'dynamic' : c.minMode === 'manual' ? 'manual' : (c.scaleMode === 'dynamic' ? 'dynamic' : 'manual'),
      maxMode: c.maxMode === 'dynamic' ? 'dynamic' : c.maxMode === 'manual' ? 'manual' : (c.scaleMode === 'dynamic' ? 'dynamic' : 'manual'),
      scaleSource: (['auto', 'vp', 'vc', 'raw'].includes(c.scaleSource) ? c.scaleSource : undefined),
      g: typeof c.g === 'number' ? c.g : 5,
      sem: normalizeSemantics(c.sem),
      rawInputs: resizeArray(c.rawInputs, n, ''),
      d: Array.from({ length: n }, (_, ri) =>
        Array.from({ length: n }, (_, ci) => {
          if (ri === ci) return 0;
          const val = c.d?.[ri]?.[ci];
          return typeof val === 'number' && Number.isFinite(val) ? val : null;
        })
      ),
      vb: resizeArray(c.vb, n, 0),
      prop: {
        type: normalizePropagationType(c.prop?.type),
        limit: typeof c.prop?.limit === 'number' ? c.prop.limit : 10,
        l1: typeof c.prop?.l1 === 'number' ? c.prop.l1 : 5,
        ...(typeof c.prop?.customExpr === 'string' ? { customExpr: c.prop.customExpr } : {})
      },
      syn: {
        type: normalizeSynergyType(c.syn?.type),
        k: typeof c.syn?.k === 'number' ? c.syn.k : 1,
        ...(typeof c.syn?.customExpr === 'string' ? { customExpr: c.syn.customExpr } : {})
      },
      adj: {
        targetValue: (['vp', 'vc'].includes(c.adj?.targetValue) ? c.adj.targetValue : 'vc'),
        byPop: typeof c.adj?.byPop === 'number' ? c.adj.byPop : -1,
        normType: normalizeNormType(c.adj?.normType),
        obj: typeof c.adj?.obj === 'number' ? c.adj.obj : 1
      },
      calcTarget: (['vp', 'ac', 'vc'].includes((c as any).calcTarget) ? (c as any).calcTarget : 'vc'),
      ...(c.affinityEntryStage && ['d', 'a', 'aa', 'ac'].includes(c.affinityEntryStage) ? { affinityEntryStage: c.affinityEntryStage } : {}),
      ...(Array.isArray(c.customA) ? { customA: resizeMatrix(c.customA, n, 0) } : {}),
      ...(Array.isArray(c.customAA) ? { customAA: resizeMatrix(c.customAA, n, 0) } : {}),
      ...(Array.isArray(c.customAC) ? { customAC: resizeMatrix(c.customAC, n, 0) } : {}),
      ...(c.locks && typeof c.locks === 'object' ? { locks: { ...c.locks } } : {})
    };
  });

  const m = characteristics.length > 0 ? characteristics.length : 1;

  const cMatrix: number[][] = Array.isArray(data.cMatrix) && data.cMatrix.length > 0
    ? resizeMatrix(data.cMatrix, m, 0)
    : resizeMatrix([], m, 0);

  const owa: number[] = Array.isArray(data.owa) && data.owa.length > 0
    ? resizeArray(data.owa, m, 0.5)
    : resizeArray([], m, 0.5);

  return {
    elements,
    elementImages,
    characteristics,
    cMatrix,
    owa,
    decimalPrecision: typeof data.decimalPrecision === 'number' ? data.decimalPrecision : 4
  };
};

/**
 * Aliases for backwards compatibility.
 */
export const serializeDataset = (dataset: OrdomaticaDataset): string => serializeFullCase(dataset);
export const deserializeDataset = (rawJsonData: any): OrdomaticaDataset => deserializeFullCase(rawJsonData);
