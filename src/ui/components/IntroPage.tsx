import React, { useState, useMemo } from 'react';
import {
  Compass,
  Cpu,
  Layers,
  Network,
  Scale,
  Zap,
  Sliders,
  CheckCircle2,
  FileText,
  Activity,
  ArrowRight,
  Code2,
  ExternalLink,
  Terminal,
  Calculator,
  AlertCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Card } from './Card';
import { AppFooter } from './AppFooter';
import { evaluateMathExpression } from '../../logic/mathExpression';
import { useI18n } from '../i18n/I18nContext';

export interface IntroPageProps {
  isSidebarOpen?: boolean;
  onNavigateToOrdomachine?: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({
  isSidebarOpen = true,
  onNavigateToOrdomachine
}) => {
  const { language } = useI18n();
  const isEs = language === 'es';

  // State to manage card collapse; all cards start collapsed initially as requested
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({
    'mona-lisa': true,
    'what-is': true,
    'foundations': true,
    'purpose': true,
    'guide': true,
    'custom-functions': true
  });

  const toggleCard = (id: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Interactive formula tester state
  const [testExpr, setTestExpr] = useState<string>('max(0, 1 - (d / L))');
  const [testVariables, setTestVariables] = useState<string>(
    'd = 4, L = 10, L1 = 3, a = 0.75, S = 2.5, vb = 0.3, k = 1.2, theta = 0.25, vc = 3.5, pop = 10, vcr = 0.35, max_vcr = 0.5, obj = 1, vp = 3.5'
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
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>i</i> ≠ <i>j</i> ⟹ max(0, 1 − <i>d</i><sub>ij</sub> / <i>L</i>)
        </span>
      ),
      syntax: 'i == j ? 1 : (d <= L ? (L - d) / L : 0)'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Rectangular' : 'Rectangular Propagation',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>i</i> ≠ <i>j</i> ⟹ (<i>d</i><sub>ij</sub> ≤ <i>L</i> ? 1 : 0)
        </span>
      ),
      syntax: 'i == j ? 1 : (d <= L ? 1 : 0)'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Trapezoidal' : 'Trapezoidal Propagation',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>d</i> ≤ <i>L</i><sub>1</sub> ⟹ 1; <i>d</i> ≥ <i>L</i> ⟹ 0; resto ⟹ (<i>L</i> − <i>d</i>) / (<i>L</i> − <i>L</i><sub>1</sub>)
        </span>
      ),
      syntax: 'i == j ? 1 : (d <= L1 ? 1 : (d <= L ? (L - d) / (L - L1) : 0))'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Sinusoidal' : 'Sinusoidal Propagation',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>i</i> ≠ <i>j</i> ⟹ ½ · (1 + cos(π · <i>d</i><sub>ij</sub> / <i>L</i>))
        </span>
      ),
      syntax: 'i == j ? 1 : (d <= L ? 0.5 * (1 + cos(pi * d / L)) : 0)'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Inhibida' : 'Inhibited Propagation',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>i</i> ≠ <i>j</i> ⟹ 0
        </span>
      ),
      syntax: 'i == j ? 1 : 0'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'División por Máxima (Ordoexperto)' : 'Max Ratio Propagation (Ordoexpert)',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>i</i> ≠ <i>j</i> ⟹ <i>d</i><sub>ij</sub> / max(<i>D</i>)
        </span>
      ),
      syntax: 'i == j ? 1 : (L > 0 ? d / L : 0)'
    },
    {
      category: isEs ? 'Propagación' : 'Propagation',
      name: isEs ? 'Propagación Gaussiana (Personalizada)' : 'Gaussian Propagation (Custom Example)',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>i</i> ≠ <i>j</i> ⟹ exp(−(<i>d</i><sub>ij</sub> / <i>L</i>)²)
        </span>
      ),
      syntax: 'i == j ? 1 : exp(- (d / L)^2)'
    },
    {
      category: isEs ? 'Bloqueo' : 'Blocking',
      name: isEs ? 'Sin Bloqueo' : 'No Blocking',
      mathHtml: (
        <span>
          <i>A</i><sup>A</sup> = <i>A</i>
        </span>
      ),
      syntax: 'a'
    },
    {
      category: isEs ? 'Bloqueo' : 'Blocking',
      name: isEs ? 'Bloqueo Standard (Tesis)' : 'Standard Blocking (Thesis)',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ (1 / ∑<sub>k</sub> <i>a</i><sub>ik</sub>)<sup>(1 − <i>v</i><sup>b</sup><sub>i</sub>)</sup>; &nbsp;
          <i>i</i> ≠ <i>j</i> ⟹ [<i>a</i><sub>ij</sub> / (∑<sub>k</sub> <i>a</i><sub>ik</sub> − 1)] · [1 − (1 / ∑<sub>k</sub> <i>a</i><sub>ik</sub>)<sup>(1 − <i>v</i><sup>b</sup><sub>i</sub>)</sup>]
        </span>
      ),
      syntax: 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))'
    },
    {
      category: isEs ? 'Bloqueo' : 'Blocking',
      name: isEs ? 'Bloqueo por Umbral' : 'Threshold Blocking',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ 1; <i>a</i><sub>ij</sub> &lt; θ ⟹ 0; <i>a</i><sub>ij</sub> ≥ θ ⟹ <i>a</i><sub>ij</sub>
        </span>
      ),
      syntax: 'i == j ? 1 : (a < theta ? 0 : a)'
    },
    {
      category: isEs ? 'Sinergia' : 'Synergy',
      name: isEs ? 'Sin Sinergia (Identidad)' : 'No Synergy (Identity)',
      mathHtml: (
        <span>
          <i>a</i><sup>C</sup><sub>ij</sub> = <i>a</i><sub>ij</sub>
        </span>
      ),
      syntax: 'a'
    },
    {
      category: isEs ? 'Sinergia' : 'Synergy',
      name: isEs ? 'Sinergia por Factor' : 'Factor Synergy',
      mathHtml: (
        <span>
          <i>i</i> = <i>j</i> ⟹ <i>a</i><sub>ii</sub>; <i>i</i> ≠ <i>j</i> ⟹ <i>a</i><sub>ij</sub> · <i>k</i>
        </span>
      ),
      syntax: 'i == j ? a : a * k'
    },
    {
      category: isEs ? 'Ajuste Relativo' : 'Relative Adjustment',
      name: isEs ? 'Ajuste Relativo por Dimensión de Contraste' : 'Relative Contrast Dimension Adjustment',
      mathHtml: (
        <span>
          <i>V</i><sup>CR</sup><sub>i</sub> = <i>V</i><sup>C</sup><sub>i</sub> · (1 / <i>V</i><sub>pop, i</sub>)
        </span>
      ),
      syntax: 'vc / pop'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Sin Equiparación (Ninguno)' : 'No Equalization (None)',
      mathHtml: (
        <span>
          <i>V</i><sup>CRN</sup><sub>i</sub> = <i>V</i><sup>CR</sup><sub>i</sub>
        </span>
      ),
      syntax: 'vcr'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Equiparación por Máximo' : 'Maximum Equalization',
      mathHtml: (
        <span>
          <i>V</i><sup>CRN</sup><sub>i</sub> = min(1, <i>V</i><sup>CR</sup><sub>i</sub> / max<sub>k</sub> <i>V</i><sup>CR</sup><sub>k</sub>)
        </span>
      ),
      syntax: 'min(1, vcr / max_vcr)'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Equiparación por Suma' : 'Sum Equalization',
      mathHtml: (
        <span>
          <i>V</i><sup>CRN</sup><sub>i</sub> = <i>V</i><sup>CR</sup><sub>i</sub> / ∑<sub>k</sub> <i>V</i><sup>CR</sup><sub>k</sub>
        </span>
      ),
      syntax: 'vcr / sum_vcr'
    },
    {
      category: isEs ? 'Equiparación Interdimensional' : 'Equalization Adjustment',
      name: isEs ? 'Equiparación por Objetivo' : 'Target Objective Equalization',
      mathHtml: (
        <span>
          <i>V</i><sup>CRN</sup><sub>i</sub> = min(1, <i>V</i><sup>CR</sup><sub>i</sub> / <i>obj</i>)
        </span>
      ),
      syntax: 'min(1, vcr / obj)'
    }
  ];

  return (
    <div className="flex-1 flex overflow-hidden relative w-full h-full">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 hidden md:flex flex-col justify-start overflow-y-auto ${
          isSidebarOpen ? 'w-72 lg:w-80 p-5' : 'w-0 p-0 overflow-hidden border-r-0 opacity-0 pointer-events-none'
        }`}
      >
        <AppFooter variant="sidebar" />
      </aside>

      {/* RIGHT MAIN SCROLLABLE CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-200 scroll-smooth">
        <div className="max-w-[1360px] mx-auto space-y-10 pb-16 animate-in fade-in duration-300">

          {/* HERO BANNER */}
          <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/30 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  {isEs ? 'Introducción a la Ordomática' : 'Introduction to Ordomatics'}
                </h1>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                  {isEs
                    ? 'Guía conceptual didáctica sobre el marco de cálculo para la asignación de valor, ordenación y toma de decisiones multicriterio en entornos relacionales interconectados, formulado en la tesis doctoral de Carlos Caño Alegre.'
                    : 'Didactic conceptual guide on the calculation framework for value assignment, ranking, and multi-criteria decision-making in interconnected relational environments, formulated in the doctoral thesis by Carlos Caño Alegre.'}
                </p>
              </div>

              {onNavigateToOrdomachine && (
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onNavigateToOrdomachine}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all cursor-pointer group"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>{isEs ? 'Acceder a la Ordomáquina' : 'Launch Ordomachine'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="https://buleria.unileon.es/server/api/core/bitstreams/4ccec1fb-a72e-4e8a-9ac2-556f5260bcaa/content"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-800 dark:text-gray-200 border border-white/20 font-semibold text-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Descargar Tesis Doctoral (PDF)' : 'Download Doctoral Thesis (PDF)'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* TARJETA 1: ¿POR QUÉ LA SONRISA DE MONA LISA? */}
          <section id="sec-mona-lisa" className="scroll-mt-8 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {isEs ? '¿Por qué la sonrisa de Mona Lisa?' : "Why the Mona Lisa's smile?"}
                    </h2>
                  </div>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleCard('mona-lisa')}
                  title={collapsedCards['mona-lisa'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  aria-label={collapsedCards['mona-lisa'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                >
                  {collapsedCards['mona-lisa'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              }
            >
              {!collapsedCards['mona-lisa'] && (
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {isEs
                        ? '«La sonrisa de Mona Lisa: una introducción a la ordomática» es el título de la tesis doctoral de Carlos Caño Alegre (Universidad de León, 2015). La enigmática obra de Leonardo da Vinci no es una mera metáfora artística, sino la referencia fundacional para comprender la necesidad, el alcance y el alma de este marco científico.'
                        : '«The smile of Mona Lisa: an introduction to ordomatics» is the title of the doctoral thesis by Carlos Caño Alegre (University of León, 2015). Leonardo da Vinci’s enigmatic masterpiece is not a mere artistic metaphor, but the foundational reference for understanding the necessity, scope, and core essence of this scientific framework.'}
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed">
                    {isEs
                      ? 'Leonardo da Vinci, ingeniero y artista adelantado a su tiempo, elaboró el retrato de Lisa Gherardini a lo largo de más de quince años (del 1503 al 1519). Retomando la obra una y otra vez, incorporó detalles y sutiles capas de pintura llenas de matices mediante la técnica del sfumato —descrita por el propio Leonardo como una pintura «sin líneas o bordes, en forma de humo», lo que en la ciencia moderna resumimos como difusa o borrosa. La parte más célebre y estudiada de la obra es su sonrisa: su profunda ambigüedad le confiere la capacidad de expresar emociones simultáneas y contrapuestas, desafiando cualquier categorización binaria simple.'
                      : 'Leonardo da Vinci, an engineer and artist ahead of his time, worked on the portrait of Lisa Gherardini over more than fifteen years (1503 to 1519). Revisiting the canvas repeatedly, he added details and subtle paint glazes rich in nuances using the sfumato technique —described by Leonardo himself as painting «without lines or borders, in the manner of smoke», what modern science defines as diffuse or fuzzy. The most celebrated and studied element of the masterpiece is her smile: its profound ambiguity grants it the capacity to express simultaneous, conflicting emotions, defying simple binary categorization.'}
                  </p>

                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      {isEs
                        ? 'La no determinación exacta como el mejor reflejo de la realidad'
                        : 'Non-exact determination as the truest reflection of reality'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {isEs
                        ? 'Resulta extraordinario que una obra considerada paradigma universal de la perfección esconda uno de los ejemplos más evidentes de cómo la no determinación exacta de las cosas es el mejor reflejo de la realidad. En los problemas socioeconómicos, territoriales y de decisión, la información casi nunca se presenta en forma de certezas absolutas ni valores nítidos aislados. La realidad que nos circunda es intrínsecamente borrosa, heterogénea y repleta de gradaciones.'
                        : 'It is extraordinary that a masterpiece revered as a universal paradigm of perfection conceals one of the most prominent demonstrations of how the non-exact determination of things is the truest reflection of reality. In socioeconomic, territorial, and decision-making problems, information almost never presents itself as absolute certainties or isolated crisp values. The surrounding reality is intrinsically fuzzy, heterogeneous, and filled with gradations.'}
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed">
                    {isEs
                      ? 'Este aspecto difuso y a la par realista entronca de manera radicalmente directa con la piedra angular de la ordomática: la incertidumbre, lejos de ser un defecto perturbador que deba eliminarse o ignorarse, es nuestro mayor aliado a la hora de reflejar con extremado detalle la naturaleza del mundo. Sin embargo, el manejo riguroso de esta incertidumbre en pos de conclusiones válidas y operativas exige una metodología propia. Como ya adelantaba el ilustre Dr. Jaime Gil Aluja, «la determinación de un orden en la incertidumbre es una condición básica».'
                      : 'This diffuse yet realistic aspect connects fundamentally with the cornerstone of Ordomatics: uncertainty, far from being a disruptive flaw that must be discarded or ignored, is our greatest ally in capturing the intricacies of the world. However, rigorous management of this uncertainty to reach sound, operational conclusions demands its own methodology. As formulated by Dr. Jaime Gil Aluja, «determining an order within uncertainty is a basic condition».'}
                  </p>

                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      {isEs
                        ? 'De la cuantificación del ánimo difuso al marco de cálculo ordomático'
                        : 'From quantifying fuzzy emotional states to the Ordomatics calculation framework'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {isEs
                        ? 'Del mismo modo que la computación contemporánea consiguió desentrañar la enigmática sonrisa cuantificándola en una mezcla difusa de estados anímicos (un 83 % feliz, un 9 % disgustada, un 6 % temerosa y un 2 % enfadada), la ordomática nace para dar respuesta matemática a los escenarios donde los elementos analizados interactúan dentro de un contexto complejo. Proporciona los mecanismos para integrar datos heterogéneos (cualitativos, 2-tuplas lingüísticas, intervalos y cuantitativos), modelar cómo fluye e influye el valor entre las alternativas, y construir una ordenación objetiva sin destruir la riqueza de la incertidumbre original.'
                        : 'Just as contemporary computing managed to unravel the enigmatic smile by quantifying it as a multi-dimensional fuzzy blend of emotional states (83% happy, 9% disgusted, 6% fearful, and 2% angry), Ordomatics was created to provide a mathematical answer to scenarios where analyzed elements interact within a complex context. It provides the mechanisms to integrate heterogeneous data (qualitative, linguistic 2-tuples, intervals, and quantitative), model how value flows and influences across alternatives, and build an objective ranking without destroying the rich nuance of the original uncertainty.'}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* TARJETA 2: ¿QUÉ ES LA ORDOMÁTICA? */}
          <section id="sec-what-is" className="scroll-mt-8 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Compass className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {isEs ? '¿Qué es la ordomática?' : 'What is Ordomatics?'}
                    </h2>
                  </div>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleCard('what-is')}
                  title={collapsedCards['what-is'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  aria-label={collapsedCards['what-is'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                >
                  {collapsedCards['what-is'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              }
            >
              {!collapsedCards['what-is'] && (
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {isEs
                        ? 'La ordomática es la disciplina científica que estudia y formaliza el proceso global de asignación de valor y ordenación de un conjunto de alternativas a partir de datos de entrada heterogéneos y multidimensionales, considerando de manera explícita las interacciones, afinidades y transferencias de valor existentes entre ellas.'
                        : 'Ordomatics is the scientific discipline that studies and formalizes the global process of value assignment and ranking of a set of alternatives from heterogeneous, multi-dimensional input data, explicitly considering the interactions, affinities, and value transfers between them.'}
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed">
                    {isEs
                      ? 'A diferencia de los métodos multicriterio clásicos (como AHP, TOPSIS o PROMETHEE) que evalúan cada alternativa como una entidad aislada e independiente en el vacío, la ordomática reconoce una realidad física fundamental: en los sistemas reales (ciudades, centros sanitarios, jugadores de un equipo, nodos logísticos o monoplazas en carrera), los elementos intercambian flujos de influencia, atracción y servicio mutuo regulados por distancias espaciales, funcionales o temporales.'
                      : 'Unlike classical multi-criteria methods (such as AHP, TOPSIS, or PROMETHEE) that assess each alternative as an isolated, independent entity in a vacuum, Ordomatics recognizes a fundamental reality: in real-world systems (cities, hospitals, sports team players, logistics hubs, or race cars), elements exchange flows of influence, attraction, and mutual service governed by spatial, functional, or temporal distances.'}
                  </p>

                  {/* Las 4 Fases de la Ordomática */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{isEs ? 'El Proceso en Cuatro Fases Secuenciales' : 'The Four Sequential Process Phases'}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fase 1 */}
                      <div className="p-4 rounded-xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center justify-center">
                            1
                          </span>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                            {isEs ? 'Preprocesamiento de Información Heterogénea' : 'Heterogeneous Information Preprocessing'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Tratamiento riguroso de fuentes de diversa naturaleza (datos numéricos cardinales, ordinales y juicios lingüísticos borrosos). Mediante conjuntos difusos y el modelo de 2-tuplas lingüísticas (Herrera y Martínez), se garantiza la no pérdida de información y la unificación de escalas de distinta granularidad.'
                            : 'Rigorous handling of diverse information sources (cardinal numeric data, ordinal rankings, and fuzzy linguistic judgments). Through fuzzy sets and the 2-tuple linguistic model (Herrera & Martinez), information loss prevention and harmonization across multi-granular domains are guaranteed.'}
                        </p>
                      </div>

                      {/* Fase 2 */}
                      <div className="p-4 rounded-xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center">
                            2
                          </span>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                            {isEs ? 'Análisis Característico (Flujos de Valor)' : 'Characteristic Analysis (Value Flows)'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Modelado dimensional independiente de cada criterio. Regula cómo se propaga el valor entre alternativas a través de la afinidad espacial/funcional, el vector de bloqueo y las sinergias, transformando el valor intrínseco (valor propio) en valor contextual observable.'
                            : 'Independent dimensional modeling of each criterion. Regulates how value propagates across alternatives via spatial/functional affinity, blocking vectors, and synergies, transforming intrinsic value (proper value) into observable contextual value.'}
                        </p>
                      </div>

                      {/* Fase 3 */}
                      <div className="p-4 rounded-xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center justify-center">
                            3
                          </span>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                            {isEs ? 'Ajuste Relativo y Equiparación de Escala' : 'Relative Adjustment & Scale Equalization'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Ponderación del valor contextual frente a dimensiones de contraste de soporte (población, superficie o intensidad de uso) y normalización a una escala unitaria [0, 1] mediante funciones de equiparación (por máximo, por suma o por objetivo), permitiendo su comparación interdimensional.'
                            : 'Weighting of contextual value against contrast baseline dimensions (population, area, or usage volume) and normalization onto a unit interval [0, 1] via equalization functions (by maximum, sum, or target), enabling fair interdimensional comparison.'}
                        </p>
                      </div>

                      {/* Fase 4 */}
                      <div className="p-4 rounded-xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center">
                            4
                          </span>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                            {isEs ? 'Análisis de Agregación Multicriterio' : 'Multi-Criteria Aggregation Analysis'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Integración global mediante operadores OWA (Ordered Weighted Averaging) acoplados con la matriz de afinidad entre criterios. Redistribuye los pesos evitando el doble cómputo de criterios redundantes y genera el ranking u ordenación final de las alternativas.'
                            : 'Comprehensive integration using OWA (Ordered Weighted Averaging) operators coupled with the criteria affinity matrix. It redistributes weights to prevent double-counting redundant criteria and derives the definitive alternative ranking.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* TARJETA 2: ASPECTOS PRINCIPALES DEL MARCO DE CÁLCULO */}
          <section id="sec-foundations" className="scroll-mt-8 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Network className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {isEs
                        ? '¿Cuáles son los aspectos principales que dan soporte al marco de cálculo de la ordomática?'
                        : 'What are the main aspects supporting the Ordomatics calculation framework?'}
                    </h2>
                  </div>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleCard('foundations')}
                  title={collapsedCards['foundations'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  aria-label={collapsedCards['foundations'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                >
                  {collapsedCards['foundations'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              }
            >
              {!collapsedCards['foundations'] && (
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  
                  {/* DUALIDAD DEL CONCEPTO DE VALOR */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{isEs ? 'La Dualidad del Concepto de Valor: Propio vs Contextual' : 'Value Duality: Proper vs Contextual'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {isEs
                        ? 'Uno de los pilares axiológicos de la ordomática es el reconocimiento de que el valor no es una magnitud estática e incorpórea, sino que presenta una naturaleza dual:'
                        : 'A core axiological foundation of Ordomatics is that value is not a static, isolated magnitude, but exhibits a dual nature:'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wide">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-mono text-xs">
                            <i>V</i><sup>P</sup>
                          </span>
                          <span>{isEs ? 'Valor Propio (Intrínseco)' : 'Proper Value (Intrinsic)'}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Representa el valor intrínseco, per se, que un elemento posee por su propia dotación o capacidad instalada de partida (p. ej., camas instaladas en un hospital, minutos disputados por un jugador, volumen de fondos presupuestados), con total abstracción de su entorno.'
                            : 'Represents the intrinsic value per se that an element possesses by its own initial endowment or installed capacity (e.g., installed hospital beds, minutes played, budgeted funds), isolated from its surroundings.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wide">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-xs">
                            <i>V</i><sup>C</sup>
                          </span>
                          <span>{isEs ? 'Valor Contextual (Efectivo)' : 'Contextual Value (Effective)'}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Representa el valor observable o percibido en el contexto relacional una vez que han actuado los flujos de atracción, servicio o influencia mutua. Es el valor real de impacto del elemento al interactuar con el resto de la red.'
                            : 'Represents the observable or perceived value within the relational context after attraction, service, and mutual influence flows have acted. It reflects the real-world operational value of the element within the network.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* REGULACIÓN DE FLUJOS DE VALOR */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{isEs ? 'Regulación de Flujos de Valor' : 'Value Flow Regulation'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {isEs ? (
                        <>
                          La transferencia de valor entre alternativas se rige por un proceso formalizado en cascada que transforma el espacio métrico en una matriz de afinidad contextual estricta. A partir de una métrica de distancia espacial, temporal o funcional (<i>d</i><sub>ij</sub>), la función de propagación <i>F</i><sub>P</sub> establece una afinidad autorreflexiva en la diagonal (<i>a</i><sub>ii</sub> = 1) que decrece monótonamente con la distancia hasta anularse a partir de un radio de alcance límite <i>L</i>.
                        </>
                      ) : (
                        <>
                          The transfer of value between alternatives is governed by a cascaded process transforming metric distance space into a strictly calibrated contextual affinity matrix. Starting from a spatial, temporal, or functional distance metric (<i>d</i><sub>ij</sub>), the propagation function <i>F</i><sub>P</sub> establishes reflexive diagonal affinity (<i>a</i><sub>ii</sub> = 1) that decays monotonically with distance down to zero beyond a threshold radius <i>L</i>.
                        </>
                      )}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {isEs ? (
                        <>
                          Para asegurar que el valor propio no se multiplique ni se disipe arbitrariamente, el modelo incorpora la afinidad autoinducida (<i>A</i><sup>A</sup>) y el principio de conservación de flujos, regulado por el vector de bloqueo <i>V</i><sup>B</sup> = (<i>v</i><sup>b</sup><sub>1</sub>, ..., <i>v</i><sup>b</sup><sub>n</sub>). Cada componente <i>v</i><sup>b</sup><sub>i</sub> modula el grado de autarquía: si <i>v</i><sup>b</sup><sub>i</sub> = 1 (bloqueo total), el elemento retiene todo su valor propio sin transferencias; si <i>v</i><sup>b</sup><sub>i</sub> = 0 (bloqueo nulo), comparte y dispersa su valor de forma solidaria con su entorno. Esta formulación garantiza analíticamente que la suma de flujos por fila sea exactamente unitaria (∑<sub>k</sub> <i>a</i><sup>a</sup><sub>ik</sub> = 1), preservando íntegramente la masa total de valor en el sistema.
                        </>
                      ) : (
                        <>
                          To ensure proper value neither multiplies nor dissipates arbitrarily, the model incorporates autoinduced affinity (<i>A</i><sup>A</sup>) and the value conservation principle, regulated by the blocking vector <i>V</i><sup>B</sup> = (<i>v</i><sup>b</sup><sub>1</sub>, ..., <i>v</i><sup>b</sup><sub>n</sub>). Each component <i>v</i><sup>b</sup><sub>i</sub> modulates autarky: if <i>v</i><sup>b</sup><sub>i</sub> = 1 (total blocking), the element retains all its proper value; if <i>v</i><sup>b</sup><sub>i</sub> = 0 (zero blocking), it freely disperses value with its network. This formulation analytically guarantees that each row sum equals exactly one (∑<sub>k</sub> <i>a</i><sup>a</sup><sub>ik</sub> = 1), fully preserving the total value mass in the system.
                        </>
                      )}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {isEs ? (
                        <>
                          Finalmente, la matriz de afinidad contextual (<i>A</i><sup>C</sup>) integra posibles efectos colaborativos o competitivos no lineales mediante funciones de sinergia <i>F</i><sub>S</sub> con factores multiplicativos <i>k</i>, modulando las interacciones entre alternativas distintas.
                        </>
                      ) : (
                        <>
                          Finally, the contextual affinity matrix (<i>A</i><sup>C</sup>) incorporates non-linear collaborative or competitive effects via synergy functions <i>F</i><sub>S</sub> with multiplicative factors <i>k</i>, modulating interactions between distinct alternatives.
                        </>
                      )}
                    </p>
                  </div>

                  {/* ECUACIÓN FUNDAMENTAL E INVERSIBILIDAD */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{isEs ? 'Ecuación Fundamental, Multidireccionalidad y Resolución de Indeterminaciones' : 'Fundamental Equation, Multi-Directionality & Indeterminacy Resolution'}</span>
                    </h3>
                    <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                      <div className="text-center py-2">
                        <div className="font-mono text-base md:text-lg font-bold text-indigo-950 dark:text-indigo-200">
                          <i>V</i><sup>C</sup> = <i>V</i><sup>P</sup> · <i>A</i><sup>C</sup>
                        </div>
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                          {isEs ? 'Ecuación Fundamental del Análisis Característico' : 'Fundamental Equation of Characteristic Analysis'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {isEs ? (
                          <>
                            Esta ecuación establece que el vector fila de valores contextuales <i>V</i><sup>C</sup> es el producto del vector de valores propios <i>V</i><sup>P</sup> por la matriz de afinidad contextual <i>A</i><sup>C</sup>. Pero además, el marco ordomático es multidireccional:
                          </>
                        ) : (
                          <>
                            This equation establishes that the contextual value row vector <i>V</i><sup>C</sup> is the product of the proper value vector <i>V</i><sup>P</sup> and the contextual affinity matrix <i>A</i><sup>C</sup>. Moreover, the Ordomatics framework is bidirectional:
                          </>
                        )}
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-2 pl-1 leading-relaxed">
                        <li>
                          <strong>{isEs ? 'Cálculo Inverso:' : 'Inverse Calculation:'}</strong> {isEs ? 'Si se conoce el valor contextual observable empíricamente en el territorio y se desea conocer el valor propio intrínseco latente: ' : 'If contextual value is empirically observed and intrinsic proper value is sought: '}
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            <i>V</i><sup>P</sup> = <i>V</i><sup>C</sup> · (<i>A</i><sup>C</sup>)<sup>−1</sup>
                          </span>.
                        </li>
                        <li>
                          <strong>{isEs ? 'Resolución de Indeterminaciones:' : 'Indeterminacy Resolution:'}</strong> {isEs ? (
                            <>
                              Si det(<i>A</i><sup>C</sup>) = 0 o el sistema es compatible indeterminado (debido a alternativas con conectividades o distancias colineales), la ordomática resuelve la indeterminación agregando los elementos dependientes en nodos representativos unívocos, eliminando singularidades y restaurando la regularidad algebraica.
                            </>
                          ) : (
                            <>
                              If det(<i>A</i><sup>C</sup>) = 0 or the system is underdetermined (due to collinear or identical alternative connectivity), Ordomatics resolves it by aggregating dependent elements into representative nodes, eliminating algebraic singularities.
                            </>
                          )}
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* AGREGACIÓN MULTICRITERIO Y REDISTRIBUCIÓN DE PESOS */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{isEs ? 'Agregación Multicriterio OWA con Afinidad entre Criterios' : 'OWA Multi-Criteria Aggregation with Criteria Affinity'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {isEs ? (
                        <>
                          Los métodos multicriterio convencionales asumen que los criterios son ortogonales e independientes. En el mundo real, los criterios suelen presentar correlación o afinidad semántica mutua (por ejemplo, accesibilidad por carretera y accesibilidad en ferrocarril). La ordomática supera esta limitación integrando una matriz de afinidad entre criterios <i>C</i>′ con el vector de pesos OWA, redistribuyendo dinámicamente la importancia asignada a cada dimensión para amortiguar criterios redundantes y fortalecer dimensiones complementarias sin sesgos.
                        </>
                      ) : (
                        <>
                          Conventional multi-criteria methods assume criteria are orthogonal and independent. In reality, criteria exhibit mutual correlation or semantic affinity (e.g., road accessibility and rail accessibility). Ordomatics overcomes this limitation by integrating a criteria affinity matrix <i>C</i>′ with the OWA weight vector, dynamically redistributing weights to dampen redundant dimensions and strengthen complementary criteria without bias.
                        </>
                      )}
                    </p>
                  </div>

                </div>
              )}
            </Card>
          </section>

          {/* TARJETA 3: ¿PARA QUÉ SIRVE LA ORDOMÁQUINA? */}
          <section id="sec-purpose" className="scroll-mt-8 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Cpu className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {isEs ? '¿Para qué sirve la ordomáquina?' : 'What is the Ordomachine for?'}
                    </h2>
                  </div>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleCard('purpose')}
                  title={collapsedCards['purpose'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  aria-label={collapsedCards['purpose'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                >
                  {collapsedCards['purpose'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              }
            >
              {!collapsedCards['purpose'] && (
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p className="text-sm leading-relaxed">
                    {isEs
                      ? 'La ordomáquina es el motor computacional interactivo y entorno de simulación que implementa operativamente el marco teórico de la ordomática. Actúa como un laboratorio analítico para modelar, simular y optimizar la toma de decisiones complejas en sistemas interconectados.'
                      : 'The Ordomachine is the interactive computational engine and simulation environment that operationally implements the theoretical framework of Ordomatics. It functions as an analytical laboratory to model, simulate, and optimize complex decision-making in interconnected systems.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {isEs ? 'Planificación Territorial e Infraestructuras' : 'Territorial Planning & Infrastructure'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {isEs
                          ? 'Optimización de recursos y servicios públicos (redes de centros de salud, hospitales comarcales, dotación escolar o parques de bomberos). Permite evaluar la equidad espacial y accesibilidad real de poblaciones rurales y urbanas (como los estudios empíricos de la tesis en León y Cuatro Valles).'
                          : 'Optimization of public resources and facilities (healthcare centers, regional hospitals, schools, fire stations). Enables assessment of spatial equity and accessibility for rural and urban populations (as in the thesis empirical studies of Leon and Cuatro Valles).'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        {isEs ? 'Simulación de Escenarios y Análisis "What-If"' : 'Scenario Simulation & "What-If" Analysis'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {isEs
                          ? 'Experimentación dinámica: ¿qué impacto territorial causará abrir un nuevo centro de salud? ¿qué ocurre si una barrera orográfica incrementa el aislamiento (bloqueo)? ¿cómo se redistribuye la atracción si se mejora una carretera reduciendo tiempos de desplazamiento?'
                          : 'Dynamic experimentation: what impact will opening a new healthcare hub have? What happens if an orographic barrier increases isolation (blocking)? How does attraction redistribute if highway upgrades reduce travel times?'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {isEs ? 'Evaluación de Rendimiento y Scoring (Ordoexpertos)' : 'Performance Scoring & Evaluation (Ordoexperts)'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {isEs
                          ? 'Modelado en dominios especializados como el deporte colectivo y la competición de alta exigencia (fútbol, automovilismo). Modela interacciones entre jugadores según toques o posiciones, evaluando el MVP sin reducir el juego a simples estadísticas individuales descontextualizadas.'
                          : 'Specialized domain modeling such as team sports and elite racing (soccer, motorsport). Models interactions between players via touches or positional adjacency, evaluating MVP performance without reducing the game to decontextualized individual statistics.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {isEs ? 'Priorización de Inversiones Multicriterio' : 'Multi-Criteria Investment Prioritization'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {isEs
                          ? 'Ranking ordenado de proyectos estratégicos en conflicto (social, medioambiental, económico) modulando la actitud del decisor mediante perfiles OWA (actitud optimista, neutra o conservadora) y matrices de afinidad interdimensional.'
                          : 'Rank ordering of conflicting strategic projects (social, environmental, economic) modulating decision-maker attitude through OWA profiles (optimistic, neutral, conservative) and interdimensional affinity matrices.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* TARJETA 4: ¿QUÉ DEBO TENER EN CUENTA PARA USAR LA ORDOMÁQUINA? */}
          <section id="sec-guide" className="scroll-mt-8 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Sliders className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {isEs
                        ? '¿Qué debo tener en cuenta para usar la ordomáquina?'
                        : 'What should I consider when using the Ordomachine?'}
                    </h2>
                  </div>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleCard('guide')}
                  title={collapsedCards['guide'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  aria-label={collapsedCards['guide'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                >
                  {collapsedCards['guide'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              }
            >
              {!collapsedCards['guide'] && (
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  
                  {/* NATURALEZA DEL VALOR DE ENTRADA */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEs ? 'Identificar la Naturaleza de los Datos de Entrada' : 'Identify the Nature of Input Data'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {isEs
                        ? 'Antes de iniciar cualquier análisis en la Ordomáquina, debe determinarse rigurosamente si los datos empíricos disponibles corresponden a:'
                        : 'Before configuring any model in the Ordomachine, you must determine whether your empirical input values represent:'}
                    </p>
                    <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
                      <li>
                        <strong>{isEs ? 'Entrada como Valor Propio (' : 'Input as Proper Value ('}<i>V</i><sup>P</sup>{'): '}</strong>
                        {isEs
                          ? 'Mediciones intrínsecas de partida (presupuesto asignado, camas hospitalarias físicas, minutos jugados). En este caso, la máquina calcula de forma directa cómo ese valor se difunde hacia el entorno ('
                          : 'Intrinsic baseline inputs (allocated budget, physical beds, minutes played). The machine directly computes how this value propagates to surroundings ('}
                        <i>V</i><sup>C</sup> = <i>V</i><sup>P</sup> · <i>A</i><sup>C</sup>{').'}
                      </li>
                      <li>
                        <strong>{isEs ? 'Entrada como Valor Contextual (' : 'Input as Contextual Value ('}<i>V</i><sup>C</sup>{'): '}</strong>
                        {isEs
                          ? 'Mediciones efectivas resultantes de la interacción contextual (usuarios atendidos de toda la comarca, interacciones efectivas). En este caso, se selecciona el modo de cálculo inverso ('
                          : 'Effective observations resulting from contextual interaction (patients attended across the region, actual touches). The inverse calculation mode is selected ('}
                        <i>V</i><sup>P</sup> = <i>V</i><sup>C</sup> · (<i>A</i><sup>C</sup>)<sup>−1</sup>
                        {isEs
                          ? ') para desvelar el potencial propio latente de cada elemento.'
                          : ') to reveal latent proper capacity.'}
                      </li>
                    </ul>
                  </div>

                  {/* MODELADO DE AFINIDADES Y SUS NIVELES */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEs ? 'Modelado de las Relaciones de Afinidad y sus Niveles' : 'Modeling Affinity Relationships and their Levels'}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/70 space-y-1.5">
                        <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">{isEs ? 'Nivel Topológico / Métrico' : 'Topological / Metric Level'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Definir distancias geográficas reales (km o minutos en carretera), espaciales o de interacción. Seleccionar la función de propagación (triangular para decaimiento continuo, rectangular para áreas estrictas, trapezoidal con meseta o sinusoidal suave).'
                            : 'Define real distances (travel time in minutes, km, or interaction volume). Select propagation function (triangular for linear decay, rectangular for sharp gates, trapezoidal with plateau, or smooth sinusoidal).'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/70 space-y-1.5">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{isEs ? 'Nivel de Bloqueo (Autarquía)' : 'Blocking Level (Autarky)'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs ? (
                            <>
                              Asignar el vector <i>V</i><sup>B</sup>. Si un elemento está aislado por fronteras administrativas u orográficas, elevar <i>v</i><sup>b</sup><sub>i</sub> hacia 1. Si el elemento atiende y permea abiertamente a su entorno, fijar <i>v</i><sup>b</sup><sub>i</sub> próximo a 0.
                            </>
                          ) : (
                            <>
                              Assign vector <i>V</i><sup>B</sup>. If an element is physically or administratively isolated, set <i>v</i><sup>b</sup><sub>i</sub> near 1. If it freely serves its surrounding network, set <i>v</i><sup>b</sup><sub>i</sub> near 0.
                            </>
                          )}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/70 space-y-1.5">
                        <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">{isEs ? 'Nivel de Sinergia' : 'Synergy Level'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs ? (
                            <>
                              Configurar funciones o factores multiplicativos <i>k</i> cuando la interacción conjunta entre elementos produce un rendimiento superior a la suma de sus partes (clústeres económicos, sinergia deportiva).
                            </>
                          ) : (
                            <>
                              Configure functions or multiplicative factors <i>k</i> when mutual interaction produces collaborative amplification superior to the sum of parts (economic clusters, sports synergies).
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QUÉ VALOR USAR PARA AGREGACIÓN: V^CRN */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEs ? '¿Cuál de los valores es más conveniente usar para la agregación final?' : 'Which value is best suited for the final aggregation?'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {isEs
                        ? 'En la fase de agregación multicriterio, la tesis demuestra que la magnitud analítica más robusta y rigurosa para comparar alternativas es el Valor Contextual Relativo Normalizado ('
                        : 'In multi-criteria aggregation, the thesis proves that the most robust and rigorous analytical magnitude to compare alternatives is the Normalized Relative Contextual Value ('}
                      <i>V</i><sup>CRN</sup>
                      {isEs
                        ? '). Esto se debe a tres motivos fundamentales:'
                        : '), due to three fundamental reasons:'}
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 pl-2 leading-relaxed">
                      <li>
                        <strong>{isEs ? 'Efecto Red Real (Contextual): ' : 'True Network Effect (Contextual): '}</strong>
                        {isEs
                          ? 'Incorpora los flujos reales de atracción y transferencia del sistema ('
                          : 'Incorporates true system flows and attractions ('}
                        <i>V</i><sup>C</sup>
                        {isEs
                          ? '), superando la visión miope del valor propio estático.'
                          : '), surpassing static proper value myopia.'}
                      </li>
                      <li>
                        <strong>{isEs ? 'Neutralización del Sesgo de Escala (Relativo): ' : 'Scale Bias Neutralization (Relative): '}</strong>
                        {isEs
                          ? 'Al ponderarse frente a la dimensión de soporte o población ('
                          : 'Weighted against a baseline contrast dimension such as population ('}
                        <i>V</i><sup>CR</sup> = <i>V</i><sup>C</sup> / Pop
                        {isEs
                          ? '), se evalúa la intensidad o eficiencia real de servicio, no el mero volumen absoluto.'
                          : '), measuring genuine intensity or service efficiency rather than raw size.'}
                      </li>
                      <li>
                        <strong>{isEs ? 'Conmensurabilidad Interdimensional (Normalizado): ' : 'Interdimensional Commensurability (Normalized): '}</strong>
                        {isEs
                          ? 'Al acotarse a [0, 1] mediante equiparación (por máximo o por objetivo), se pueden agregar legítimamente criterios con unidades físicas incompatibles (euros, camas, minutos, puntos).'
                          : 'By mapping values into [0, 1] through equalization (by max or target), criteria with disparate physical units (euros, beds, minutes, scores) can be legitimately aggregated.'}
                      </li>
                    </ol>
                  </div>

                  {/* AFINIDAD ENTRE DIMENSIONES Y PESOS OWA */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEs ? 'Correlación de Afinidad entre Criterios y el Perfil de Pesos OWA' : 'Criteria Affinity Correlation and OWA Weight Profile'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {isEs ? (
                        <>
                          Es crucial calibrar la matriz de afinidad entre criterios <i>C</i>′ para evitar duplicar el peso de dimensiones redundantes. Por otra parte, el vector de pesos OWA define la actitud estratégica del decisor:
                        </>
                      ) : (
                        <>
                          It is critical to calibrate the criteria affinity matrix <i>C</i>′ to avoid over-weighting redundant dimensions. Meanwhile, the OWA weight vector defines the strategic attitude of the decision maker:
                        </>
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
                        <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">{isEs ? 'Actitud Optimista (Orness > 0.5)' : 'Optimistic Attitude (Orness > 0.5)'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Los pesos se concentran en las mejores puntuaciones de cada alternativa, premiando la excelencia en fortalezas específicas.'
                            : 'Weights concentrate on top scores of each alternative, rewarding excellence in specific strengths.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{isEs ? 'Actitud Neutra (Orness = 0.5)' : 'Neutral Attitude (Orness = 0.5)'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Pesos homogéneos o equilibrados, equivalente al promedio ponderado clásico donde cada orden tiene igual importancia.'
                            : 'Homogeneous or balanced weights, equivalent to classical weighted average where each rank position carries equal weight.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-1.5">
                        <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">{isEs ? 'Actitud Conservadora (Orness < 0.5)' : 'Conservative Attitude (Orness < 0.5)'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {isEs
                            ? 'Los pesos se concentran en las peores puntuaciones. Exige solvencia homogénea en todos los criterios y penaliza carencias críticas.'
                            : 'Weights concentrate on lowest scores. Demands balanced performance across all criteria and penalizes critical deficiencies.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CATÁLOGO COMPLETO DE PARÁMETROS CONFIGURABLES */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEs ? 'Catálogo de Parámetros Configurables en la Ordomáquina' : 'Configurable Parameters Catalog in the Ordomachine'}</span>
                    </h3>
                    
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold">
                            <th className="py-2.5 px-3">{isEs ? 'Parámetro / Elemento' : 'Parameter / Element'}</th>
                            <th className="py-2.5 px-3">{isEs ? 'Símbolo' : 'Symbol'}</th>
                            <th className="py-2.5 px-3">{isEs ? 'Fase' : 'Phase'}</th>
                            <th className="py-2.5 px-3">{isEs ? 'Descripción y Efecto en el Modelo' : 'Description & Model Impact'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Alternativas / Elementos' : 'Alternatives / Elements'}</td>
                            <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400"><i>E</i> = &#123;<i>e</i><sub>1</sub>, ..., <i>e</i><sub>n</sub>&#125;</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs">Fase 01</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Conjunto finito de entidades a evaluar, comparar u ordenar.' : 'Finite set of entities to evaluate, compare, or rank.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Dimensiones / Características' : 'Dimensions / Characteristics'}</td>
                            <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400"><i>C</i> = &#123;<i>c</i><sub>1</sub>, ..., <i>c</i><sub>m</sub>&#125;</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs">Fase 01</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Criterios cuantitativos, cualitativos o informativos de evaluación.' : 'Quantitative, qualitative, or informative evaluation criteria.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Modo de Sentido de Cálculo' : 'Calculation Direction Mode'}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400">Directo / Inverso</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">Fase 02</span></td>
                            <td className="py-2.5 px-3">
                              {isEs ? 'Determina si la entrada empírica es ' : 'Determines whether empirical input is '}
                              <i>V</i><sup>P</sup>
                              {isEs ? ' (directo a ' : ' (direct to '}
                              <i>V</i><sup>C</sup>
                              {isEs ? ') o si es ' : ') or '}
                              <i>V</i><sup>C</sup>
                              {isEs ? ' (inverso a ' : ' (inverse to '}
                              <i>V</i><sup>P</sup>{').'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Matriz de Distancias' : 'Distance Matrix'}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400"><i>D</i> = [<i>d</i><sub>ij</sub>]</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">Fase 02</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Métrica de separación espacial, temporal (minutos), o funcional entre alternativas.' : 'Spatial, temporal (minutes), or functional separation metric between alternatives.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Función de Propagación y Límite L' : 'Propagation Function & Limit L'}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400"><i>F</i><sub>P</sub>, <i>L</i>, <i>L</i><sub>1</sub></td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">Fase 02</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Modela el decaimiento de afinidad con la distancia (triangular, trapezoidal, sinusoidal, etc.).' : 'Models affinity decay with distance (triangular, trapezoidal, sinusoidal, etc.).'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Vector de Bloqueo' : 'Blocking Vector'}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400"><i>V</i><sup>B</sup> = (<i>v</i><sup>b</sup><sub>1</sub>, ..., <i>v</i><sup>b</sup><sub>n</sub>)</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">Fase 02</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Grado de autarquía [0, 1] que retiene el valor propio o permite su difusión conservativa.' : 'Autarky degree [0, 1] retaining proper value or allowing conservative flow diffusion.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Función de Sinergia y Factor k' : 'Synergy Function & Factor k'}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400"><i>F</i><sub>S</sub>, <i>k</i></td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">Fase 02</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Amplifica o atenúa multiplicativamente la interacción entre alternativas distintas.' : 'Multiplicatively amplifies or dampens interaction between distinct alternatives.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Ajuste Relativo' : 'Relative Adjustment'}</td>
                            <td className="py-2.5 px-3 font-mono text-purple-600 dark:text-purple-400"><i>c</i><sup>a</sup><sub>i</sub>, <i>V</i><sup>CR</sup></td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs">Fase 03</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Ponderación frente a dimensión de contraste (población, superficie, etc.).' : 'Weighting relative to a contrast dimension (population, area, etc.).'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Equiparación Interdimensional' : 'Interdimensional Equalization'}</td>
                            <td className="py-2.5 px-3 font-mono text-purple-600 dark:text-purple-400"><i>c</i><sup>n</sup>, <i>V</i><sup>CRN</sup></td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs">Fase 03</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Normalización [0, 1] por Máximo, por Suma o por Objetivo (Target).' : 'Normalization onto [0, 1] by Maximum, by Sum, or by Target Objective.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Matriz de Afinidad de Criterios' : 'Criteria Affinity Matrix'}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400"><i>C</i>′ = [<i>c</i>′<sub>kl</sub>]</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">Fase 04</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Grado de correlación semántica entre dimensiones para redistribuir pesos.' : 'Semantic correlation degree between dimensions to redistribute weights.'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{isEs ? 'Vector de Pesos OWA' : 'OWA Weight Vector'}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400"><i>W</i> = (<i>w</i><sub>1</sub>, ..., <i>w</i><sub>m</sub>)</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">Fase 04</span></td>
                            <td className="py-2.5 px-3">{isEs ? 'Gradúa la actitud del decisor (optimismo/conservadurismo) en la agregación ordenada.' : 'Sets decision-maker attitude (optimism/conservatism) in ordered aggregation.'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Botón de cierre en la tarjeta 4 con espaciado vertical simétrico */}
                  {onNavigateToOrdomachine && (
                    <div className="py-6 flex justify-center">
                      <button
                        type="button"
                        onClick={onNavigateToOrdomachine}
                        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all cursor-pointer group"
                      >
                        <Cpu className="w-5 h-5" />
                        <span>{isEs ? 'Comenzar a Trabajar con la Ordomáquina' : 'Start Working with the Ordomachine'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}

                </div>
              )}
            </Card>
          </section>

          {/* TARJETA 5: ¿CÓMO PUEDO PERSONALIZAR LAS FUNCIONES EN LA ORDOMÁQUINA? */}
          <section id="sec-custom-functions" className="scroll-mt-8 space-y-6">
            <Card
              title={
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Code2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {isEs
                        ? '¿Cómo puedo personalizar las funciones en la ordomáquina?'
                        : 'How can I customize functions in the Ordomachine?'}
                    </h2>
                  </div>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => toggleCard('custom-functions')}
                  title={collapsedCards['custom-functions'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  aria-label={collapsedCards['custom-functions'] ? (isEs ? 'Desplegar tarjeta' : 'Expand card') : (isEs ? 'Colapsar tarjeta' : 'Collapse card')}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                >
                  {collapsedCards['custom-functions'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              }
            >
              {!collapsedCards['custom-functions'] && (
                <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  
                  {/* Introducción a Math.js y enlace a docs oficiales */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                      {isEs
                        ? 'El motor de cálculo de la ordomáquina incorpora un evaluador algebraico basado en la sintaxis estándar de Math.js. Esta notación permite definir libremente funciones personalizadas de propagación, bloqueo, sinergia, ajuste relativo y equiparación de forma flexible, intuitiva y universal.'
                        : 'The Ordomachine calculation engine incorporates an algebraic evaluator based on standard Math.js syntax. This notation enables freely defining custom functions for propagation, blocking, synergy, relative adjustment, and equalization in a flexible, intuitive, and universal manner.'}
                    </p>
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

                  {/* Subsección 1: Reglas Sintácticas y Operadores Permitidos */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{isEs ? 'Sintaxis Estándar y Operadores Permitidos' : 'Standard Syntax & Allowed Operators'}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Operadores Aritméticos */}
                      <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-sm">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {isEs ? 'Operadores Aritméticos' : 'Arithmetic Operators'}
                        </div>
                        <ul className="space-y-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="text-blue-600 dark:text-blue-400 font-bold">+</code> : {isEs ? 'Suma (a + b)' : 'Addition (a + b)'}</li>
                          <li><code className="text-blue-600 dark:text-blue-400 font-bold">-</code> : {isEs ? 'Resta (a - b)' : 'Subtraction (a - b)'}</li>
                          <li><code className="text-blue-600 dark:text-blue-400 font-bold">*</code> : {isEs ? 'Multiplicación (a * b)' : 'Multiplication (a * b)'}</li>
                          <li><code className="text-blue-600 dark:text-blue-400 font-bold">/</code> : {isEs ? 'División (a / b)' : 'Division (a / b)'}</li>
                          <li><code className="text-blue-600 dark:text-blue-400 font-bold">^</code> : {isEs ? 'Potencia (d ^ 2)' : 'Power (d ^ 2)'}</li>
                          <li><code className="text-blue-600 dark:text-blue-400 font-bold">%</code> : {isEs ? 'Módulo (a % b)' : 'Modulo (a % b)'}</li>
                        </ul>
                      </div>

                      {/* Relacionales y Lógicos */}
                      <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-sm">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {isEs ? 'Relacionales y Lógicos' : 'Relational & Logical'}
                        </div>
                        <ul className="space-y-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">&lt;, &lt;=</code> : {isEs ? 'Menor, menor o igual' : 'Less than, less equal'}</li>
                          <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">&gt;, &gt;=</code> : {isEs ? 'Mayor, mayor o igual' : 'Greater than, greater equal'}</li>
                          <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">==, !=</code> : {isEs ? 'Igualdad, desigualdad' : 'Equality, inequality'}</li>
                          <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">and, &&</code> : {isEs ? 'Conjunción lógica' : 'Logical AND'}</li>
                          <li><code className="text-indigo-600 dark:text-indigo-400 font-bold">or, ||</code> : {isEs ? 'Disyunción lógica' : 'Logical OR'}</li>
                        </ul>
                      </div>

                      {/* Condicional Ternario */}
                      <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-sm">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          {isEs ? 'Condicional Ternario' : 'Ternary Conditional'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {isEs ? 'Estructura condicional compacta:' : 'Compact conditional structure:'}
                        </p>
                        <div className="p-2 rounded bg-white dark:bg-gray-900 font-mono text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60 font-bold">
                          cond ? val_si : val_no
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          d &lt;= L ? 1 : 0
                        </p>
                      </div>

                      {/* Funciones y Constantes */}
                      <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 space-y-2">
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {isEs ? 'Funciones y Constantes' : 'Functions & Constants'}
                        </div>
                        <ul className="space-y-1 font-mono text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">min(a, b), max(a, b)</code></li>
                          <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">exp(x), log(x), sqrt(x)</code></li>
                          <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">sin(x), cos(x), abs(x)</code></li>
                          <li><code className="text-emerald-600 dark:text-emerald-400 font-bold">pi</code> (π), <code className="text-emerald-600 dark:text-emerald-400 font-bold">e</code> (Euler)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Subsección 2: Glosario de Variables y Términos */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{isEs ? 'Glosario de Variables Contextuales del Ámbito de Cálculo' : 'Contextual Scope Variables Glossary'}</span>
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {isEs
                        ? 'Al escribir fórmulas personalizadas en los selectores de funciones, dispones de los siguientes identificadores y variables contextuales evaluables:'
                        : 'When writing custom formulas in function selectors, the following identifiers and contextual variables are available in the evaluation scope:'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Propagación */}
                      <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 space-y-2">
                        <div className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                          {isEs ? 'Ámbito de Propagación' : 'Propagation Scope'}
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="font-bold text-purple-600 dark:text-purple-400">d</code> o <code className="font-bold text-purple-600 dark:text-purple-400">dist</code>: {isEs ? 'Distancia observada entre alternativas i y j (d_ij).' : 'Observed distance between alternatives i and j (d_ij).'}</li>
                          <li><code className="font-bold text-purple-600 dark:text-purple-400">L</code> o <code className="font-bold text-purple-600 dark:text-purple-400">max_d</code>: {isEs ? 'Distancia máxima o radio límite de alcance L.' : 'Maximum distance or threshold range limit L.'}</li>
                          <li><code className="font-bold text-purple-600 dark:text-purple-400">L1</code>: {isEs ? 'Primer radio límite de alcance en función trapezoidal.' : 'First threshold range limit in trapezoidal function.'}</li>
                          <li><code className="font-bold text-purple-600 dark:text-purple-400">i</code>, <code className="font-bold text-purple-600 dark:text-purple-400">j</code>: {isEs ? 'Índices numéricos de fila y columna.' : 'Row and column alternative indices.'}</li>
                        </ul>
                      </div>

                      {/* Bloqueo */}
                      <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2">
                        <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                          {isEs ? 'Ámbito de Bloqueo' : 'Blocking Scope'}
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="font-bold text-amber-600 dark:text-amber-400">a</code>: {isEs ? 'Afinidad propagada a_ij previa.' : 'Previous propagated affinity a_ij.'}</li>
                          <li><code className="font-bold text-amber-600 dark:text-amber-400">S</code> o <code className="font-bold text-amber-600 dark:text-amber-400">sum</code>: {isEs ? 'Suma de afinidades de la fila i (S_i = ∑_k a_ik).' : 'Row i affinity sum (S_i = ∑_k a_ik).'}</li>
                          <li><code className="font-bold text-amber-600 dark:text-amber-400">vb</code>: {isEs ? 'Factor de bloqueo de la alternativa i (v_i^b).' : 'Blocking factor of alternative i (v_i^b).'}</li>
                          <li><code className="font-bold text-amber-600 dark:text-amber-400">theta</code> o <code className="font-bold text-amber-600 dark:text-amber-400">umbral</code>: {isEs ? 'Umbral de corte de afinidad (θ).' : 'Cutoff affinity threshold (θ).'}</li>
                        </ul>
                      </div>

                      {/* Sinergia */}
                      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-2">
                        <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                          {isEs ? 'Ámbito de Sinergia' : 'Synergy Scope'}
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="font-bold text-blue-600 dark:text-blue-400">a</code>: {isEs ? 'Afinidad autoinducida previa (a^a_ij).' : 'Previous autoinduced affinity (a^a_ij).'}</li>
                          <li><code className="font-bold text-blue-600 dark:text-blue-400">k</code>: {isEs ? 'Factor multiplicador de sinergia grupal (k ≥ 0).' : 'Synergy multiplier factor (k ≥ 0).'}</li>
                          <li><code className="font-bold text-blue-600 dark:text-blue-400">i</code>, <code className="font-bold text-blue-600 dark:text-blue-400">j</code>: {isEs ? 'Índices de fila y columna.' : 'Row and column indices.'}</li>
                        </ul>
                      </div>

                      {/* Ajuste Relativo */}
                      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                        <div className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                          {isEs ? 'Ámbito de Ajuste Relativo' : 'Relative Adjustment Scope'}
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="font-bold text-indigo-600 dark:text-indigo-400">vc</code>: {isEs ? 'Valor contextual de la alternativa (V^C_i).' : 'Contextual value of alternative (V^C_i).'}</li>
                          <li><code className="font-bold text-indigo-600 dark:text-indigo-400">pop</code> o <code className="font-bold text-indigo-600 dark:text-indigo-400">v_pop</code>: {isEs ? 'Valor de contraste o población de referencia.' : 'Contrast dimension or population value.'}</li>
                          <li><code className="font-bold text-indigo-600 dark:text-indigo-400">ca</code>: {isEs ? 'Factor ponderador de contraste (c_a = 1 / pop).' : 'Relative contrast factor (c_a = 1 / pop).'}</li>
                        </ul>
                      </div>

                      {/* Equiparación */}
                      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                          {isEs ? 'Ámbito de Equiparación' : 'Equalization Scope'}
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <li><code className="font-bold text-emerald-600 dark:text-emerald-400">vcr</code>: {isEs ? 'Valor relativo previo de la alternativa (V^CR_i).' : 'Previous relative value (V^CR_i).'}</li>
                          <li><code className="font-bold text-emerald-600 dark:text-emerald-400">max_vcr</code>: {isEs ? 'Valor relativo máximo registrado (c_n = 1 / max_vcr).' : 'Maximum recorded relative value (c_n = 1 / max_vcr).'}</li>
                          <li><code className="font-bold text-emerald-600 dark:text-emerald-400">obj</code>: {isEs ? 'Valor objetivo de referencia (c_n = 1 / obj).' : 'Reference target objective value (c_n = 1 / obj).'}</li>
                          <li><code className="font-bold text-emerald-600 dark:text-emerald-400">sum_vcr</code>: {isEs ? 'Suma total de valores relativos de la dimensión.' : 'Total sum of relative values in dimension.'}</li>
                        </ul>
                      </div>

                      {/* Notación de Matrices */}
                      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {isEs ? 'Notación de Matrices y Vectores' : 'Matrices & Vectors Notation'}
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <li><strong className="text-amber-600 dark:text-amber-400"><i>D</i></strong>: {isEs ? 'Matriz de distancias o costes entre alternativas.' : 'Distance or cost matrix between alternatives.'}</li>
                          <li><strong className="text-blue-600 dark:text-blue-400"><i>A</i></strong>, <strong className="text-purple-600 dark:text-purple-400"><i>A</i><sup>A</sup></strong>, <strong className="text-purple-600 dark:text-purple-400"><i>A</i><sup>C</sup></strong>: {isEs ? 'Matrices de afinidad inicial, autoinducida y contextual.' : 'Initial, autoinduced, and contextual affinity matrices.'}</li>
                          <li><strong className="text-emerald-600 dark:text-emerald-400"><i>C</i>′</strong>: {isEs ? 'Matriz de afinidad interdimensional entre criterios.' : 'Interdimensional criteria affinity matrix.'}</li>
                          <li><strong className="text-indigo-600 dark:text-indigo-400"><i>V</i><sup>P</sup></strong>, <strong className="text-indigo-600 dark:text-indigo-400"><i>V</i><sup>C</sup></strong>, <strong className="text-indigo-600 dark:text-indigo-400"><i>V</i><sup>CRN</sup></strong>: {isEs ? 'Vectores de valores propios, contextuales y normalizados.' : 'Proper, contextual, and normalized value vectors.'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Subsección 3: Catálogo de Funciones Predeterminadas (sin columna de descripción) */}
                  <div className="space-y-3 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{isEs ? 'Catálogo de Funciones Predeterminadas de la Tesis' : 'Thesis Default Functions Catalog'}</span>
                    </h3>
                    
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 font-semibold text-gray-600 dark:text-gray-300">
                            <th className="py-2.5 px-3">{isEs ? 'Fase / Tipo' : 'Phase / Type'}</th>
                            <th className="py-2.5 px-3">{isEs ? 'Opción' : 'Option'}</th>
                            <th className="py-2.5 px-3">{isEs ? 'Formulación Matemática' : 'Mathematical Formulation'}</th>
                            <th className="py-2.5 px-3">{isEs ? 'Sintaxis Math.js' : 'Math.js Syntax'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                          {formulasList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {item.category}
                              </td>
                              <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">
                                {item.mathHtml}
                              </td>
                              <td className="py-2.5 px-3">
                                <code className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-mono text-[11px] font-bold select-all">
                                  {item.syntax}
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Subsección 4: Probador Interactivo de Funciones */}
                  <div className="space-y-4 pt-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isEs ? 'Probador Interactivo de Funciones en Tiempo Real' : 'Real-Time Interactive Function Tester'}</span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {isEs
                        ? 'Evalúa en tiempo real cualquier fórmula personalizada antes de ingresarla en la configuración de la ordomáquina o en los flavours especializados:'
                        : 'Test any custom formula in real-time before entering it into the Ordomachine or specialized flavour configuration:'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-xs">
                          {isEs ? 'Expresión Matemática (Math.js):' : 'Mathematical Expression (Math.js):'}
                        </label>
                        <input
                          type="text"
                          value={testExpr}
                          onChange={e => setTestExpr(e.target.value)}
                          placeholder="max(0, 1 - (d / L))"
                          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-sm text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-xs">
                          {isEs ? 'Variables de Prueba (clave = valor, ...):' : 'Test Scope Variables (key = val, ...):'}
                        </label>
                        <input
                          type="text"
                          value={testVariables}
                          onChange={e => setTestVariables(e.target.value)}
                          placeholder="d = 4, L = 10"
                          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Salida del Resultado */}
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {evalResult.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                            {evalResult.isValid
                              ? isEs ? 'Evaluación Exitosa:' : 'Successful Evaluation:'
                              : isEs ? 'Error en la Sintaxis o Variable no definida' : 'Syntax Error or Undefined Variable'}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
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

                </div>
              )}
            </Card>
          </section>

          {/* Persistent Author & Intellectual Property Footer */}
          <AppFooter />
        </div>
      </main>
    </div>
  );
};
