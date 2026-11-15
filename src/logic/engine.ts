import {
  OrdomaticaDataset,
  OrdomaticaCalculationResult,
  ProcessedCharacteristic
} from './types';
import { computeCharacteristicVP } from './fuzzy';
import {
  computeAffinityMatrix,
  computeAutoinducedAffinity,
  computeContextualAffinity,
  computeContextualValue,
  computeInverseContextualValue,
  computeCharacteristicAdjustment,
  createDefaultSampleMatrices,
  computeACFromSampling
} from './affinity';
import { aggregateResults } from './aggregation';

/**
 * Ordomatics Core Engine Orchestrator.
 * 
 * Executes the complete algorithmic pipeline of Ordomatics:
 * 1. Heterogeneous Data Parsing & Own Value Calculation (V^P)
 * 2. Affinity Matrix Construction & Propagation (A = F_P(D))
 * 3. Conservation & Autoinduction (A^A from A and V^B)
 * 4. Synergy Modulation (A^C = F_S(A^A))
 * 5. Contextual Value Propagation (V^C = V^P * A^C)
 * 6. Relative Population Adjustment & Scale Equalization (V^CR, cn, V^CRN)
 * 7. Multi-Criteria Aggregation & Ranking (V, C', OWA', RWA, A_final, ranking)
 * 
 * Pure, deterministic function without UI or browser dependencies.
 * Ready for direct consumption by MCP tools, backend APIs, and Web UI.
 */
