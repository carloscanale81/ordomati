import React from 'react';

export interface FormulaProps {
  children: React.ReactNode;
}

export const Formula: React.FC<FormulaProps> = ({ children }) => (
  <span className="font-serif italic text-blue-800 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/50 mx-1 whitespace-nowrap">
    {children}
  </span>
);

function readBalancedBraces(input: string, openBraceIdx: number): { content: string; nextIdx: number } | null {
  if (input[openBraceIdx] !== '{') return null;
  let depth = 1;
  let idx = openBraceIdx + 1;
  while (idx < input.length && depth > 0) {
    if (input[idx] === '{') depth++;
    else if (input[idx] === '}') depth--;
    idx++;
  }
  if (depth !== 0) return null;
  return {
    content: input.slice(openBraceIdx + 1, idx - 1),
    nextIdx: idx
  };
}

function renderMathNodes(input: string = '', keyPrefix = 'm'): React.ReactNode[] {
  const safeInput = input || '';
  const nodes: React.ReactNode[] = [];
  let plain = '';
  let i = 0;
  let k = 0;

  const flushPlain = () => {
    if (plain) {
      nodes.push(plain);
      plain = '';
    }
  };

  while (i < safeInput.length) {
    const ch = safeInput[i];

    // Render Unicode inverse and plus exponents with matching superscript metrics
    if (safeInput.startsWith('⁻¹', i)) {
      flushPlain();
      nodes.push(
        <sup
          key={`${keyPrefix}-${k++}`}
          className="text-[0.72em] leading-none align-baseline relative -top-[0.42em]"
        >
          −1
        </sup>
      );
      i += 2;
      continue;
    }

    if (ch === '⁺') {
      flushPlain();
      nodes.push(
        <sup
          key={`${keyPrefix}-${k++}`}
          className="text-[0.72em] leading-none align-baseline relative -top-[0.42em]"
        >
          +
        </sup>
      );
      i += 1;
      continue;
    }

    if (ch === '^' || ch === '_') {
      const isSup = ch === '^';
      const Tag = isSup ? 'sup' : 'sub';
      const posClass = isSup ? '-top-[0.42em]' : '-bottom-[0.22em]';
      const next = i + 1;

      if (next < input.length) {
        if (input[next] === '{') {
          const braced = readBalancedBraces(input, next);
          if (braced) {
            flushPlain();
            nodes.push(
              <Tag
                key={`${keyPrefix}-${k++}`}
                className={`text-[0.72em] leading-none align-baseline relative ${posClass}`}
              >
                {renderMathNodes(braced.content, `${keyPrefix}-${k}`)}
              </Tag>
            );
            i = braced.nextIdx;
            continue;
          }
        }

        const rest = input.slice(next);
        const match = rest.match(/^(?:[−-]?[A-Za-z0-9]+)/);
        if (match) {
          flushPlain();
          nodes.push(
            <Tag
              key={`${keyPrefix}-${k++}`}
              className={`text-[0.72em] leading-none align-baseline relative ${posClass}`}
            >
              {match[0]}
            </Tag>
          );
          i = next + match[0].length;
          continue;
        }
      }
    }

    plain += ch;
    i += 1;
  }

  flushPlain();
  return nodes;
}

export interface MathTextProps {
  text?: string;
  className?: string;
}

/** Renders text with inline math notation, converting `^` into superscripts and `_` into subscripts. */
export const MathText: React.FC<MathTextProps> = ({ text, className }) => (
  <span className={className}>{renderMathNodes(text || '')}</span>
);
