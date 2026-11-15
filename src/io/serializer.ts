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
  if (type === 'ajuste' || type === 'adjustment') return 'adjustment';
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
  if (normType === 'none' || normType === 'ninguno' || normType === 'ninguna') return 'none';
  if (normType === 'objetivo' || normType === 'target') return 'target';
  return 'maximum';
};

/**
 * Serializes a complete Ordomatics case to a JSON string.
 * Uses descriptive, clear English property names (dimensions, distanceMatrix,
 * blockingVector, criteriaCorrelationMatrix, orderedWeightedAveragingWeights)
 * alongside backwards-compatible aliases so the exported file is crystal-clear
 * and self-documenting.
 */
export const serializeFullCase = (dataset: OrdomaticaDataset): string => {
  const dimensions = dataset.characteristics.map(c => {
    const dMatrix = (c.d || []).map(row => [...row]);
    const vBlocking = [...(c.vb || [])];
    const bConfig = {
      type: c.block?.type ?? 'standard',
      ...(c.block?.customExpr ? { customExpr: c.block.customExpr } : {})
    };
    const pConfig = {
      type: c.prop?.type ?? 'triangular',
      limit: c.prop?.limit ?? 10,
      l1: c.prop?.l1 ?? 0,
      ...(c.prop?.customExpr ? { customExpr: c.prop.customExpr } : {})
    };
    const sConfig = {
      type: c.syn?.type ?? 'none',
      k: c.syn?.k ?? 1,
      ...(c.syn?.customExpr ? { customExpr: c.syn.customExpr } : {})
    };
    const aConfig = {
      targetValue: c.adj?.targetValue ?? 'vc',
      relativeContrastDimensionIndex: c.adj?.byPop ?? -1,
      equalizationMode: c.adj?.normType ?? 'none',
      targetObjective: c.adj?.obj ?? 1
    };
    const adjAlias = {
      targetValue: aConfig.targetValue,
      byPop: aConfig.relativeContrastDimensionIndex,
      normType: aConfig.equalizationMode,
      obj: aConfig.targetObjective
    };

    return {
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
      granularity: c.g ?? 5,
      g: c.g ?? 5,
      semantics: c.sem ?? 'core',
      sem: c.sem ?? 'core',
      rawInputs: [...(c.rawInputs || [])],
      distanceMatrix: dMatrix,
      d: dMatrix,
      blockingVector: vBlocking,
      vb: vBlocking,
      blockingConfig: bConfig,
      block: bConfig,
      propagationConfig: pConfig,
      prop: pConfig,
      synergyConfig: sConfig,
      syn: sConfig,
      adjustmentConfig: aConfig,
      adj: adjAlias,
      calculationTarget: c.calcTarget ?? 'vc',
      calcTarget: c.calcTarget ?? 'vc',
      ...(c.affinityEntryStage ? { affinityEntryStage: c.affinityEntryStage } : {}),
      ...(c.customA ? { customDirectAffinityMatrix: c.customA.map(row => [...row]), customA: c.customA.map(row => [...row]) } : {}),
      ...(c.customAA ? { customAutoinducedAffinityMatrix: c.customAA.map(row => [...row]), customAA: c.customAA.map(row => [...row]) } : {}),
      ...(c.customAC ? { customContextualAffinityMatrix: c.customAC.map(row => [...row]), customAC: c.customAC.map(row => [...row]) } : {}),
      ...(c.locks ? { locks: { ...c.locks } } : {})
    };
  });

  const cMatrixCopy = (dataset.cMatrix || []).map(row => [...row]);
  const owaCopy = [...(dataset.owa || [])];

  const caseFile = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    dataset: {
      elements: [...dataset.elements],
      elementImages: dataset.elementImages ? [...dataset.elementImages] : undefined,
      decimalPrecision: dataset.decimalPrecision ?? 2,
      dimensions,
      characteristics: dimensions,
      criteriaCorrelationMatrix: cMatrixCopy,
      cMatrix: cMatrixCopy,
      orderedWeightedAveragingWeights: owaCopy,
      owa: owaCopy
    }
  };

  return JSON.stringify(caseFile, null, 2);
};

