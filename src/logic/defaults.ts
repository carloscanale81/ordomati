import { OrdomaticaDataset } from './types';

/**
 * Creates the standard default Ordomatics dataset.
 * Used for initialization in both Web UI, unit tests, and headless MCP/API environments.
 * Dimensions are labeled D1, D2 by default.
 */
export const createDefaultDataset = (): OrdomaticaDataset => ({
  elements: ['A', 'B', 'C', 'D'],
  characteristics: [
    {
      id: 1,
      name: 'D1',
      type: 'quantitative',
      min: 0,
      max: 100,
      g: 5,
      rawInputs: ['35', '[40,46]', '28', '60'],
      d: [
        [0, 13, 4, 20],
        [13, 0, 7, 34],
        [4, 7, 0, 2],
        [20, 34, 2, 0]
      ],
      vb: [1, 0, 0.2, 0.5],
      prop: { type: 'triangular', limit: 10, l1: 5 },
      syn: { type: 'none', k: 1 },
      adj: { targetValue: 'vc', byPop: -1, normType: 'maximum', obj: 1 },
      calcTarget: 'vc'
    },
    {
      id: 2,
      name: 'D2',
      type: 'qualitative',
      min: 0,
      max: 100,
      g: 5,
      rawInputs: ['MB', '(A, -0.2)', 'B', 'M; (MA, -0.1)'],
      d: [
        [0, null, null, null],
        [null, 0, null, null],
        [null, null, 0, null],
        [null, null, null, 0]
      ],
      vb: [0, 0, 0, 0],
      prop: { type: 'triangular', limit: 10, l1: 5 },
      syn: { type: 'none', k: 1 },
      adj: { targetValue: 'vc', byPop: -1, normType: 'maximum', obj: 1 },
      calcTarget: 'vc'
    }
  ],
  cMatrix: [
    [1, 0.3],
    [0.3, 1]
  ],
  owa: [1, 0.9],
  decimalPrecision: 4
});
