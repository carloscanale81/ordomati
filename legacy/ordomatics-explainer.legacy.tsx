import React, { useState, useMemo, useRef } from 'react';
import { Settings, ChevronLeft, ChevronRight, Download, Upload, Plus, Trash2, ArrowRight, Activity, Network, Database, Save, FileJson } from 'lucide-react';

// --- UI Components ---
const Formula = ({ children }) => (
  <span className="font-serif italic text-blue-800 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/50 mx-1 whitespace-nowrap">
    {children}
  </span>
);

const Card = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
    <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-blue-600" />}
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-4 flex-1">
      {children}
    </div>
  </div>
);

const MatrixEditor = ({ data, onChange, rows, cols, readOnly = false }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm border-collapse bg-white">
        <thead>
          <tr>
            <th className="p-2 border-b border-r border-gray-200 bg-gray-50"></th>
            {cols.map((c, i) => (
              <th key={i} className="p-2 border-b border-l border-gray-200 bg-gray-50 font-medium text-gray-600 min-w-[3rem]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th className="p-2 border-t border-r border-gray-200 bg-gray-50 font-medium text-gray-600">
                {rows[i]}
              </th>
              {row.map((val, j) => (
                <td key={j} className="p-0 border border-gray-100">
                  {readOnly ? (
                    <div className={`p-2 text-center tabular-nums ${val > 0.001 ? 'bg-blue-50/30 font-medium text-blue-900' : 'text-gray-400'}`}>
                      {Number.isFinite(val) ? val.toFixed(2) : '-'}
                    </div>
                  ) : (
                    <input 
                      type="number" step="any" value={val} 
                      onChange={e => onChange(i, j, parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-center tabular-nums focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 transition-colors" 
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ValueFlowGraph = ({ elements, AC }) => {
  const n = elements.length;
  const cx = 150, cy = 150, r = 100;
  
  const nodes = elements.map((el, i) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2;
    return { id: i, label: el, x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
  });

  const edges = [];
  AC.forEach((row, i) => {
    row.forEach((val, j) => {
      if (i !== j && val > 0.01) {
         edges.push({ source: nodes[i], target: nodes[j], val });
      }
    });
  });

  return (
    <div className="w-full aspect-square max-w-sm mx-auto bg-gray-50/50 rounded-xl border border-gray-100 p-4">
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="currentColor" />
          </marker>
        </defs>
        {edges.map((edge, idx) => {
          const dx = edge.target.x - edge.source.x;
          const dy = edge.target.y - edge.source.y;
          const len = Math.sqrt(dx*dx + dy*dy);
          if (len === 0) return null;

          const ux = dx/len, uy = dy/len;
          const nx = -uy, ny = ux;
          
          const curveOffset = 25; 
          const controlX = edge.source.x + dx/2 + nx * curveOffset;
          const controlY = edge.source.y + dy/2 + ny * curveOffset;
          
          const startDx = controlX - edge.source.x;
          const startDy = controlY - edge.source.y;
          const startLen = Math.sqrt(startDx*startDx + startDy*startDy);
          const startX = edge.source.x + (startDx/startLen) * 18;
          const startY = edge.source.y + (startDy/startLen) * 18;

          const endDx = controlX - edge.target.x;
          const endDy = controlY - edge.target.y;
          const endLen = Math.sqrt(endDx*endDx + endDy*endDy);
          const endX = edge.target.x + (endDx/endLen) * 22; 
          const endY = edge.target.y + (endDy/endLen) * 22;

          const intensity = Math.round(200 * (1 - edge.val)); 
          const color = `rgb(${intensity},${intensity},${intensity})`;
          
          return (
            <path 
              key={idx} 
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke={color} 
              strokeWidth={1 + edge.val * 3} 
              markerEnd="url(#arrowhead)" 
              opacity={0.4 + edge.val * 0.6} 
              className="transition-all duration-300"
            />
          )
        })}
        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x},${node.y})`} className="transition-transform duration-300">
            <circle r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" className="shadow-sm" />
            <text textAnchor="middle" dy="4" fontSize="13" fontWeight="600" fill="#1e293b" className="font-sans">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// --- Main Application ---
export default function OrdomaticaApp() {
  // --- STATE ---
  const [elements, setElements] = useState(['A', 'B', 'C', 'D']);
  const [characteristics, setCharacteristics] = useState([
    {
      id: 1, name: 'C1', type: 'cuantitativa',
      min: 0, max: 100, g: 5,
      rawInputs: ['35', '[40,46]', '28', '60'],
      d: [[0,13,4,20],[13,0,7,34],[4,7,0,2],[20,34,2,0]],
      vb: [1, 0, 0.2, 0.5],
      prop: { type: 'triangular', limit: 10, l1: 5 },
      syn: { type: 'ninguna', k: 1 },
      adj: { byPop: -1, normType: 'maximo', obj: 1 }
    },
    {
      id: 2, name: 'C2', type: 'cualitativa',
      min: 0, max: 100, g: 5,
      rawInputs: ['MB', '(A, -0.2)', 'B', 'M; (MA, -0.1)'],
      d: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
      vb: [0, 0, 0, 0],
      prop: { type: 'triangular', limit: 10, l1: 5 },
      syn: { type: 'ninguna', k: 1 },
      adj: { byPop: -1, normType: 'maximo', obj: 1 }
    }
  ]);
  const [cMatrix, setCMatrix] = useState([[1, 0.3], [0.3, 1]]);
  const [owa, setOwa] = useState([1, 0.9]);

  const [activePhase, setActivePhase] = useState(0); // 0 = Configuración, 1 = Análisis Característico, 2 = Análisis Agregación
  const [activeCharIdx, setActiveCharIdx] = useState(0);

  // Import/Export State
  const defaultDataOptions = {
    elementNames: true, charNames: true, rawInputs: true, distances: true,
    propConfig: true, blockVectors: true, synConfig: true, adjParams: true,
    owaWeights: true, corrMatrix: true
  };
  
  const [exportOptions, setExportOptions] = useState(defaultDataOptions);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [importOptions, setImportOptions] = useState(defaultDataOptions);
  const fileInputRef = useRef(null);

  // --- DATA MANAGEMENT HANDLERS ---
  const handleExport = () => {
    const data = {};
    if (exportOptions.elementNames) data.elements = elements;
    
    const exportAnyChar = exportOptions.charNames || exportOptions.rawInputs || exportOptions.distances || exportOptions.propConfig || exportOptions.blockVectors || exportOptions.synConfig || exportOptions.adjParams;
    
    if (exportAnyChar) {
      data.characteristics = characteristics.map(c => {
        const out = { id: c.id };
        if (exportOptions.charNames) {
          out.name = c.name;
          out.type = c.type;
          out.min = c.min;
          out.max = c.max;
          out.g = c.g;
        }
        if (exportOptions.rawInputs) out.rawInputs = c.rawInputs;
        if (exportOptions.distances) out.d = c.d;
        if (exportOptions.propConfig) out.prop = c.prop;
        if (exportOptions.blockVectors) out.vb = c.vb;
        if (exportOptions.synConfig) out.syn = c.syn;
        if (exportOptions.adjParams) out.adj = c.adj;
        return out;
      });
    }

    if (exportOptions.corrMatrix) data.cMatrix = cMatrix;
    if (exportOptions.owaWeights) data.owa = owa;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ordomatica_export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setPendingImportData(data);
        
        // Auto-check available options based on fine-grained fields
        setImportOptions({
          elementNames: !!data.elements,
          charNames: !!data.characteristics?.some(c => c.name),
          rawInputs: !!data.characteristics?.some(c => c.rawInputs),
          distances: !!data.characteristics?.some(c => c.d),
          propConfig: !!data.characteristics?.some(c => c.prop),
          blockVectors: !!data.characteristics?.some(c => c.vb),
          synConfig: !!data.characteristics?.some(c => c.syn),
          adjParams: !!data.characteristics?.some(c => c.adj),
          owaWeights: !!data.owa,
          corrMatrix: !!data.cMatrix
        });
      } catch (err) {
        alert("Error al leer el archivo JSON.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const executeImport = () => {
    if (!pendingImportData) return;
    const data = pendingImportData;
    
    let newElements = [...elements];
    if (importOptions.elementNames && data.elements) {
      newElements = data.elements;
      setElements(newElements);
    }
    
    const n = newElements.length;

    // Safe resizers to prevent crashes on mismatching matrix sizes
    const resizeArr = (arr, size, def) => {
      const res = [...(arr || [])];
      while (res.length < size) res.push(def);
      return res.slice(0, size);
    };
    const resizeMat = (mat, size, def) => {
      const res = resizeArr(mat, size, []);
      return res.map(row => resizeArr(row, size, def));
    };

    let newChars = [...characteristics];

    if (data.characteristics) {
      if (importOptions.charNames) {
        newChars = data.characteristics.map((c, i) => {
          const existing = characteristics[i] || {
            id: Date.now() + i, name: `C${i+1}`, type: 'cuantitativa', min: 0, max: 100, g: 5,
            rawInputs: Array(n).fill(''), d: resizeMat([], n, 0), vb: Array(n).fill(0),
            prop: { type: 'triangular', limit: 10, l1: 5 }, syn: { type: 'ninguna', k: 1 }, adj: { byPop: -1, normType: 'maximo', obj: 1 }
          };
          return {
            ...existing,
            name: c.name || existing.name,
            type: c.type || existing.type,
            min: c.min !== undefined ? c.min : existing.min,
            max: c.max !== undefined ? c.max : existing.max,
            g: c.g !== undefined ? c.g : existing.g,
          };
        });
      }

      newChars = newChars.map((existing, i) => {
        const importedC = data.characteristics[i] || {};
        const out = { ...existing };
        
        if (importOptions.rawInputs && importedC.rawInputs) {
          out.rawInputs = resizeArr(importedC.rawInputs, n, '');
        } else {
          out.rawInputs = resizeArr(existing.rawInputs, n, '');
        }
        
        if (importOptions.distances && importedC.d) {
          out.d = resizeMat(importedC.d, n, 0);
        } else {
          out.d = resizeMat(existing.d, n, 0);
        }
        
        if (importOptions.blockVectors && importedC.vb) {
          out.vb = resizeArr(importedC.vb, n, 0);
        } else {
          out.vb = resizeArr(existing.vb, n, 0);
        }

        if (importOptions.propConfig && importedC.prop) out.prop = importedC.prop;
        if (importOptions.synConfig && importedC.syn) out.syn = importedC.syn;
        if (importOptions.adjParams && importedC.adj) out.adj = importedC.adj;

        return out;
      });
      setCharacteristics(newChars);
    }

    const m = newChars.length;

    if (importOptions.corrMatrix && data.cMatrix) {
      setCMatrix(resizeMat(data.cMatrix, m, 0));
    } else {
      setCMatrix(resizeMat(cMatrix, m, 0));
    }

    if (importOptions.owaWeights && data.owa) {
      setOwa(resizeArr(data.owa, m, 0.5));
    } else {
      setOwa(resizeArr(owa, m, 0.5));
    }
    
    setPendingImportData(null);
  };


  // --- STATE HANDLERS ---
  const handleAddElement = () => {
    const n = elements.length;
    const newName = String.fromCharCode(65 + n); // A, B, C...
    setElements([...elements, newName]);
    
    setCharacteristics(characteristics.map(char => ({
      ...char,
      rawInputs: [...(char.rawInputs || []), ''],
      vb: [...char.vb, 0],
      d: [...char.d.map(r => [...r, 0]), Array(n + 1).fill(0)]
    })));
  };

  const handleEditElement = (idx, newName) => {
    const newElements = [...elements];
    newElements[idx] = newName;
    setElements(newElements);
  };

  const handleEditCharName = (idx, newName) => {
    const newChars = [...characteristics];
    newChars[idx] = { ...newChars[idx], name: newName };
    setCharacteristics(newChars);
  };

  const handleAddChar = () => {
    const n = elements.length;
    const newName = `C${characteristics.length + 1}`;
    setCharacteristics([...characteristics, {
      id: Date.now(), name: newName, type: 'cuantitativa',
      min: 0, max: 100, g: 5,
      rawInputs: Array(n).fill(''),
      d: Array(n).fill(0).map(() => Array(n).fill(0)),
      vb: Array(n).fill(0),
      prop: { type: 'triangular', limit: 10, l1: 5 },
      syn: { type: 'ninguna', k: 1 },
      adj: { byPop: -1, normType: 'maximo', obj: 1 }
    }]);
    
    setCMatrix(cMatrix.map(row => [...row, 0]).concat([Array(characteristics.length + 1).fill(0).map((_, i) => i === characteristics.length ? 1 : 0)]));
    setOwa([...owa, owa.length > 0 ? Math.max(0.1, owa[owa.length - 1] - 0.1) : 1]);
  };

  const handleRemoveChar = (idx) => {
    if (characteristics.length <= 1) return;
    setCharacteristics(characteristics.filter((_, i) => i !== idx));
    setCMatrix(cMatrix.filter((_, i) => i !== idx).map(row => row.filter((_, j) => j !== idx)));
    setOwa(owa.filter((_, i) => i !== idx));
    if (activeCharIdx >= characteristics.length - 1) setActiveCharIdx(Math.max(0, characteristics.length - 2));
  };

  const handleRemoveElement = (idx) => {
    if (elements.length <= 1) return;
    setElements(elements.filter((_, i) => i !== idx));
    setCharacteristics(characteristics.map(char => ({
      ...char,
      rawInputs: (char.rawInputs || []).filter((_, i) => i !== idx),
      vb: char.vb.filter((_, i) => i !== idx),
      d: char.d.filter((_, i) => i !== idx).map(r => r.filter((_, j) => j !== idx))
    })));
  };

  const updateActiveChar = (field, val) => {
    const newChars = [...characteristics];
    newChars[activeCharIdx] = { ...newChars[activeCharIdx], [field]: val };
    setCharacteristics(newChars);
  };

  const updateActiveCharNested = (field, nestedField, val) => {
    const newChars = [...characteristics];
    newChars[activeCharIdx] = { 
      ...newChars[activeCharIdx], 
      [field]: { ...newChars[activeCharIdx][field], [nestedField]: val } 
    };
    setCharacteristics(newChars);
  };

  // --- MATH ENGINE (REACTIVE) ---
  const calc = useMemo(() => {
    // Utilities for parsing heterogeneous data
    const getLabels = g => ({
      3: ['B','M','A'],
      5: ['MB','B','M','A','MA'],
      7: ['N','MB','B','M','A','MA','P']
    }[g] || Array.from({length: g}, (_,i)=>'s'+i));

    const getEtiquetas = n => {
      const h = 1/(n-1);
      return Array.from({length: n}, (_,k) => ({
         a: Math.max(0, (k-1)*h), b: k*h, c: k*h, d: Math.min(1, (k+1)*h)
      }));
    };

    const pertenencia = (s, v) => {
      if(v<s.a || v>s.d) return 0;
      if(v>=s.b && v<=s.c) return 1;
      return v<s.b ? (v-s.a)/(s.b-s.a) : (s.d-v)/(s.d-s.c);
    };

    const tau = (v, S) => S.map(s => pertenencia(s, v));

    const tauIntervalo = (a1, a2) => {
       const idx = a1.map((x,i) => x>0 || a2[i]>0 ? i : -1).filter(i=>i>=0);
       if(idx.length===0) return a1.map(()=>0);
       const lo = Math.min(...idx), hi = Math.max(...idx);
       return a1.map((x,i) => i<lo || i>hi ? 0 : (i>lo && i<hi) ? 1 : Math.min(1, x+a2[i]));
    };

    const phi = al => {
       const sum = al.reduce((s,a)=>s+a, 0);
       return sum === 0 ? 0 : al.reduce((s,a,i)=>s+i*a, 0) / sum;
    };

    const parse = (tok, gDef) => {
       let t = tok.trim(), g = gDef, m = t.match(/@(\d+)$/);
       if(m) { g = +m[1]; t = t.slice(0, m.index).trim(); }
       if((m = t.match(/^\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]$/))) return {t:'int', a:+m[1], b:+m[2], raw:tok};
       if(/^-?\d+(\.\d+)?$/.test(t)) return {t:'real', v:+t, raw:tok};
       let lab = t, gam = 0;
       if((m = t.match(/^\(\s*([^,]+?)\s*,\s*(-?[\d.]+)\s*\)$/))) { lab = m[1]; gam = +m[2]; }
       const N = getLabels(g);
       const i = N.findIndex(x => x.toLowerCase() === lab.toLowerCase());
       if(i < 0) return {t:'err', msg:`'${lab}' error (g=${g})`};
       return {t:'tup', i, gamma: gam, g, raw: tok, pura: lab === t};
    };

    // 1. Process Characteristics (Phase 1)
    const charsProcessed = characteristics.map(char => {
      
      // PARSE RAW INPUTS -> VP
      const parsedInputs = elements.map((_, i) => {
        const raw = char.rawInputs ? char.rawInputs[i] || '' : '';
        const tokens = raw.split(';');
        
        let sum = 0, validCount = 0;
        const tokenResults = [];
        
        const S = getEtiquetas(char.g || 5);
        const norm = (v) => Math.max(0, Math.min(1, (v - (char.min || 0)) / ((char.max || 100) - (char.min || 0))));
        const scale = (x) => (char.min || 0) + ((char.max || 100) - (char.min || 0)) * x;

        tokens.forEach(tok => {
           const cleanTok = tok.trim();
           if (!cleanTok) {
               tokenResults.push({ raw: tok, trace: 'Vacío', valid: false });
               return;
           }

           const d = parse(cleanTok, char.g || 5);
           if(d.t === 'err') { 
               tokenResults.push({ raw: tok, trace: d.msg, valid: false });
               return; 
           }

           let traceStr = "";
           let finalTokenVal = 0;

           if(char.type === 'cualitativa') {
              let beta;
              if(d.t === 'real') {
                 const x = norm(d.v);
                 const a = tau(x, S);
                 beta = phi(a);
                 traceStr = `Norm=${x.toFixed(2)} → β=${beta.toFixed(2)}`;
              } else if (d.t === 'int') {
                 const x1 = norm(d.a), x2 = norm(d.b);
                 const a1 = tau(x1, S), a2 = tau(x2, S);
                 const a = tauIntervalo(a1, a2);
                 beta = phi(a);
                 traceStr = `Norm=[${x1.toFixed(2)},${x2.toFixed(2)}] → β=${beta.toFixed(2)}`;
              } else {
                 const bp = d.i + d.gamma;
                 if(d.g === (char.g || 5)) {
                    beta = bp;
                    traceStr = `2-tupla (g=${d.g}) → β=${beta.toFixed(2)}`;
                 } else {
                    beta = bp / (d.g - 1) * ((char.g || 5) - 1);
                    traceStr = `Multigranularidad (g=${d.g}) → β=${beta.toFixed(2)}`;
                 }
              }
              finalTokenVal = beta;
              sum += beta; validCount++;
           } else {
              let lo, hi;
              if(d.t === 'real') {
                 lo = hi = d.v;
                 traceStr = `Preciso → ${d.v}`;
              } else if (d.t === 'int') {
                 lo = d.a; hi = d.b;
                 traceStr = `Intervalo [${lo},${hi}] → Prom=${((lo+hi)/2).toFixed(2)}`;
              } else {
                 if(d.pura) {
                    const sDef = getEtiquetas(d.g)[d.i];
                    const x1 = (char.sem || 'nucleo') === 'soporte' ? sDef.a : sDef.b;
                    const x2 = (char.sem || 'nucleo') === 'soporte' ? sDef.d : sDef.c;
                    lo = scale(x1); hi = scale(x2);
                    traceStr = `Etiqueta → [${lo.toFixed(2)},${hi.toFixed(2)}]`;
                 } else {
                    const x = (d.i + d.gamma) / (d.g - 1);
                    lo = hi = scale(x);
                    traceStr = `2-tupla → ${lo.toFixed(2)}`;
                 }
              }
              const mid = (lo + hi) / 2;
              finalTokenVal = mid;
              sum += mid; validCount++;
           }
           
           tokenResults.push({ raw: tok, trace: traceStr, valid: true, val: finalTokenVal });
        });

        let finalVal = 0;
        let summaryTrace = "Vacío → 0";
        if (validCount > 0) {
            if (char.type === 'cualitativa') {
                const avgBeta = sum / validCount;
                finalVal = avgBeta / ((char.g || 5) - 1);
                finalVal = Math.max(0, Math.min(1, isNaN(finalVal) ? 0 : finalVal));
                summaryTrace = `μ(β)=${avgBeta.toFixed(2)} ⇒ V^P = ${finalVal.toFixed(4)}`;
            } else {
                const avg = sum / validCount;
                finalVal = (avg - (char.min || 0)) / ((char.max || 100) - (char.min || 0));
                finalVal = Math.max(0, Math.min(1, isNaN(finalVal) ? 0 : finalVal));
                summaryTrace = `μ(val)=${avg.toFixed(2)} ⇒ Norm = ${finalVal.toFixed(4)}`;
            }
        }

        return { val: finalVal, tokens: tokenResults, summaryTrace };
      });
      const vp = parsedInputs.map(p => p.val);

      // Afinidad (A)
      const A = char.d.map(row => row.map(val => {
        if (val === 0) return 1;
        
        const l1 = char.prop.l1 || 0;
        const l2 = char.prop.limit || 1;
        
        if (char.prop.type === 'triangular') {
           return val <= l2 ? (l2 - val) / l2 : 0;
        } else if (char.prop.type === 'rectangular') {
           return val <= l2 ? 1 : 0;
        } else if (char.prop.type === 'trapezoidal') {
           return val <= l1 ? 1 : (val <= l2 ? (l2 - val) / (l2 - l1) : 0);
        } else if (char.prop.type === 'sinusoidal') {
           return val <= l2 ? 0.5 * (1 + Math.cos(Math.PI * (val / l2))) : 0;
        } else if (char.prop.type === 'inhibida') {
           return 0; // val === 0 is already handled above
        }
        
        return 0;
      }));

      // Afinidad Autoinducida (A^A)
      const AA = A.map((row, i) => {
        const S = row.reduce((acc, v) => acc + v, 0);
        if (S - 1 < 1e-12) {
          return row.map((_, j) => i === j ? 1 : 0);
        }
        const s_val = 1 - (1 - char.vb[i]) * (1 - 1 / S);
        return row.map((val, j) => i === j ? s_val : (val / (S - 1)) * (1 - s_val));
      });

      // Afinidad Contextual (A^C)
      const AC = AA.map((row, i) => 
        row.map((val, j) => {
          if (i === j) return val;
          return char.syn.type === 'factor' ? Math.max(0, val * char.syn.k) : val;
        })
      );

      // Valor Contextual (V^C = V^P * A^C)
      const VC = elements.map((_, j) => 
        elements.reduce((sum, _, k) => sum + vp[k] * AC[k][j], 0)
      );

      return { parsedInputs, vp, A, AA, AC, VC };
    });

    // 2. Adjustment & Scaling (Phase 3 Prep)
    const charsAdjusted = charsProcessed.map((processed, idx) => {
      const char = characteristics[idx];
      let ca = elements.map(() => 1);
      
      if (char.adj.byPop !== -1 && charsProcessed[char.adj.byPop]) {
        const popC = charsProcessed[char.adj.byPop].VC;
        ca = popC.map(p => p > 0 ? 1 / p : 0);
      }
      
      const VCR = processed.VC.map((vc, i) => vc * ca[i]);
      
      let cn = 1;
      if (char.adj.normType === 'objetivo' && char.adj.obj > 0) {
        cn = 1 / char.adj.obj;
      } else {
        const maxVCR = Math.max(...VCR, 1e-9);
        cn = 1 / maxVCR;
      }
      
      const VCRN = VCR.map(v => Math.min(1, v * cn));
      
      return { ...processed, ca, VCR, cn, VCRN };
    });

    // 3. Aggregation (Phase 2)
    const V = elements.map((_, i) => characteristics.map((_, j) => charsAdjusted[j].VCRN[i]));
    
    // Normalization of C matrix (cols sum to 1)
    const colSums = characteristics.map((_, j) => cMatrix.reduce((sum, row) => sum + row[j], 0));
    const Cn = cMatrix.map(row => row.map((val, j) => colSums[j] > 0 ? val / colSums[j] : 0));
    
    // OWA' (Reordering)
    const OWAp = V.map(row => {
      const sorted = [...row].map((val, idx) => ({val, idx})).sort((a,b) => b.val - a.val);
      const ranks = [];
      sorted.forEach((item, r) => ranks[item.idx] = r);
      return row.map((_, j) => owa[ranks[j]] || 0);
    });
    
    // RWA (Redistribution)
    const RWA = OWAp.map(row => 
      Cn[0].map((_, j) => 
        row.reduce((sum, val, k) => sum + val * Cn[k][j], 0)
      )
    );
    
    // Final Aggregation
    const A_final = V.map((row, i) => 
      row.reduce((sum, val, j) => sum + val * RWA[i][j], 0)
    );
    
    // Ranking (Array of indices sorted by A_final descending)
    const ranking = [...A_final]
      .map((val, idx) => ({val, idx}))
      .sort((a,b) => b.val - a.val)
      .map(item => item.idx);

    return { chars: charsAdjusted, agg: { V, Cn, OWAp, RWA, A_final, ranking } };
  }, [elements, characteristics, cMatrix, owa]);


  // --- RENDER HELPERS ---
  const activeChar = characteristics[activeCharIdx];
  const activeCalc = calc.chars[activeCharIdx];

  const TopNav = () => (
    <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl overflow-hidden shadow-sm sticky top-0 z-50">
      <button 
        onClick={() => setActivePhase(0)}
        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activePhase === 0 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        Configuración
      </button>
      <button 
        onClick={() => setActivePhase(1)}
        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activePhase === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        Análisis Característico
      </button>
      <button 
        onClick={() => setActivePhase(2)}
        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activePhase === 2 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        Análisis Agregación
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0 shadow-sm z-10">
        <Activity className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold tracking-tight text-gray-800">Ordomática</h1>
      </header>

      {/* MAIN AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        <div className="max-w-[1400px] mx-auto">
          <TopNav />

          {/* --- PHASE 0: CONFIGURACIÓN --- */}
          {activePhase === 0 && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6">
              
              <Card title="Elementos" icon={Network}>
                <div className="flex flex-col gap-2 mb-3">
                  {elements.map((el, i) => (
                    <div key={i} className="flex items-center justify-between bg-blue-50/50 border border-blue-100 px-3 py-2 rounded-lg focus-within:ring-1 focus-within:ring-blue-400">
                      <input 
                        value={el} 
                        onChange={(e) => handleEditElement(i, e.target.value)}
                        className="font-semibold text-blue-900 bg-transparent border-none p-0 w-full focus:outline-none text-sm"
                      />
                      <button onClick={() => handleRemoveElement(i)} className="text-blue-400 hover:text-red-500 transition-colors ml-2 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddElement} className="flex items-center justify-center w-full gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50/30 hover:bg-blue-50 px-3 py-2.5 rounded-lg border border-dashed border-blue-200 transition-colors">
                  <Plus className="w-4 h-4" /> Añadir Elemento
                </button>
              </Card>

              <Card title="Características" icon={Settings}>
                <div className="flex flex-col gap-2 mb-3">
                  {characteristics.map((char, i) => (
                    <div key={char.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg focus-within:ring-1 focus-within:ring-blue-400">
                      <input 
                        value={char.name}
                        onChange={(e) => handleEditCharName(i, e.target.value)}
                        className="font-semibold text-gray-700 bg-transparent border-none p-0 w-full focus:outline-none text-sm"
                      />
                      <button onClick={() => handleRemoveChar(i)} className="text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddChar} className="flex items-center justify-center w-full gap-2 text-xs font-medium text-gray-600 hover:text-gray-700 bg-gray-50/50 hover:bg-gray-50 px-3 py-2.5 rounded-lg border border-dashed border-gray-200 transition-colors">
                  <Plus className="w-4 h-4" /> Añadir Característica
                </button>
              </Card>

              <Card title="Gestión de Datos" icon={Database}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export Section */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Download className="w-3 h-3"/> Exportar</h4>
                    <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {[
                        { key: 'elementNames', label: 'Nombres de Elementos' },
                        { key: 'charNames', label: 'Nombres de Características' },
                        { key: 'rawInputs', label: 'Valores Heterogéneos (Entrada)' },
                        { key: 'distances', label: 'Matrices de Distancia (D)' },
                        { key: 'propConfig', label: 'Configuración de Propagación (F_P)' },
                        { key: 'blockVectors', label: 'Vectores de Bloqueo (V^B)' },
                        { key: 'synConfig', label: 'Configuración de Sinergia (F_S)' },
                        { key: 'adjParams', label: 'Parámetros de Ajuste y Equiparación' },
                        { key: 'owaWeights', label: 'Pesos OWA' },
                        { key: 'corrMatrix', label: 'Matriz de Correlación (C)' },
                      ].map(opt => (
                        <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={exportOptions[opt.key]} 
                            onChange={e => setExportOptions({...exportOptions, [opt.key]: e.target.checked})} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={handleExport} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-200">
                      <FileJson className="w-4 h-4" /> Exportar JSON
                    </button>
                  </div>
                  
                  {/* Import Section */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Upload className="w-3 h-3"/> Importar</h4>
                    
                    <input type="file" accept=".json" onChange={handleFileSelect} ref={fileInputRef} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors border border-gray-200 mb-4">
                      Seleccionar Archivo JSON
                    </button>

                    {pendingImportData && (
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 animate-in fade-in zoom-in-95">
                        <h5 className="text-xs font-bold text-yellow-800 uppercase mb-3">Seleccionar a importar:</h5>
                        <div className="flex flex-col gap-2 mb-4">
                          {[
                            { key: 'elementNames', label: 'Nombres de Elementos', available: pendingImportData.elements },
                            { key: 'charNames', label: 'Nombres de Características', available: pendingImportData.characteristics?.some(c => c.name) },
                            { key: 'rawInputs', label: 'Valores Heterogéneos (Entrada)', available: pendingImportData.characteristics?.some(c => c.rawInputs) },
                            { key: 'distances', label: 'Matrices de Distancia (D)', available: pendingImportData.characteristics?.some(c => c.d) },
                            { key: 'propConfig', label: 'Configuración de Propagación (F_P)', available: pendingImportData.characteristics?.some(c => c.prop) },
                            { key: 'blockVectors', label: 'Vectores de Bloqueo (V^B)', available: pendingImportData.characteristics?.some(c => c.vb) },
                            { key: 'synConfig', label: 'Configuración de Sinergia (F_S)', available: pendingImportData.characteristics?.some(c => c.syn) },
                            { key: 'adjParams', label: 'Parámetros de Ajuste y Equiparación', available: pendingImportData.characteristics?.some(c => c.adj) },
                            { key: 'owaWeights', label: 'Pesos OWA', available: pendingImportData.owa },
                            { key: 'corrMatrix', label: 'Matriz de Correlación (C)', available: pendingImportData.cMatrix },
                          ].map(opt => (
                            <label key={opt.key} className={`flex items-center gap-2 ${!opt.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <input 
                                type="checkbox" 
                                checked={importOptions[opt.key]} 
                                onChange={e => setImportOptions({...importOptions, [opt.key]: e.target.checked})} 
                                disabled={!opt.available} 
                                className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500 disabled:bg-gray-100" 
                              />
                              <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        <button onClick={executeImport} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors shadow-sm">
                          <Save className="w-4 h-4" /> Aplicar Importación
                        </button>
                        <button onClick={() => setPendingImportData(null)} className="w-full mt-2 text-sm text-yellow-700 hover:text-yellow-900 font-medium py-1 text-center">Cancelar</button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* --- PHASE 1: ANÁLISIS CARACTERÍSTICO --- */}
          {activePhase === 1 && (
            <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto">
              {/* Paginator */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <button 
                  onClick={() => setActiveCharIdx(Math.max(0, activeCharIdx - 1))}
                  disabled={activeCharIdx === 0}
                  className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-lg font-bold text-gray-800 bg-white px-6 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-3">
                  Característica {activeCharIdx + 1} de {characteristics.length}: <span className="text-blue-600">{activeChar.name}</span>
                </div>
                <button 
                  onClick={() => setActiveCharIdx(Math.min(characteristics.length - 1, activeCharIdx + 1))}
                  disabled={activeCharIdx === characteristics.length - 1}
                  className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* COLUMN 1: Integración de Datos y Valor Propio */}
              <div className="space-y-6">
                <Card title="Configuración de la Variable">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                      <select 
                        value={activeChar.type} 
                        onChange={e => updateActiveChar('type', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="cuantitativa">Cuantitativa</option>
                        <option value="cualitativa">Cualitativa</option>
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Granularidad (g)</label>
                      <select 
                        value={activeChar.g ?? 5} 
                        onChange={e => updateActiveChar('g', parseInt(e.target.value))}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={3}>3 (B, M, A)</option>
                        <option value={5}>5 (MB, B, M, A, MA)</option>
                        <option value={7}>7 (N, MB, B, M, A, MA, P)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mínimo</label>
                      <input 
                        type="number" step="any" value={activeChar.min ?? 0}
                        onChange={e => updateActiveChar('min', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Máximo</label>
                      <input 
                        type="number" step="any" value={activeChar.max ?? 100}
                        onChange={e => updateActiveChar('max', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Semántica (Int. Cualitativa)</label>
                      <select 
                        value={activeChar.sem ?? 'nucleo'} 
                        onChange={e => updateActiveChar('sem', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="nucleo">Núcleo (Core)</option>
                        <option value="soporte">Soporte (Support)</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card title={<span>Integración de Datos y <Formula>V^P</Formula></span>}>
              <p className="text-xs text-gray-500 mb-4">
                Introduce un valor por línea. Puede mezclar números precisos <code>35</code>, intervalos <code>[40,46]</code>, etiquetas <code>B</code> o 2-tuplas <code>(MA, -0.2)@5</code>. La tipología se adaptará automáticamente para calcular el valor único final.
              </p>
              <div className="space-y-4">
                {elements.map((el, i) => {
                  const tokens = (activeChar.rawInputs ? activeChar.rawInputs[i] || '' : '').split(';');
                  const calcTokens = activeCalc.parsedInputs[i].tokens;
                  
                  return (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-b border-gray-100">
                      <span className="font-bold text-gray-700">{el}</span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        V^P = {activeCalc.vp[i].toFixed(4)}
                      </span>
                    </div>
                    <div className="p-3 bg-white space-y-3">
                      {tokens.map((tok, tIdx) => (
                        <div key={tIdx} className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={tok}
                              onChange={e => {
                                const newTokens = [...tokens];
                                newTokens[tIdx] = e.target.value;
                                const newRaw = [...(activeChar.rawInputs || Array(elements.length).fill(''))];
                                newRaw[i] = newTokens.join(';');
                                updateActiveChar('rawInputs', newRaw);
                              }}
                              placeholder="Ej: 35, [40,46] o B"
                              className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button 
                              onClick={() => {
                                const newTokens = [...tokens];
                                newTokens.splice(tIdx, 1);
                                const newRaw = [...(activeChar.rawInputs || Array(elements.length).fill(''))];
                                newRaw[i] = newTokens.join(';');
                                updateActiveChar('rawInputs', newRaw);
                              }}
                              className="px-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Eliminar valor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {calcTokens[tIdx] && calcTokens[tIdx].trace !== 'Vacío' && (
                            <div className={`text-xs p-1.5 rounded border font-mono ml-2 ${calcTokens[tIdx].valid ? 'text-gray-500 bg-gray-50 border-gray-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                              ↳ {calcTokens[tIdx].trace}
                            </div>
                          )}
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newRaw = [...(activeChar.rawInputs || Array(elements.length).fill(''))];
                          newRaw[i] = newRaw[i] ? newRaw[i] + ';' : ';';
                          updateActiveChar('rawInputs', newRaw);
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Añadir valor
                      </button>
                      <div className="text-xs text-blue-600 font-medium border-t border-gray-100 pt-2 mt-2">
                        Resumen: {activeCalc.parsedInputs[i].summaryTrace}
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </Card>
          </div>

          {/* COLUMN 2: THE TOWER */}
              <div className="space-y-2 relative">
                
                <Card title={<span>Matriz de Distancia <Formula>D</Formula></span>}>
                  <MatrixEditor 
                    data={activeChar.d} 
                    rows={elements} cols={elements}
                    onChange={(i, j, val) => {
                      const newD = [...activeChar.d];
                      newD[i] = [...newD[i]];
                      newD[i][j] = val;
                      updateActiveChar('d', newD);
                    }}
                  />
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title={<span>Función de Propagación <Formula>F_P</Formula></span>}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Función</label>
                      <select 
                        value={activeChar.prop.type} 
                        onChange={e => updateActiveCharNested('prop', 'type', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="inhibida">Inhibida</option>
                        <option value="triangular">Triangular</option>
                        <option value="rectangular">Rectangular</option>
                        <option value="trapezoidal">Trapezoidal</option>
                        <option value="sinusoidal">Sinusoidal</option>
                      </select>
                    </div>
                    {activeChar.prop.type === 'trapezoidal' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Límite L1</label>
                        <input 
                          type="number" step="any" value={activeChar.prop.l1 || 0} 
                          onChange={e => updateActiveCharNested('prop', 'l1', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                    )}
                    {['triangular', 'rectangular', 'trapezoidal', 'sinusoidal'].includes(activeChar.prop.type) && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          {activeChar.prop.type === 'trapezoidal' ? 'Límite L2' : 'Límite L'}
                        </label>
                        <input 
                          type="number" step="any" value={activeChar.prop.limit} 
                          onChange={e => updateActiveCharNested('prop', 'limit', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title={<span>Matriz de Afinidad <Formula>A</Formula></span>}>
                  <MatrixEditor data={activeCalc.A} rows={elements} cols={elements} readOnly />
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title={<span>Función de Bloqueo <Formula>V^B</Formula></span>}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {elements.map((el, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-600 w-4">{el}</span>
                        <input 
                          type="number" step="0.1" min="0" max="1" value={activeChar.vb[i]}
                          onChange={e => {
                            const newVb = [...activeChar.vb];
                            newVb[i] = parseFloat(e.target.value) || 0;
                            updateActiveChar('vb', newVb);
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded-md text-sm text-center tabular-nums focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title={<span>Matriz Autoinducida <Formula>A^A</Formula></span>}>
                  <MatrixEditor data={activeCalc.AA} rows={elements} cols={elements} readOnly />
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title={<span>Función de Sinergia <Formula>F_S</Formula></span>}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Modelo</label>
                      <select 
                        value={activeChar.syn.type} 
                        onChange={e => updateActiveCharNested('syn', 'type', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="ninguna">Ninguna (Identidad)</option>
                        <option value="factor">Factor k</option>
                      </select>
                    </div>
                    {activeChar.syn.type === 'factor' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Factor k</label>
                        <input 
                          type="number" step="any" value={activeChar.syn.k} 
                          onChange={e => updateActiveCharNested('syn', 'k', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title={<span>Matriz Contextual <Formula>A^C</Formula></span>} className="border-blue-300 shadow-md">
                  <MatrixEditor data={activeCalc.AC} rows={elements} cols={elements} readOnly />
                </Card>

                <div className="flex justify-center text-blue-400 py-1 animate-pulse">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <Card title="Grafo de Afinidad Contextual">
                  <ValueFlowGraph elements={elements} AC={activeCalc.AC} />
                </Card>
              </div>

              {/* COLUMN 3: VALOR CONTEXTUAL Y AJUSTE */}
              <div className="space-y-6">
                
                <Card title={<span>Valor Contextual <Formula>V^C = V^P \cdot A^C</Formula></span>}>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    {elements.map((el, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-gray-600">{el}</span>
                        <span className="font-bold text-gray-900 tabular-nums text-lg">{activeCalc.VC[i].toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Ajuste Relativo y Equiparación">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Población (Ajuste Relativo)</label>
                      <select 
                        value={activeChar.adj.byPop}
                        onChange={e => updateActiveCharNested('adj', 'byPop', parseInt(e.target.value))}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={-1}>Ninguno</option>
                        {characteristics.map((c, i) => i !== activeCharIdx && (
                          <option key={i} value={i}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Equiparación</label>
                      <select 
                        value={activeChar.adj.normType}
                        onChange={e => updateActiveCharNested('adj', 'normType', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="maximo">Por Máximo</option>
                        <option value="objetivo">Valor Objetivo</option>
                      </select>
                      {activeChar.adj.normType === 'objetivo' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Valor Objetivo</label>
                          <input 
                            type="number" step="any" value={activeChar.adj.obj}
                            onChange={e => updateActiveCharNested('adj', 'obj', parseFloat(e.target.value) || 0)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="Valor Objetivo"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card title={<span>Equiparado <Formula>V^{`{CRN}`}</Formula></span>} className="border-green-200 shadow-md">
                  <div className="bg-green-50/50 rounded-xl p-2">
                    {elements.map((el, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 border-b border-green-100 last:border-0">
                        <span className="font-semibold text-green-800">{el}</span>
                        <span className="font-black text-green-700 tabular-nums text-lg">{activeCalc.VCRN[i].toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>
          </div>
        )}

        {/* --- PHASE 2: ANÁLISIS AGREGACIÓN --- */}
        {activePhase === 2 && (
          <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card title="1. Matriz de Valores Equiparados (Entrada)">
                <MatrixEditor 
                  data={calc.agg.V} 
                  rows={elements} 
                  cols={characteristics.map(c => c.name)} 
                  readOnly 
                />
              </Card>

              <Card title="2. Afinidad entre Criterios y Pesos OWA">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Relación Criterios <Formula>C</Formula></h4>
                    <MatrixEditor 
                      data={cMatrix} 
                      rows={characteristics.map(c => c.name)} 
                      cols={characteristics.map(c => c.name)}
                      onChange={(i, j, val) => {
                        const newC = [...cMatrix];
                        newC[i] = [...newC[i]];
                        newC[i][j] = val;
                        setCMatrix(newC);
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Pesos <Formula>OWA</Formula></h4>
                    <MatrixEditor 
                      data={[owa]} 
                      rows={['w']} 
                      cols={characteristics.map((_, i) => `Pos ${i+1}`)}
                      onChange={(_, j, val) => {
                        const newOwa = [...owa];
                        newOwa[j] = val;
                        setOwa(newOwa);
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <Card title="3. Desarrollo Matemático de la Agregación">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Normalizada <Formula>C'</Formula></h4>
                    <MatrixEditor data={calc.agg.Cn} rows={characteristics.map(c=>c.name)} cols={characteristics.map(c=>c.name)} readOnly />
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Reordenada <Formula>OWA'</Formula></h4>
                    <MatrixEditor data={calc.agg.OWAp} rows={elements} cols={characteristics.map(c=>c.name)} readOnly />
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">Redistribuida <Formula>RWA</Formula></h4>
                    <MatrixEditor data={calc.agg.RWA} rows={elements} cols={characteristics.map(c=>c.name)} readOnly />
                 </div>
               </div>
            </Card>

            <Card title="4. Resultado Final y Ranking" className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200">
              <div className="flex flex-col md:flex-row items-center gap-8 justify-around p-4">
                <div className="w-full md:w-auto flex-1">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 text-center">Valor Agregado <Formula>a_i = \Sigma (V_{`{ik}`} \cdot RWA_{`{ik}`})</Formula></h4>
                  <div className="space-y-4">
                    {elements.map((el, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="font-bold text-gray-700 w-8">{el}</span>
                        <div className="flex-1 h-6 bg-gray-200/50 rounded-full overflow-hidden relative shadow-inner">
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 shadow-sm" 
                            style={{ width: `${(calc.agg.A_final[i] / Math.max(...calc.agg.A_final, 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-sm font-bold text-gray-900 w-16 text-right tabular-nums">{calc.agg.A_final[i].toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block w-px h-40 bg-gray-200"></div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-200 w-full md:w-[350px]">
                  <h4 className="text-sm font-bold text-yellow-600 uppercase tracking-wider mb-4 text-center flex items-center justify-center gap-2">
                    🏆 Ranking Final
                  </h4>
                  <div className="flex flex-col gap-3">
                    {calc.agg.ranking.map((elIdx, rankIdx) => (
                      <div key={rankIdx} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${rankIdx === 0 ? 'bg-yellow-50/80 border border-yellow-200 shadow-sm' : 'hover:bg-gray-50'}`}>
                        <span className={`font-black ${rankIdx === 0 ? 'text-yellow-500 text-xl' : 'text-gray-400 text-lg'}`}>#{rankIdx + 1}</span>
                        <span className={`font-bold text-lg ${rankIdx === 0 ? 'text-gray-900' : 'text-gray-700'}`}>{elements[elIdx]}</span>
                        <span className="text-sm font-mono font-medium text-gray-500 ml-auto tabular-nums">{calc.agg.A_final[elIdx].toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

          </div>
        )}

        </div>
      </main>
    </div>
  );
}