/**
 * Deserializes an exported case JSON, restoring the complete analysis session.
 * Fully supports both modern descriptive English keys (dimensions, distanceMatrix,
 * blockingVector, criteriaCorrelationMatrix, etc.) and legacy shorthand keys
 * (characteristics, d, vb, cMatrix, owa, etc.).
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

  const rawDimensions = Array.isArray(data.dimensions) && data.dimensions.length > 0
    ? data.dimensions
    : Array.isArray(data.characteristics) && data.characteristics.length > 0
    ? data.characteristics
    : [];

  const characteristics: Characteristic[] = rawDimensions.map((c: any, i: number) => {
    const rawD = c.distanceMatrix ?? c.d;
    const rawVb = c.blockingVector ?? c.vb;
    const rawBlock = c.blockingConfig ?? c.block;
    const rawProp = c.propagationConfig ?? c.prop;
    const rawSyn = c.synergyConfig ?? c.syn;
    const rawAdj = c.adjustmentConfig ?? c.adj;

    return {
      id: c.id ?? Date.now() + i,
      name: c.name || `D${i + 1}`,
      image: typeof c.image === 'string' ? c.image : undefined,
      type: normalizeType(c.type),
      min: typeof c.min === 'number' ? c.min : 0,
      max: typeof c.max === 'number' ? c.max : 100,
      scaleMode: c.scaleMode === 'dynamic' ? 'dynamic' : 'manual',
      minMode: c.minMode === 'dynamic' ? 'dynamic' : c.minMode === 'manual' ? 'manual' : (c.scaleMode === 'dynamic' ? 'dynamic' : 'manual'),
      maxMode: c.maxMode === 'dynamic' ? 'dynamic' : c.maxMode === 'manual' ? 'manual' : (c.scaleMode === 'dynamic' ? 'dynamic' : 'manual'),
      scaleSource: (['auto', 'vp', 'vc', 'raw'].includes(c.scaleSource) ? c.scaleSource : undefined),
      g: typeof c.granularity === 'number' ? c.granularity : typeof c.g === 'number' ? c.g : 5,
      sem: normalizeSemantics(c.semantics ?? c.sem),
      rawInputs: resizeArray(c.rawInputs, n, ''),
      d: Array.from({ length: n }, (_, ri) =>
        Array.from({ length: n }, (_, ci) => {
          if (ri === ci) return 0;
          const val = rawD?.[ri]?.[ci];
          return typeof val === 'number' && Number.isFinite(val) ? val : null;
        })
      ),
      vb: resizeArray(rawVb, n, 0),
      block: {
        type: rawBlock?.type === 'custom' ? 'custom' : 'standard',
        ...(typeof rawBlock?.customExpr === 'string' ? { customExpr: rawBlock.customExpr } : {})
      },
      prop: {
        type: normalizePropagationType(rawProp?.type),
        limit: typeof rawProp?.limit === 'number' ? rawProp.limit : 10,
        l1: typeof rawProp?.l1 === 'number' ? rawProp.l1 : 5,
        ...(typeof rawProp?.customExpr === 'string' ? { customExpr: rawProp.customExpr } : {})
      },
      syn: {
        type: normalizeSynergyType(rawSyn?.type),
        k: typeof rawSyn?.k === 'number' ? rawSyn.k : 1,
        ...(typeof rawSyn?.customExpr === 'string' ? { customExpr: rawSyn.customExpr } : {})
      },
      adj: {
        targetValue: (['vp', 'vc'].includes(rawAdj?.targetValue) ? rawAdj.targetValue : 'vc'),
        byPop: typeof rawAdj?.relativeContrastDimensionIndex === 'number'
          ? rawAdj.relativeContrastDimensionIndex
          : typeof rawAdj?.byPop === 'number'
          ? rawAdj.byPop
          : -1,
        normType: normalizeNormType(rawAdj?.equalizationMode ?? rawAdj?.normType),
        obj: typeof rawAdj?.targetObjective === 'number'
          ? rawAdj.targetObjective
          : typeof rawAdj?.obj === 'number'
          ? rawAdj.obj
          : 1
      },
      calcTarget: (['vp', 'ac', 'vc'].includes(c.calculationTarget ?? c.calcTarget) ? (c.calculationTarget ?? c.calcTarget) : 'vc'),
      ...(c.affinityEntryStage && ['d', 'a', 'aa', 'ac'].includes(c.affinityEntryStage) ? { affinityEntryStage: c.affinityEntryStage } : {}),
      ...(Array.isArray(c.customDirectAffinityMatrix ?? c.customA) ? { customA: resizeMatrix(c.customDirectAffinityMatrix ?? c.customA, n, 0) } : {}),
      ...(Array.isArray(c.customAutoinducedAffinityMatrix ?? c.customAA) ? { customAA: resizeMatrix(c.customAutoinducedAffinityMatrix ?? c.customAA, n, 0) } : {}),
      ...(Array.isArray(c.customContextualAffinityMatrix ?? c.customAC) ? { customAC: resizeMatrix(c.customContextualAffinityMatrix ?? c.customAC, n, 0) } : {}),
      ...(c.locks && typeof c.locks === 'object' ? { locks: { ...c.locks } } : {})
    };
  });

  const m = characteristics.length > 0 ? characteristics.length : 1;

  const rawCMatrix = data.criteriaCorrelationMatrix ?? data.cMatrix;
  const cMatrix: number[][] = Array.isArray(rawCMatrix) && rawCMatrix.length > 0
    ? resizeMatrix(rawCMatrix, m, 0)
    : resizeMatrix([], m, 0);

  const rawOwa = data.orderedWeightedAveragingWeights ?? data.owa;
  const owa: number[] = Array.isArray(rawOwa) && rawOwa.length > 0
    ? resizeArray(rawOwa, m, 0.5)
    : resizeArray([], m, 0.5);

  return {
    elements,
    elementImages,
    characteristics,
    cMatrix,
    owa,
    decimalPrecision: typeof data.decimalPrecision === 'number' ? data.decimalPrecision : 2
  };
};

/**
 * Aliases for backwards compatibility.
 */
export const serializeDataset = (dataset: OrdomaticaDataset): string => serializeFullCase(dataset);
export const deserializeDataset = (rawJsonData: any): OrdomaticaDataset => deserializeFullCase(rawJsonData);
