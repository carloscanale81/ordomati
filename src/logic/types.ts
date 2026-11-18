/**
 * Data types for the Ordomatics calculation engine.
 * This layer is completely pure and agnostic of the UI and runtime environment (Browser / Node / MCP).
 */

export type ElementName = string;

export type CharacteristicType = 'quantitative' | 'qualitative' | 'adjustment';
export type Granularity = 3 | 5 | 7 | number;
export type Semantics = 'core' | 'support';

export type PropagationType =
  | 'inhibited'
  | 'triangular'
  | 'rectangular'
  | 'trapezoidal'
  | 'sinusoidal'
  | 'maxRatio'
  | 'custom';

export interface PropagationConfig {
  type: PropagationType;
  limit?: number;
  l1?: number;
  customExpr?: string; // Mathematical expression f(d, L, L1, L2), e.g. 'exp(-d / L)'
}

export type BlockingType = 'standard' | 'threshold' | 'custom' | 'none';

export interface BlockingConfig {
  type: BlockingType;
  threshold?: number; // Threshold for threshold-based blocking (e.g. theta = 0.15)
  customExpr?: string; // Mathematical expression f(a, S, vb, theta, i, j)
  vb?: number; // Uniform blocking factor vb in [0, 1] when scalar
}

export type SynergyType = 'none' | 'factor' | 'custom';

export interface SynergyConfig {
  type: SynergyType;
  k: number;
  customExpr?: string; // Mathematical expression f(a, k), e.g. 'min(1, a * k)'
}

export type NormType = 'none' | 'maximum' | 'target' | 'max' | 'sum' | 'custom';

export type EqualizationType = 'max' | 'maximum' | 'sum' | 'target' | 'none' | 'custom';

export interface EqualizationConfig {
  type: EqualizationType;
  obj?: number; // Target reference value if normType is 'target'
  customExpr?: string; // Custom mathematical expression
}

export interface EqualizationOptions extends EqualizationConfig {
  precision?: number;
}

export type RelativeAdjustmentType = 'byPop' | 'byMinutes' | 'byTouches' | 'byMean' | 'none' | 'custom';

export interface RelativeAdjustmentConfig {
  type?: RelativeAdjustmentType;
  byPop?: number;
  customExpr?: string;
}

export interface AdjustmentConfig {
  targetValue?: 'vp' | 'vc'; // Base target value used for adjustment and aggregation ('vp': Own Value, 'vc': Contextual Value)
  byPop: number; // Index of the population characteristic used for relative adjustment, or -1 for none
  normType: NormType;
  obj: number; // Target reference value if normType is 'target'
  customExpr?: string;
}

export type ScaleMode = 'manual' | 'dynamic';
export type ScaleSource = 'auto' | 'vp' | 'vc' | 'raw';

export type AffinityEntryStage = 'd' | 'a' | 'aa' | 'ac';

export interface CharacteristicLocks {
  vp?: boolean; // Lock on Own Value (Valor Propio)
  vc?: boolean; // Lock on Contextual Value (Valor Contextual)
  d?: boolean; // Lock on Distance Matrix (Detail)
  fp?: boolean; // Lock on Propagation Function (Detail)
  a?: boolean; // Lock on Affinity Matrix (Detail)
  vb?: boolean; // Lock on Blocking Function / Base Vector (Detail)
  aa?: boolean; // Lock on Autoinduced Matrix (Detail)
  fs?: boolean; // Lock on Synergy Function (Detail)
  ac_detail?: boolean; // Lock on Contextual Affinity Matrix (Detail)
}

