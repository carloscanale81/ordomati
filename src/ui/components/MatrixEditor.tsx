import React from 'react';

export interface MatrixEditorProps {
  data: (number | null | undefined)[][];
  rows: string[];
  cols: string[];
  onChange?: (rowIndex: number, colIndex: number, value: number | null) => void;
  readOnly?: boolean;
  decimalPrecision?: number;
}

interface MatrixCellInputProps {
  value: number | null | undefined;
  onChange?: (val: number | null) => void;
}

const MatrixCellInput: React.FC<MatrixCellInputProps> = ({ value, onChange }) => {
  const isFocusedRef = React.useRef(false);
  const [text, setText] = React.useState<string>(
    typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
  );

  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setText(typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Replace comma with dot automatically so either key inputs the dot separator
    const clean = e.target.value.replace(',', '.');
    if (!/^-?\d*\.?\d*$/.test(clean) && clean !== '') return;
    setText(clean);

    const trimmed = clean.trim();
    if (trimmed === '' || trimmed === '-') {
      onChange?.(null);
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && Number.isFinite(parsed)) {
        onChange?.(parsed);
      }
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const clean = text.trim().replace(',', '.');
    if (clean === '' || clean === '-') {
      setText('');
      onChange?.(null);
    } else {
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && Number.isFinite(parsed)) {
        setText(String(parsed));
        onChange?.(parsed);
      } else {
        setText(typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder="-"
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-full p-2 text-center font-mono text-sm font-normal text-gray-800 dark:text-gray-100 tabular-nums focus:outline-none focus:bg-blue-50/40 dark:focus:bg-blue-900/30 focus:ring-1 focus:ring-blue-500 transition-colors bg-transparent placeholder-gray-400 dark:placeholder-gray-600"
    />
  );
};

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  data,
  rows,
  cols,
  onChange,
  readOnly = false,
  decimalPrecision = 4
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700/80">
      <table className="w-full text-sm border-collapse bg-white dark:bg-gray-900">
        <thead>
          <tr>
            <th className="p-2 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800"></th>
            {cols.map((c, i) => (
              <th
                key={i}
                className="p-2 border-b border-l border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800 font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[3.25rem] text-center"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th className="p-2 border-t border-r border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800 font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                {rows[i]}
              </th>
              {row.map((val, j) => (
                <td key={j} className="p-0 border border-gray-100 dark:border-gray-800">
                  {readOnly ? (
                    <div className="p-2 text-center font-mono text-sm font-normal text-gray-800 dark:text-gray-200 tabular-nums">
                      {typeof val === 'number' && Number.isFinite(val) ? val.toFixed(decimalPrecision) : '-'}
                    </div>
                  ) : (
                    <MatrixCellInput
                      value={val}
                      onChange={nextVal => onChange?.(i, j, nextVal)}
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
