import React from 'react';

export interface MatrixEditorProps {
  data: (number | null | undefined)[][];
  rows: string[];
  cols: string[];
  onChange?: (rowIndex: number, colIndex: number, value: number | null) => void;
  readOnly?: boolean;
  decimalPrecision?: number;
}

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
                    <input
                      type="number"
                      step="any"
                      value={typeof val === 'number' && Number.isFinite(val) ? val : ''}
                      placeholder="-"
                      onChange={e => {
                        const trimmed = e.target.value.trim();
                        if (trimmed === '') {
                          onChange?.(i, j, null);
                        } else {
                          const parsed = parseFloat(trimmed);
                          onChange?.(i, j, isNaN(parsed) ? null : parsed);
                        }
                      }}
                      className="w-full p-2 text-center font-mono text-sm font-normal text-gray-800 dark:text-gray-100 tabular-nums focus:outline-none focus:bg-blue-50/40 dark:focus:bg-blue-900/30 focus:ring-1 focus:ring-blue-500 transition-colors bg-transparent placeholder-gray-400 dark:placeholder-gray-600"
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