export interface Characteristic {
  id: number | string;
  name: string;
  image?: string; // Optional image URL or base64 data URL
  type: CharacteristicType;
  min: number;
  max: number;
  scaleMode?: ScaleMode; // Scale bounds mode fallback
  minMode?: ScaleMode; // Independent minimum mode: 'manual' | 'dynamic'
  maxMode?: ScaleMode; // Independent maximum mode: 'manual' | 'dynamic'
  scaleSource?: ScaleSource; // Optional source filter for dynamic scale: 'auto' | 'vp' | 'vc' | 'raw'
  g: Granularity;
  sem?: Semantics;
  rawInputs: string[];
  d: (number | null)[][]; // Distance matrix D (n x n), off-diagonal entries can be null (no data)
  vb: number[]; // Blocking vector V^B (n)
  block?: BlockingConfig; // Blocking function configuration F_B
  prop: PropagationConfig; // Propagation function configuration F_P
  syn: SynergyConfig; // Synergy function configuration F_S
  adj: AdjustmentConfig; // Relative adjustment and scale equalization parameters
  calcTarget?: 'vp' | 'ac' | 'vc'; // Desired calculation scope based on data availability
  affinityEntryStage?: AffinityEntryStage; // Stage where affinity calculation begins / direct input matrix
  customA?: number[][]; // Optional direct input affinity matrix (n x n)
  customAA?: number[][]; // Optional direct input autoinduced matrix (n x n)
  customAC?: number[][]; // Optional direct input contextual affinity matrix (n x n)
  sampleVP?: number[][]; // Sample matrix of linearly independent Own Value vectors (n x n)
  sampleVC?: number[][]; // Sample matrix of corresponding Contextual Value vectors (n x n)
  locks?: CharacteristicLocks; // Card lock state flags
}

export interface OrdomaticaDataset {
  description?: string; // Optional description of the problem, criteria, and decision context
  elements: string[];
  elementImages?: string[]; // Optional image URL or base64 data URL per element aligned with elements array
  characteristics: Characteristic[];
  cMatrix: number[][]; // Criteria correlation matrix C (m x m)
  owa: number[]; // Ordered Weighted Averaging weights (m)
  decimalPrecision?: number; // Precision for decimal values in UI and outputs (default 4)
}

export interface TokenEvaluationResult {
  raw: string;
  trace: string;
  traceKey?: string;
  traceParams?: Record<string, string | number>;
  valid: boolean;
  val?: number;
}

export interface InputEvaluationResult {
  val: number;
  tokens: TokenEvaluationResult[];
  summaryTrace: string;
}

export interface ProcessedCharacteristic {
  id: number | string;
  name: string;
  parsedInputs: InputEvaluationResult[];
  vp: number[]; // Own values V^P
  A: number[][]; // Affinity matrix A
  AA: number[][]; // Autoinduced affinity matrix A^A
  AC: number[][]; // Contextual affinity matrix A^C
  VC: number[]; // Contextual value vector (V^C = V^P * A^C)
  ca: number[]; // Relative adjustment coefficients
  VCR: number[]; // Relative contextual values (V^CR)
  cn: number; // Equalization factor
  VCRN: number[]; // Normalized contextual values (V^CRN in [0, 1])
  isQuasiInverse?: boolean; // Flag indicating if Contextual Affinity A^C required Moore-Penrose pseudoinverse
  invAC?: number[][]; // Inverse or Quasi-inverse of A^C
  sampleVP?: number[][]; // Sample matrix of Own Values used for AC derivation (n x n)
  sampleVC?: number[][]; // Sample matrix of Contextual Values used for AC derivation (n x n)
  invSampleVP?: number[][]; // Inverse or Quasi-inverse of sampleVP (n x n)
  isSampleQuasiInverse?: boolean; // True if sampleVP required Moore-Penrose pseudoinverse
}

export interface AggregationResult {
  V: number[][]; // Normalized criteria evaluation matrix (n elements x m criteria)
  Cn: number[][]; // Column-normalized correlation matrix C'
  OWAp: number[][]; // Reordered OWA weights per alternative
  RWA: number[][]; // Redistributed weights (RWA = OWA' * Cn)
  A_final: number[]; // Final aggregated performance score per alternative
  ranking: number[]; // Alternative indices sorted descending by final score
}

export interface OrdomaticaCalculationResult {
  chars: ProcessedCharacteristic[];
  agg: AggregationResult;
}