export const calculateOrdomatica = (dataset: OrdomaticaDataset): OrdomaticaCalculationResult => {
  const { elements, characteristics, cMatrix, owa } = dataset;
  const n = elements.length;
  const m = characteristics.length;

  // Handle empty dataset without calculation errors
  if (n === 0 || m === 0) {
    return {
      chars: [],
      agg: {
        V: [],
        Cn: [],
        OWAp: [],
        RWA: [],
        A_final: [],
        ranking: []
      }
    };
  }

  // Step 1: Process each characteristic individually
  const intermediateChars = characteristics.map(char => {
    // 1.1: Evaluate heterogeneous inputs and compute base input vector
    const { parsedInputs, vp: inputValues } = computeCharacteristicVP(char, n);

    if (char.type === 'adjustment') {
      const zeroMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
      return {
        char,
        parsedInputs,
        vp: inputValues,
        A: zeroMatrix,
        AA: zeroMatrix,
        AC: zeroMatrix,
        VC: inputValues,
        isQuasiInverse: false
      };
    }

    // 1.2: Compute distance propagation affinity matrix A (or use direct input if entry stage is downstream)
    const entryStage = char.affinityEntryStage || 'd';

    let A: number[][];
    if (entryStage !== 'd' && char.customA && char.customA.length === n) {
      A = char.customA;
    } else {
      A = computeAffinityMatrix(char.d || [], char.prop);
    }

    // 1.3: Compute autoinduced conservation matrix A^A (or use direct input if entry stage is downstream)
    let AA: number[][];
    if (['aa', 'ac'].includes(entryStage) && char.customAA && char.customAA.length === n) {
      AA = char.customAA;
    } else {
      AA = computeAutoinducedAffinity(A, char.vb || [], char.block);
    }

    // 1.4: Apply synergy modulation F_S to obtain contextual affinity A^C (or use direct input)
    let AC: number[][];
    if (entryStage === 'ac' && char.customAC && char.customAC.length === n) {
      AC = char.customAC;
    } else {
      AC = computeContextualAffinity(AA, char.syn);
    }

    // 1.5: Compute contextual value, own value, or contextual affinity depending on calculation target
    let vp: number[];
    let VC: number[];
    let isQuasiInverse = false;
    let invAC: number[][] | undefined = undefined;
    let sampleVP: number[][] | undefined = undefined;
    let sampleVC: number[][] | undefined = undefined;
    let invSampleVP: number[][] | undefined = undefined;
    let isSampleQuasiInverse = false;

    if (char.calcTarget === 'ac') {
      // User targets Contextual Affinity Matrix A^C: derived from linearly independent sample vectors M_VP and M_VC
      vp = inputValues;
      const defaultSamples = createDefaultSampleMatrices(n, vp, AC);
      const currentSampleVP = (char.sampleVP && char.sampleVP.length === n)
        ? char.sampleVP
        : defaultSamples.sampleVP;
      const currentSampleVC = (char.sampleVC && char.sampleVC.length === n)
        ? char.sampleVC
        : defaultSamples.sampleVC;

      const samplingRes = computeACFromSampling(currentSampleVP, currentSampleVC);
      AC = samplingRes.AC;
      sampleVP = currentSampleVP;
      sampleVC = currentSampleVC;
      invSampleVP = samplingRes.invSampleVP;
      isSampleQuasiInverse = samplingRes.isQuasiInverse;

      // Compute contextual values using derived AC
      VC = computeContextualValue(vp, AC);
    } else if (char.calcTarget === 'vp') {
      // User provides Contextual Values V^C directly; Own Values V^P are calculated via inverse affinity
      VC = inputValues;
      const invRes = computeInverseContextualValue(VC, AC);
      vp = invRes.vp;
      isQuasiInverse = invRes.isQuasiInverse;
      invAC = invRes.invAC;
    } else {
      // Standard: User provides Own Values V^P; Contextual Values V^C are calculated via forward affinity
      vp = inputValues;
      VC = computeContextualValue(vp, AC);
    }

    return {
      char,
      parsedInputs,
      vp,
      A,
      AA,
      AC,
      VC,
      isQuasiInverse,
      invAC,
      sampleVP,
      sampleVC,
      invSampleVP,
      isSampleQuasiInverse
    };
  });

  // Step 2: Apply relative adjustments and scale equalization across characteristics
  // Determine which target value vector (Own Value V^P or Contextual Value V^C) feeds the adjustment & aggregation
  const baseVectors = intermediateChars.map(item => {
    const targetVal = item.char.adj?.targetValue || (item.char.calcTarget === 'vp' ? 'vp' : 'vc');
    return targetVal === 'vp' ? item.vp : item.VC;
  });

  const charsProcessed: ProcessedCharacteristic[] = intermediateChars.map((item, idx) => {
    if (item.char.type === 'adjustment') {
      return {
        id: item.char.id,
        name: item.char.name,
        parsedInputs: item.parsedInputs,
        vp: item.vp,
        A: item.A,
        AA: item.AA,
        AC: item.AC,
        VC: item.VC,
        ca: Array(n).fill(1),
        VCR: item.vp,
        cn: 1,
        VCRN: item.vp,
        isQuasiInverse: false
      };
    }

    const baseVector = baseVectors[idx];
    const adj = computeCharacteristicAdjustment(item.char, baseVector, baseVectors);

    return {
      id: item.char.id,
      name: item.char.name,
      parsedInputs: item.parsedInputs,
      vp: item.vp,
      A: item.A,
      AA: item.AA,
      AC: item.AC,
      VC: item.VC,
      ca: adj.ca,
      VCR: adj.VCR,
      cn: adj.cn,
      VCRN: adj.VCRN,
      isQuasiInverse: item.isQuasiInverse,
      invAC: item.invAC,
      sampleVP: item.sampleVP,
      sampleVC: item.sampleVC,
      invSampleVP: item.invSampleVP,
      isSampleQuasiInverse: item.isSampleQuasiInverse
    };
  });

  // Step 3: Multi-criteria aggregation and final alternative ranking
  // Adjustment dimensions are strictly ignored in Phase 3 aggregation
  const aggregableIndices = characteristics
    .map((c, i) => (c.type !== 'adjustment' ? i : -1))
    .filter(i => i !== -1);

  let agg;
  if (aggregableIndices.length === 0) {
    agg = {
      V: [],
      Cn: [],
      OWAp: [],
      RWA: [],
      A_final: [],
      ranking: []
    };
  } else {
    const subVCRN = aggregableIndices.map(i => charsProcessed[i].VCRN);
    const subCMatrix = aggregableIndices.map(i =>
      aggregableIndices.map(j => cMatrix[i]?.[j] ?? (i === j ? 1 : 0))
    );
    const subOwa = aggregableIndices.map(i => owa[i] ?? 1);
    agg = aggregateResults(n, aggregableIndices.length, subVCRN, subCMatrix, subOwa);
  }

  return {
    chars: charsProcessed,
    agg
  };
};
