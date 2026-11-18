import React, { useState, useMemo } from 'react';
import {
  Code2,
  ExternalLink,
  BookOpen,
  Terminal,
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Play
} from 'lucide-react';
import { Card } from './Card';
import { AppFooter } from './AppFooter';
import { evaluateMathExpression } from '../../logic/mathExpression';
import { useI18n } from '../i18n/I18nContext';

export interface FunctionSyntaxPageProps {
  isSidebarOpen?: boolean;
}

export const FunctionSyntaxPage: React.FC<FunctionSyntaxPageProps> = ({ isSidebarOpen = true }) => {
  const { language } = useI18n();
  const isEs = language === 'es';

  // Interactive formula tester state
  const [testExpr, setTestExpr] = useState<string>('max(0, 1 - (d / L))');
  const [testVariables, setTestVariables] = useState<string>(
    'd = 4, L = 10, L1 = 3, a = 0.75, S = 2.5, vb = 0.3, k = 1.2, theta = 0.25, vc = 3.5, pop = 10, vcr = 0.35, max_vcr = 0.5, obj = 1, minutos = 45, minutos_totales = 90, toques = 30, media_toques = 25, media_vc = 2.5, vp = 3.5, max_vp = 7, sum_vp = 20'
  );

  // Parse variables and evaluate test expression
  const evalResult = useMemo(() => {
    const scope: Record<string, number> = {};
    testVariables.split(',').forEach(pair => {
      const [k, v] = pair.split('=').map(s => s.trim());
      if (k && v !== undefined) {
        const num = parseFloat(v);
        if (!isNaN(num)) scope[k] = num;
      }
    });

    try {
      const val = evaluateMathExpression(testExpr, scope, NaN);
      return {
        value: val,
        isValid: !isNaN(val) && Number.isFinite(val),
        scope
      };
    } catch {
      return { value: NaN, isValid: false, scope };
    }
  }, [testExpr, testVariables]);

  const formulasList = [
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Triangular' : 'Triangular Propagation',
      math: 'a_{ij} = \\max\\left(0, 1 - \\frac{d_{ij}}{L}\\right)',
      syntax: 'max(0, 1 - (d / L))',
      desc: isEs ? 'Decaimiento lineal continuo hasta anularse a partir de la distancia límite L.' : 'Linear decay down to zero starting from limit distance L.'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Rectangular' : 'Rectangular Propagation',
      math: 'a_{ij} = 1 \\text{ si } d_{ij} \\le L, \\; 0 \\text{ si } d_{ij} > L',
      syntax: 'd <= L ? 1 : 0',
      desc: isEs ? 'Función escalón o compuerta booleana de alcance estricto.' : 'Step gate function with strict threshold range.'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Trapezoidal' : 'Trapezoidal Propagation',
      math: 'd \\le L_1 \\Rightarrow 1; \\; d \\ge L \\Rightarrow 0; \\; \\text{resto} \\Rightarrow \\frac{L - d}{L - L_1}',
      syntax: 'd <= L1 ? 1 : (d >= L ? 0 : (L - d) / (L - L1))',
      desc: isEs ? 'Meseta constante hasta el límite L1 y decaimiento lineal posterior hasta L.' : 'Constant plateau up to limit L1 followed by linear decay to L.'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Sinusoidal' : 'Sinusoidal Propagation',
      math: 'a_{ij} = \\frac{1}{2}\\left(1 + \\cos\\left(\\frac{\\pi d_{ij}}{L}\\right)\\right)',
      syntax: 'd <= L ? 0.5 * (1 + cos(pi * d / L)) : 0',
      desc: isEs ? 'Modulación suave no lineal armónica con tangencia cero en los extremos (a=1 en d=0, a=0 en d=L).' : 'Smooth harmonic non-linear modulation with zero tangency at endpoints (a=1 at d=0, a=0 at d=L).'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Inhibida' : 'Inhibited Propagation',
      math: 'a_{ij} = 0 \\quad (i \\neq j)',
      syntax: '0',
      desc: isEs ? 'Anula la afinidad propagada entre elementos distintos (mantiene únicamente a_ii = 1).' : 'Nullifies propagated affinity between distinct elements (preserves strictly a_ii = 1).'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Gaussiana (Personalizada)' : 'Gaussian Propagation (Custom Example)',
      math: 'a_{ij} = \\exp\\left(-\\left(\\frac{d_{ij}}{L}\\right)^2\\right)',
      syntax: 'exp(- (d / L)^2)',
      desc: isEs ? 'Decaimiento gaussiano exponencial suave acentuado para transiciones de corto alcance.' : 'Steep smooth Gaussian exponential decay for localized interactions.'
    },
    {
      category: isEs ? 'Bloqueo' : 'Blocking',
      name: isEs ? 'Bloqueo Standard (Tesis)' : 'Standard Blocking (Thesis)',
      math: 'i = j \\Rightarrow \\left(\\frac{1}{\\sum_k a_{ik}}\\right)^{1 - v_i^b}; \\; i \\neq j \\Rightarrow \\frac{a_{ij}}{\\sum_k a_{ik} - 1}\\left(1 - \\left(\\frac{1}{\\sum_k a_{ik}}\\right)^{1 - v_i^b}\\right)',
      syntax: 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))',
      desc: isEs ? 'Formulación canónica de autoinducción que preserva analíticamente la conservación unitaria de fila.' : 'Canonical autoinduction formulation analytically preserving unit row sum conservation.'
    },
    {
      category: isEs ? 'Bloqueo' : 'Blocking',
      name: isEs ? 'Bloqueo por Umbral' : 'Threshold Blocking',
      math: 'a_{ij} < \\theta \\Rightarrow 0; \\; a_{ij} \\ge \\theta \\Rightarrow a_{ij}',
      syntax: 'a < theta ? 0 : a',
      desc: isEs ? 'Filtra y anula las afinidades débiles por debajo del umbral theta seleccionado.' : 'Filters and nullifies weak affinities below the selected threshold theta.'
    },
    {
      category: isEs ? 'Sinergia' : 'Synergy',
      name: isEs ? 'Sin Sinergia (Identidad)' : 'No Synergy (Identity)',
      math: 'a^C_{ij} = a_{ij}',
      syntax: 'a',
      desc: isEs ? 'Mantiene inalteradas las afinidades autoinducidas entre distintas alternativas.' : 'Keeps autoinduced affinities unchanged between different alternatives.'
    },
    {
      category: isEs ? 'Sinergia' : 'Synergy',
      name: isEs ? 'Sinergia por Factor' : 'Factor Synergy',
      math: 'a^C_{ij} = a_{ij} \\cdot k',
      syntax: 'a * k',
      desc: isEs ? 'Modula multiplicativamente la afinidad autoinducida según el factor k.' : 'Multiplicatively modulates autoinduced affinity by factor k.'
    },
    {
      category: isEs ? 'Ajuste Relativo' : 'Relative Adjustment',
      name: isEs ? 'Ajuste Relativo por Dimensión de Contraste' : 'Relative Contrast Dimension Adjustment',
      math: 'V^{CR}_i = V^C_i \\cdot \\frac{1}{V_{pop, i}}',
      syntax: 'vc / pop',
      desc: isEs ? 'Pondera el valor contextual de cada alternativa en función de su contraste relativo respecto a una dimensión de ajuste o población.' : 'Weights contextual value of each alternative relative to an adjustment or population dimension.'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Sin Equiparación (Ninguno)' : 'No Equalization (None)',
      math: 'V^{CRN}_{i} = V^{CR}_{i}',
      syntax: 'vcr',
      desc: isEs ? 'Mantiene los valores relativos tal cual están sin aplicar ningún factor de escala de equiparación (c_n = 1).' : 'Maintains relative values as-is without applying any equalization scaling factor (c_n = 1).'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Equiparación por Máximo' : 'Maximum Equalization',
      math: 'V^{CRN}_{i} = \\min\\left(1, \\frac{V^{CR}_{i}}{\\max_k V^{CR}_{k}}\\right)',
      syntax: 'min(1, vcr / max_vcr)',
      desc: isEs ? 'Escala los valores relativos al intervalo [0, 1] dividiendo entre el valor máximo observado en la dimensión.' : 'Scales relative values to [0, 1] dividing by the maximum value observed in the dimension.'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Equiparación por Objetivo' : 'Target Objective Equalization',
      math: 'V^{CRN}_{i} = \\min\\left(1, \\frac{V^{CR}_{i}}{obj}\\right)',
      syntax: 'min(1, vcr / obj)',
      desc: isEs ? 'Equipara los valores con respecto a un valor de referencia u objetivo predeterminado obj.' : 'Equalizes values relative to a prescribed reference target objective obj.'
    }
  ];

  return (
    <div className="flex-1 flex overflow-hidden relative w-full h-full">
      {/* LEFT SIDEBAR FOR FUNCTION SYNTAX */}
      <aside
        className={`transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 hidden md:flex flex-col justify-start overflow-y-auto ${
          isSidebarOpen ? 'w-72 lg:w-80 p-5' : 'w-0 p-0 overflow-hidden border-r-0 opacity-0 pointer-events-none'
        }`}
      >
        <AppFooter variant="sidebar" />
      </aside>

      {/* RIGHT MAIN SCROLLABLE CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-200 scroll-smooth">
        <div className="max-w-[1360px] mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
          {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40">
                <Code2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {isEs ? 'Guía de Sintaxis de Funciones Matemáticas' : 'Mathematical Function Syntax Guide'}
              </h1>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              {isEs
                ? 'El motor de cálculo de Ordomática utiliza la sintaxis estándar de expresiones matemáticas de Math.js. Esta notación permite definir funciones personalizadas de propagación, bloqueo, sinergia, ajuste relativo y equiparación de forma natural, intuitiva y universal.'
                : 'The Ordomatics calculation engine uses the standard Math.js mathematical expression syntax. This notation allows defining custom functions for propagation, blocking, synergy, relative adjustment, and equalization in a natural, intuitive, and universal manner.'}
            </p>
          </div>

          <a
            href="https://mathjs.org/docs/expressions/syntax.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all self-start md:self-center shrink-0 cursor-pointer"
          >
            <span>{isEs ? 'Documentación Oficial Math.js' : 'Official Math.js Docs'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Section 1: Reglas de Sintaxis y Operadores */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {isEs ? 'Sintaxis Estándar y Operadores Permitidos' : 'Standard Syntax & Allowed Operators'}
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Card A: Aritmética */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {isEs ? 'Operadores Aritméticos' : 'Arithmetic Operators'}
            </h3>
            <ul className="space-y-1 font-mono text-[11px] text-gray-700 dark:text-gray-300">
              <li><code className="text-blue-600 dark:text-blue-400 font-bold">+</code> : {isEs ? 'Suma' : 'Addition'} (a + b)</li>
              <li><code className="text-blue-600 dark:text-blue-400 font-bold">-</code> : {isEs ? 'Resta' : 'Subtraction'} (a - b)</li>
              <li><code className="text-blue-600 dark:text-blue-400 font-bold">*</code> : {isEs ? 'Multiplicación' : 'Multiplication'} (a * b)</li>
              <li><code className="text-blue-600 dark:text-blue-400 font-bold">/</code> : {isEs ? 'División' : 'Division'} (a / b)</li>
              <li><code className="text-blue-600 dark:text-blue-400 font-bold">^</code> : {isEs ? 'Potencia' : 'Power'} (d ^ 2)</li>
              <li><code className="text-blue-600 dark:text-blue-400 font-bold">%</code> : {isEs ? 'Módulo' : 'Modulo'} (a % b)</li>
            </ul>
          </div>

          {/* Card B: Lógica & Relaciones */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {isEs ? 'Relacionales y Lógicos' : 'Relational & Logical'}
            </h3>
            <ul className="space-y-1 font-mono text-[11px] text-gray-700 dark:text-gray-300">
              <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">&lt;, &lt;=</code> : {isEs ? 'Menor, menor o igual' : 'Less than, less equal'}</li>
              <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">&gt;, &gt;=</code> : {isEs ? 'Mayor, mayor o igual' : 'Greater than, greater equal'}</li>
              <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">==, !=</code> : {isEs ? 'Igualdad, desigualdad' : 'Equality, inequality'}</li>
              <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">and, &&</code> : {isEs ? 'Conjunción lógica' : 'Logical AND'}</li>
              <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">or, ||</code> : {isEs ? 'Disyunción lógica' : 'Logical OR'}</li>
            </ul>
          </div>

          {/* Card C: Condicional Ternario */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              {isEs ? 'Condicional Ternario' : 'Ternary Conditional'}
            </h3>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {isEs ? 'Estructura condicional compacta:' : 'Compact conditional structure:'}
            </p>
            <div className="p-2 rounded bg-white dark:bg-gray-900 font-mono text-[10.5px] text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60 font-bold">
              cond ? val_si : val_no
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              d &lt;= L ? 1 : 0
            </p>
          </div>

          {/* Card D: Funciones Matemáticas */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {isEs ? 'Funciones y Constantes' : 'Functions & Constants'}
            </h3>
            <ul className="space-y-1 font-mono text-[11px] text-gray-700 dark:text-gray-300">
              <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">min(a, b), max(a, b)</code></li>
              <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">exp(x), log(x), sqrt(x)</code></li>
              <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">sin(x), cos(x), abs(x)</code></li>
              <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">pi</code> (&pi;), <code className="text-emerald-600 dark:text-emerald-400 font-bold">e</code> (Euler)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Section 2: Glosario de Variables y Términos del Modelo */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {isEs ? 'Glosario de Variables y Términos' : 'Glossary of Variables & Terms'}
            </span>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {isEs
              ? 'Al redactar una fórmula personalizada en los selectores de funciones, dispones de los siguientes identificadores y variables contextuales en el ámbito de cálculo:'
              : 'When writing a custom formula in function selectors, the following identifiers and contextual variables are available in the evaluation scope:'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Box 1: Propagación */}
            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 space-y-2">
              <div className="font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center justify-between">
                <span>{isEs ? 'Función de Propagación' : 'Propagation Function'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                <li><code className="font-bold text-purple-600 dark:text-purple-400">d</code> o <code className="font-bold text-purple-600 dark:text-purple-400">dist</code>: {isEs ? 'Distancia observada entre las alternativas i y j.' : 'Observed distance between alternatives i and j.'}</li>
                <li><code className="font-bold text-purple-600 dark:text-purple-400">L</code> o <code className="font-bold text-purple-600 dark:text-purple-400">max_d</code>: {isEs ? 'Distancia máxima de referencia observada en la matriz.' : 'Maximum reference distance in matrix.'}</li>
                <li><code className="font-bold text-purple-600 dark:text-purple-400">i</code>, <code className="font-bold text-purple-600 dark:text-purple-400">j</code>: {isEs ? 'Índices numéricos de las alternativas (fila y columna).' : 'Alternative numeric indices (row and column).'}</li>
              </ul>
            </div>

            {/* Box 2: Bloqueo */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
                <span>{isEs ? 'Función de Bloqueo' : 'Blocking Function'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                <li><code className="font-bold text-amber-600 dark:text-amber-400">a</code>: {isEs ? 'Valor de afinidad propagada a_ij previo.' : 'Previous propagated affinity a_ij.'}</li>
                <li><code className="font-bold text-amber-600 dark:text-amber-400">S</code> o <code className="font-bold text-amber-600 dark:text-amber-400">sum</code>: {isEs ? 'Suma total de afinidad de la fila i (S_i = sum_k a_ik).' : 'Total row affinity sum (S_i = sum_k a_ik).'}</li>
                <li><code className="font-bold text-amber-600 dark:text-amber-400">vb</code>: {isEs ? 'Factor de bloqueo correspondiente a la alternativa i (v_i^b).' : 'Blocking factor for alternative i (v_i^b).'}</li>
                <li><code className="font-bold text-amber-600 dark:text-amber-400">i</code>, <code className="font-bold text-amber-600 dark:text-amber-400">j</code>: {isEs ? 'Índices de fila y columna de la celda evaluada.' : 'Row and column indices of evaluated cell.'}</li>
                <li><code className="font-bold text-amber-600 dark:text-amber-400">theta</code> o <code className="font-bold text-amber-600 dark:text-amber-400">umbral</code>: {isEs ? 'Valor del umbral de corte estipulado (θ).' : 'Prescribed cutoff threshold (θ).'}</li>
              </ul>
            </div>

            {/* Box 3: Sinergia */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="font-bold text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between">
                <span>{isEs ? 'Función de Sinergia' : 'Synergy Function'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                <li><code className="font-bold text-blue-600 dark:text-blue-400">a</code>: {isEs ? 'Afinidad autoconvectiva previa de la celda a^AA_ij.' : 'Previous autoconvective affinity a^AA_ij.'}</li>
                <li><code className="font-bold text-blue-600 dark:text-blue-400">k</code>: {isEs ? 'Factor multiplicador de sinergia grupal (k ≥ 0).' : 'Synergy multiplier factor (k ≥ 0).'}</li>
              </ul>
            </div>

            {/* Box 4: Ajuste Relativo */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
              <div className="font-bold text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-between">
                <span>{isEs ? 'Ajuste Relativo' : 'Relative Adjustment'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                <li><code className="font-bold text-indigo-600 dark:text-indigo-400">vp</code>, <code className="font-bold text-indigo-600 dark:text-indigo-400">vc</code>: {isEs ? 'Valor propio o contextual de la alternativa.' : 'Own or contextual value of the alternative.'}</li>
                <li><code className="font-bold text-indigo-600 dark:text-indigo-400">pop</code>, <code className="font-bold text-indigo-600 dark:text-indigo-400">v_pop</code>: {isEs ? 'Valor en la dimensión de contraste relativo o población de referencia.' : 'Reference population or relative contrast dimension value.'}</li>
                <li><code className="font-bold text-indigo-600 dark:text-indigo-400">ca</code>: {isEs ? 'Factor ponderador de contraste relativo (c_a = 1 / pop).' : 'Relative contrast weighting factor (c_a = 1 / pop).'}</li>
              </ul>
            </div>

            {/* Box 5: Equiparación */}
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span>{isEs ? 'Ajuste por Equiparación' : 'Equalization Adjustment'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                <li><code className="font-bold text-emerald-600 dark:text-emerald-400">vcr</code>: {isEs ? 'Valor relativo previo de la alternativa en la dimensión.' : 'Previous relative value of the alternative in dimension.'}</li>
                <li><code className="font-bold text-emerald-600 dark:text-emerald-400">max_vcr</code>: {isEs ? 'Valor relativo máximo registrado en la dimensión (c_n = 1 / max_vcr).' : 'Maximum relative value in dimension (c_n = 1 / max_vcr).'}</li>
                <li><code className="font-bold text-emerald-600 dark:text-emerald-400">obj</code>: {isEs ? 'Valor objetivo de referencia predeterminado (c_n = 1 / obj).' : 'Predetermined target reference value (c_n = 1 / obj).'}</li>
                <li><code className="font-bold text-emerald-600 dark:text-emerald-400">cn</code>: {isEs ? 'Factor de escala de equiparación interdimensional.' : 'Interdimensional equalization scaling factor.'}</li>
              </ul>
            </div>

            {/* Box 6: Matrices Modelo */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                <span>{isEs ? 'Matrices del Modelo' : 'Model Matrices'}</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300 font-mono">
                <li><strong className="text-amber-600 dark:text-amber-400">D</strong>: {isEs ? 'Matriz de distancias o costes entre alternativas' : 'Distance or cost matrix between alternatives'}</li>
                <li><strong className="text-blue-600 dark:text-blue-400">A</strong>: {isEs ? 'Afinidad directa de interacción entre alternativas' : 'Direct interaction affinity between alternatives'}</li>
                <li><strong className="text-purple-600 dark:text-purple-400">A^A, A^C</strong>: {isEs ? 'Afinidad contextual autoinducida y modulada' : 'Autoinduced and modulated contextual affinity'}</li>
                <li><strong className="text-emerald-600 dark:text-emerald-400">C</strong>: {isEs ? 'Afinidad interdimensional entre criterios' : 'Interdimensional criteria affinity'}</li>
                <li><strong className="text-indigo-600 dark:text-indigo-400">V^P, V^C</strong>: {isEs ? 'Vectores de valores propios y contextuales' : 'Own and contextual value vectors'}</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 3: Funciones Definidas */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {isEs ? 'Catálogo de Funciones' : 'Functions Catalog'}
            </span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 font-semibold text-gray-600 dark:text-gray-300">
                <th className="py-2.5 px-3">{isEs ? 'Función' : 'Function'}</th>
                <th className="py-2.5 px-3">{isEs ? 'Nombre de Opción' : 'Option Name'}</th>
                <th className="py-2.5 px-3">{isEs ? 'Sintaxis Escrita (Math.js)' : 'Written Syntax (Math.js)'}</th>
                <th className="py-2.5 px-3">{isEs ? 'Descripción del Comportamiento' : 'Behavior Description'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {formulasList.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3">
                    <code className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-[11px] font-bold select-all">
                      {item.syntax}
                    </code>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 4: Probador de Funciones */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {isEs ? 'Probador de Funciones' : 'Function Tester'}
            </span>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            {isEs
              ? 'Prueba en tiempo real cualquier fórmula personalizada antes de ingresarla en la configuración de la ordomáquina o de los flavours:'
              : 'Test any custom formula in real-time before entering it in the ordomachine or flavours configuration:'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isEs ? 'Expresión Matemática:' : 'Mathematical Expression:'}
              </label>
              <input
                type="text"
                value={testExpr}
                onChange={e => setTestExpr(e.target.value)}
                placeholder="max(0, 1 - (d / L))"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-xs text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isEs ? 'Variables de Prueba (clave = valor, ...):' : 'Test Scope Variables (key = val, ...):'}
              </label>
              <input
                type="text"
                value={testVariables}
                onChange={e => setTestVariables(e.target.value)}
                placeholder="d = 4, L = 10"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Result Output Pill */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {evalResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {evalResult.isValid
                    ? isEs ? 'Evaluación Exitosa:' : 'Successful Evaluation:'
                    : isEs ? 'Error en la Sintaxis o Variable no definida' : 'Syntax Error or Undefined Variable'}
                </span>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                  {testExpr}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isEs ? 'Resultado:' : 'Result:'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-black text-sm">
                {evalResult.isValid ? Number(evalResult.value.toFixed(4)) : 'NaN'}
              </span>
            </div>
          </div>
        </div>
      </Card>

        {/* Persistent Author & License Footer */}
        <AppFooter />
      </div>
    </main>
  </div>
  );
};
