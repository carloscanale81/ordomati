import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultDataset,
  createInitialFlavourState,
  DEFAULT_SOCCER_MATCH_URL,
  FLAVOUR_DEFINITIONS,
  FLAVOUR_LIST,
  isFlavourId,
  scrapeMatchData,
  extractMatchCentreDataFromHtml,
  createRecreationMatchData2007644,
  parseSoccerTimeline,
  computeSoccerDimensionalAnalysis,
  computeSoccerAggregatedAnalysis,
  getConvergentCutPoints,
  computeIntegralMatchCumulativeScores,
  computeIntegralCumulativeAffinity,
  DEFAULT_SOCCER_DIM_AFFINITY,
  SOCCER_CONCEPTS,
  SOCCER_OWA_PRESETS,
  SoccerConcept,
  extractMatchInfoFromUrl,
  formatMatchDate
} from '../index';
import {
  buildFlavourReportHtml,
  FlavourReportStrings,
  parseFlavourCase,
  serializeFlavourCase
} from '../../io/flavourIO';

const SAMPLE_REPORT_STRINGS: FlavourReportStrings = {
  documentTitle: 'Ordomatics — Analysis Report',
  flavourLabel: 'Flavour',
  flavourTitle: 'Race Driver',
  flavourDescription: 'Single-seater race driver performance',
  generatedAtLabel: 'Generated at',
  sourceUrlLabel: 'Source URL',
  noUrlProvided: 'Not specified',
  statusSectionTitle: 'Configuration Summary',
  statusConfigured: 'Source URL configured; awaiting extraction or dataset assignment.',
  statusEmpty: 'No source URL or dataset has been provided yet.',
  rankingSectionTitle: 'Evaluated Elements Ranking',
  rankColumn: 'Rank',
  elementColumn: 'Element',
  scoreColumn: 'Final Score',
  dimensionsSectionTitle: 'Evaluated Dimensions',
  dimensionColumn: 'Dimension',
  typeColumn: 'Type',
  quantitativeLabel: 'Quantitative',
  qualitativeLabel: 'Qualitative',
  weightColumn: 'Redistributed Weight'
};

test('Flavours registry exposes Match Soccer MVP definition', () => {
  assert.equal(FLAVOUR_LIST.length, 1);
  assert.ok(isFlavourId('match-soccer-mvp'));
  assert.ok(!isFlavourId('ordomachine'));
  assert.equal(FLAVOUR_DEFINITIONS['match-soccer-mvp'].watermarkVariant, 'soccer-ball');
});

test('Flavour case serialize & parse round-trip preserves sourceUrl and rejects mismatches', () => {
  const initial = createInitialFlavourState('match-soccer-mvp');
  initial.sourceUrl = 'https://example.com/match/2026-final';
  initial.dataset = createDefaultDataset();

  const serialized = serializeFlavourCase(initial);
  const parsedJson = JSON.parse(serialized);
  const restored = parseFlavourCase(parsedJson, 'match-soccer-mvp');

  assert.equal(restored.flavour, 'match-soccer-mvp');
  assert.equal(restored.sourceUrl, 'https://example.com/match/2026-final');
  assert.equal(restored.dataset?.elements.length, initial.dataset.elements.length);

  assert.throws(
    () => parseFlavourCase({ ...parsedJson, flavour: 'unknown-flavour' as any }, 'match-soccer-mvp'),
    (err: Error) => err.message === 'FLAVOUR_MISMATCH'
  );
});

test('Flavour case import also accepts standalone Ordomatics dataset files', () => {
  const standaloneDataset = createDefaultDataset();
  const imported = parseFlavourCase(standaloneDataset, 'match-soccer-mvp');

  assert.equal(imported.flavour, 'match-soccer-mvp');
  assert.equal(imported.sourceUrl, '');
  assert.equal(imported.dataset?.characteristics.length, standaloneDataset.characteristics.length);
});

test('buildFlavourReportHtml builds escaped readable HTML with ranking when dataset exists', () => {
  const soccerCase = createInitialFlavourState('match-soccer-mvp');
  soccerCase.sourceUrl = 'https://example.com/match?id=10&tag="final"';
  soccerCase.dataset = createDefaultDataset();

  const html = buildFlavourReportHtml(soccerCase, SAMPLE_REPORT_STRINGS, 'en');

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('https://example.com/match?id=10&amp;tag=&quot;final&quot;'));
  assert.ok(html.includes('Evaluated Elements Ranking'));
});

test('Match Soccer MVP defaults to 2007644 Spain vs Argentina URL', () => {
  const initial = createInitialFlavourState('match-soccer-mvp');
  assert.equal(
    initial.sourceUrl,
    'https://es.whoscored.com/matches/2007644/live/internacional-fifa-world-cup-2026-spain-argentina'
  );
  assert.equal(initial.sourceUrl, DEFAULT_SOCCER_MATCH_URL);
});

test('scrapeMatchData extracts match recreation JSON for WhoScored match 2007644', async () => {
  const result = await scrapeMatchData(DEFAULT_SOCCER_MATCH_URL);
  assert.ok(result.success, 'Scrape should succeed');
  assert.equal(result.matchId, 2007644);
  assert.ok(result.jsonString.length > 500, 'JSON string should be substantial');

  const parsed = JSON.parse(result.jsonString);
  assert.equal(parsed.matchId, 2007644);
  assert.ok(parsed.home.name === 'España' || parsed.home.name === 'Spain', 'Home team should be Spain or España');
  assert.equal(parsed.away.name, 'Argentina');
  assert.ok(Array.isArray(parsed.home.players), 'Home players must be array');
  assert.ok(Array.isArray(parsed.away.players), 'Away players must be array');
  assert.ok(Array.isArray(parsed.events), 'Events must be array');
});

test('extractMatchCentreDataFromHtml extracts embedded JavaScript matchCentreData', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Match</title></head>
      <body>
        <script>
          var matchCentreData = {"matchId": 2007644, "home": {"name": "Test Home"}};
        </script>
      </body>
    </html>
  `;
  const extracted = extractMatchCentreDataFromHtml(sampleHtml);
  assert.ok(extracted, 'Should extract embedded data');
  assert.equal(extracted?.matchId, 2007644);
});

test('parseSoccerTimeline extracts dual independent tracks for home and away teams with extra time and crests', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);

  assert.equal(timeline.totalMinutes, 120, 'Match 2007644 went to extra time (prórroga) and must be 120 minutes');
  assert.equal(timeline.homeTeamName, 'España');
  assert.equal(timeline.awayTeamName, 'Argentina');
  assert.ok(timeline.homeCrestUrl.length > 0, 'Home crest URL should be present');
  assert.ok(timeline.awayCrestUrl.length > 0, 'Away crest URL should be present');

  // Home segments must cover 0 to 120 with Spain substitutions (76', 84', 98', 105')
  assert.ok(timeline.homeSegments.length >= 7, 'Spain should have multiple segments demarcated by substitutions and extra time');
  assert.equal(timeline.homeSegments[0].startMinute, 0);
  assert.equal(timeline.homeSegments[timeline.homeSegments.length - 1].endMinute, 120);
  const homeCutMinutes = timeline.homeSegments.map(s => s.startMinute);
  assert.ok(homeCutMinutes.includes(76), 'Home should segment at 76 min (Morata sub)');
  assert.ok(homeCutMinutes.includes(84), 'Home should segment at 84 min (Le Normand sub)');
  assert.ok(homeCutMinutes.includes(90), 'Home should segment at 90 min (end of regular time / start extra time)');
  assert.ok(homeCutMinutes.includes(98), 'Home should segment at 98 min (Nico Williams sub)');
  assert.ok(homeCutMinutes.includes(105), 'Home should segment at 105 min (Fabián Ruiz sub / end of first extra time)');

  // Away segments must cover 0 to 120 with Argentina substitutions (82', 88', 90', 102', 110')
  assert.ok(timeline.awaySegments.length >= 7, 'Argentina should have multiple segments demarcated by substitutions and extra time');
  assert.equal(timeline.awaySegments[0].startMinute, 0);
  assert.equal(timeline.awaySegments[timeline.awaySegments.length - 1].endMinute, 120);
  const awayCutMinutes = timeline.awaySegments.map(s => s.startMinute);
  assert.ok(awayCutMinutes.includes(82), 'Away should segment at 82 min (Julián Álvarez sub)');
  assert.ok(awayCutMinutes.includes(88), 'Away should segment at 88 min (Tagliafico sub)');
  assert.ok(awayCutMinutes.includes(90), 'Away should segment at 90 min (Lautaro sub)');
  assert.ok(awayCutMinutes.includes(102), 'Away should segment at 102 min (De Paul sub)');
  assert.ok(awayCutMinutes.includes(110), 'Away should segment at 110 min (Lisandro sub)');

  // Cut points between Home and Away are independent and non-coincident
  assert.notDeepEqual(homeCutMinutes, awayCutMinutes, 'Home and Away tracks must have independent segments');

  // Every segment must maintain an active 11-player lineup
  timeline.homeSegments.forEach(seg => {
    assert.equal(seg.activePlayers.length, 11, `Home segment ${seg.label} must have 11 players`);
  });
  timeline.awaySegments.forEach(seg => {
    assert.equal(seg.activePlayers.length, 11, `Away segment ${seg.label} must have 11 players`);
  });

  // Verify lineup update across substitution (e.g. at 76' Morata is replaced by Oyarzabal)
  const preSubSeg = timeline.homeSegments.find(s => s.endMinute === 76);
  const postSubSeg = timeline.homeSegments.find(s => s.startMinute === 76);
  assert.ok(preSubSeg?.activePlayers.some(p => p.name === 'Álvaro Morata'));
  assert.ok(postSubSeg?.activePlayers.some(p => p.name === 'Mikel Oyarzabal'));
  assert.ok(!postSubSeg?.activePlayers.some(p => p.name === 'Álvaro Morata'));

  // Verify Goals are used as segmentation cut-points with accurate player names
  assert.ok(homeCutMinutes.includes(34), 'Spain must segment at 34 min (Dani Olmo goal)');
  assert.ok(homeCutMinutes.includes(79), 'Spain must segment at 79 min (Lamine Yamal goal)');
  assert.ok(homeCutMinutes.includes(108), 'Spain must segment at 108 min (Rodri goal)');
  assert.ok(homeCutMinutes.includes(18), 'Spain must segment at 18 min (conceded Messi goal)');
  assert.ok(homeCutMinutes.includes(57), 'Spain must segment at 57 min (conceded Mac Allister goal)');
  assert.ok(awayCutMinutes.includes(18), 'Argentina must segment at 18 min (Lionel Messi goal)');
  assert.ok(awayCutMinutes.includes(57), 'Argentina must segment at 57 min (Alexis Mac Allister goal)');
  assert.ok(awayCutMinutes.includes(34), 'Argentina must segment at 34 min (conceded Olmo goal)');
  assert.ok(awayCutMinutes.includes(79), 'Argentina must segment at 79 min (conceded Yamal goal)');
  assert.ok(awayCutMinutes.includes(108), 'Argentina must segment at 108 min (conceded Rodri goal)');

  // Verify player names in event descriptions
  const olmoGoalEvent = timeline.homeEvents.find(e => e.minute === 34 && e.type === 'goal');
  assert.ok(olmoGoalEvent, '34 min goal event must exist for Spain');
  assert.equal(olmoGoalEvent?.playerPrimary, 'Dani Olmo');
  assert.equal(olmoGoalEvent?.playerSecondary, 'Lamine Yamal');
  assert.ok(olmoGoalEvent?.description.includes('Dani Olmo'));

  const morataSubEvent = timeline.homeEvents.find(e => e.minute === 76 && e.type === 'sub');
  assert.ok(morataSubEvent, '76 min sub event must exist for Spain');
  assert.equal(morataSubEvent?.playerPrimary, 'Mikel Oyarzabal');
  assert.equal(morataSubEvent?.playerSecondary, 'Álvaro Morata');
  assert.ok(morataSubEvent?.description.includes('Entra Mikel Oyarzabal ⇄ Sale Álvaro Morata'));

  const messiGoalEvent = timeline.awayEvents.find(e => e.minute === 18 && e.type === 'goal');
  assert.ok(messiGoalEvent, '18 min goal event must exist for Argentina');
  assert.equal(messiGoalEvent?.playerPrimary, 'Lionel Messi');
  assert.ok(messiGoalEvent?.description.includes('Lionel Messi'));
});

test('parseSoccerTimeline handles red card / expulsion cut-points and player ejection', () => {
  const matchData = createRecreationMatchData2007644();
  // Inject a red card for Argentina at 114'
  const customEvents = [
    ...(matchData.events as any[]),
    {
      id: 99,
      minute: 114,
      second: 10,
      team: 'Argentina',
      player: 'Cristian Romero',
      type: 'Card',
      cardType: 'Red',
      outcome: 'Red'
    }
  ];
  const customMatch = { ...matchData, events: customEvents };
  const timeline = parseSoccerTimeline(customMatch);

  const expSeg = timeline.awaySegments.find(s => s.startMinute === 114);
  assert.ok(expSeg, 'A segment starting at 114 min must be created for Argentina after expulsion');
  assert.equal(expSeg?.activePlayers.length, 10, 'Argentina should only have 10 players on pitch after expulsion');
  assert.ok(!expSeg?.activePlayers.some(p => p.name === 'Cristian Romero'), 'Expelled player must not be in active players');
  assert.ok(expSeg?.startReason?.description.includes('Cristian Romero'), 'Expulsion reason must state expelled player');
});

test('computeSoccerDimensionalAnalysis generates A matrix, applies synergy to AC, and solves VP', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);
  const firstSeg = timeline.homeSegments[0];

  // 1. Pending calculation: VP is null and isCalculated is false
  const pendingAnalysis = computeSoccerDimensionalAnalysis(matchData, firstSeg, false);
  assert.equal(pendingAnalysis.isCalculated, false);
  assert.equal(pendingAnalysis.VP, null);
  assert.equal(pendingAnalysis.players.length, 11);
  assert.equal(pendingAnalysis.A.length, 11);
  assert.equal(pendingAnalysis.AAI.length, 11);
  assert.equal(pendingAnalysis.AC.length, 11);
  assert.equal(pendingAnalysis.VC.length, 11);

  // A matrix must have diagonal of 1 and off-diagonal = passes / maxPasses
  for (let i = 0; i < 11; i++) {
    assert.equal(pendingAnalysis.A[i][i], 1, `Diagonal A[${i}][${i}] must be 1`);
    assert.equal(pendingAnalysis.AAI[i][i], 1, `Diagonal AAI[${i}][${i}] must be 1 (no blocking)`);
    assert.equal(pendingAnalysis.AC[i][i], 1, `Diagonal AC[${i}][${i}] must be 1`);
  }

  // 2. Solved calculation: VP is solved via matrix inversion (AC)^(-1) * VC
  const solvedAnalysis = computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 1.0 });
  assert.equal(solvedAnalysis.isCalculated, true);
  assert.ok(Array.isArray(solvedAnalysis.VP));
  assert.equal(solvedAnalysis.VP?.length, 11);
  solvedAnalysis.VP?.forEach((val, idx) => {
    assert.ok(Number.isFinite(val), `VP[${idx}] must be a finite number`);
    assert.ok(val >= 0, `VP[${idx}] must be non-negative`);
  });

  // 3. Synergy factor modulation
  const factorAnalysis = computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 0.5 });
  // Off-diagonal in factorAnalysis should be half of AAI
  for (let i = 0; i < 11; i++) {
    for (let j = 0; j < 11; j++) {
      if (i !== j && factorAnalysis.AAI[i][j] > 0) {
        assert.ok(
          Math.abs(factorAnalysis.AC[i][j] - factorAnalysis.AAI[i][j] * 0.5) < 1e-4,
          `AC[${i}][${j}] should be scaled by synergy factor k=0.5`
        );
      }
    }
  }
});

test('computeSoccerDimensionalAnalysis supports all 12 dimensions including Regates ganados and Tiros a puerta', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);
  const firstSeg = timeline.homeSegments[0];

  const concepts = [
    'dribblesWon',
    'goals',
    'aerial',
    'shotsOnTarget',
    'touches',
    'passAccuracy',
    'accuratePasses',
    'keyPasses',
    'tacklesSuccessful',
    'clearances',
    'interceptions',
    'cornerAccuracy'
  ] as const;

  const expectedNames: Record<string, string> = {
    dribblesWon: 'Regates ganados',
    goals: 'Goles',
    aerial: 'Aéreos ganados',
    shotsOnTarget: 'Tiros a puerta',
    touches: 'Toques',
    passAccuracy: 'Acierto pases',
    accuratePasses: 'Pases precisos',
    keyPasses: 'Pases clave',
    tacklesSuccessful: 'Entradas exitosas',
    clearances: 'Despejes',
    interceptions: 'Intercepciones',
    cornerAccuracy: 'Precisión córner',
    dribbles: 'Regates ganados',
    shots: 'Tiros a puerta'
  };

  concepts.forEach(concept => {
    const analysis = computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 1.0 }, concept);
    assert.equal(analysis.concept, concept);
    assert.equal(analysis.conceptName, expectedNames[concept]);
    assert.equal(analysis.players.length, 11);
    assert.equal(analysis.VC.length, 11);
    assert.ok(analysis.totalPasses > 0, `Total passes must be > 0 for ${concept}`);
    assert.ok(analysis.maxPasses > 0, `Max passes must be > 0 for ${concept}`);
    assert.equal(analysis.isCalculated, true);
    assert.ok(Array.isArray(analysis.VP));
    assert.equal(analysis.VP?.length, 11);

    // Contextual values must be valid non-negative numbers
    analysis.VC.forEach((val, idx) => {
      assert.ok(Number.isFinite(val), `VC[${idx}] must be finite for ${concept}`);
      assert.ok(val >= 0, `VC[${idx}] must be >= 0 for ${concept}`);
    });

    // Solved Own Values must be finite
    analysis.VP?.forEach((val, idx) => {
      assert.ok(Number.isFinite(val), `VP[${idx}] must be finite for ${concept}`);
    });
  });

  // Also check backward compatibility aliases
  const dribblesAlias = computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 1.0 }, 'dribbles');
  assert.equal(dribblesAlias.conceptName, 'Regates ganados');
  const shotsAlias = computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 1.0 }, 'shots');
  assert.equal(shotsAlias.conceptName, 'Tiros a puerta');
});

test('computeSoccerAggregatedAnalysis aggregates 12 dimensions using OWA and dimension affinity', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);
  const firstSeg = timeline.homeSegments[0];

  const dimAnalyses = SOCCER_CONCEPTS.map(c =>
    computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 1.0 }, c.key)
  );

  const agg = computeSoccerAggregatedAnalysis(dimAnalyses, firstSeg);

  assert.equal(agg.players.length, 11);
  assert.equal(agg.V.length, 11);
  assert.equal(agg.V[0].length, 12, 'V matrix must have 12 dimension columns');
  assert.equal(agg.scores.length, 11);
  assert.equal(agg.ranking.length, 11);
  assert.ok(agg.mvpPlayer, 'Segment MVP player must be identified');
  assert.equal(agg.ranking[0], agg.players.findIndex(p => p.id === agg.mvpPlayer.id));

  // Each score must be a non-negative finite number
  agg.scores.forEach((s, idx) => {
    assert.ok(Number.isFinite(s), `Score ${idx} must be finite`);
    assert.ok(s >= 0, `Score ${idx} must be >= 0`);
  });

  // Ranking must sort scores in descending order
  for (let r = 0; r < agg.ranking.length - 1; r++) {
    const idxA = agg.ranking[r];
    const idxB = agg.ranking[r + 1];
    assert.ok(agg.scores[idxA] >= agg.scores[idxB], 'Scores must be descending according to ranking');
  }
});

test('getConvergentCutPoints returns synchronized game moments between teams', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);

  const cutPoints = getConvergentCutPoints(timeline.homeSegments, timeline.awaySegments, 120);

  // Must include match boundaries: 0, 45, 90, 105, 120
  assert.ok(cutPoints.includes(0));
  assert.ok(cutPoints.includes(45));
  assert.ok(cutPoints.includes(90));
  assert.ok(cutPoints.includes(105));
  assert.ok(cutPoints.includes(120));

  // Must include goals since both teams segment on goals (18', 34', 57', 79', 108')
  assert.ok(cutPoints.includes(18), '18 min (Messi goal) must be convergent');
  assert.ok(cutPoints.includes(34), '34 min (Olmo goal) must be convergent');
  assert.ok(cutPoints.includes(57), '57 min (Mac Allister goal) must be convergent');
  assert.ok(cutPoints.includes(79), '79 min (Yamal goal) must be convergent');
  assert.ok(cutPoints.includes(108), '108 min (Rodri goal) must be convergent');

  // Must be strictly sorted ascending
  for (let i = 0; i < cutPoints.length - 1; i++) {
    assert.ok(cutPoints[i] < cutPoints[i + 1], 'Cut points must be strictly ascending');
  }
});

test('computeIntegralMatchCumulativeScores accumulates player performance across match timeline', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);

  const synergyConfigs: Record<SoccerConcept, { type: 'factor'; k: number }> = {
    dribblesWon: { type: 'factor' as const, k: 1.0 },
    goals: { type: 'factor' as const, k: 1.0 },
    aerial: { type: 'factor' as const, k: 1.0 },
    shotsOnTarget: { type: 'factor' as const, k: 1.0 },
    touches: { type: 'factor' as const, k: 1.0 },
    passAccuracy: { type: 'factor' as const, k: 1.0 },
    accuratePasses: { type: 'factor' as const, k: 1.0 },
    keyPasses: { type: 'factor' as const, k: 1.0 },
    tacklesSuccessful: { type: 'factor' as const, k: 1.0 },
    clearances: { type: 'factor' as const, k: 1.0 },
    interceptions: { type: 'factor' as const, k: 1.0 },
    cornerAccuracy: { type: 'factor' as const, k: 1.0 },
    dribbles: { type: 'factor' as const, k: 1.0 },
    shots: { type: 'factor' as const, k: 1.0 }
  };
  const owaConfig = { type: 'average' as const, weights: [...SOCCER_OWA_PRESETS.average] };

  // At minute 0, scores must be 0
  const startResult = computeIntegralMatchCumulativeScores(
    timeline,
    matchData,
    'aggregate',
    owaConfig,
    DEFAULT_SOCCER_DIM_AFFINITY,
    synergyConfigs,
    0
  );
  assert.equal(startResult.homePlayers.every(p => p.cumulativeScore === 0), true);

  // At minute 120 (full match), scores must be > 0 and MVPs identified
  const fullResult = computeIntegralMatchCumulativeScores(
    timeline,
    matchData,
    'aggregate',
    owaConfig,
    DEFAULT_SOCCER_DIM_AFFINITY,
    synergyConfigs,
    120
  );
  assert.ok(fullResult.homePlayers.length >= 11);
  assert.ok(fullResult.awayPlayers.length >= 11);
  assert.ok(fullResult.homeMvp, 'Home MVP must be identified');
  assert.ok(fullResult.awayMvp, 'Away MVP must be identified');
  assert.ok(fullResult.matchMvp, 'Match MVP must be identified');

  // Verify that cumulative score grows monotonically: score at 120 >= score at 60
  const midResult = computeIntegralMatchCumulativeScores(
    timeline,
    matchData,
    'aggregate',
    owaConfig,
    DEFAULT_SOCCER_DIM_AFFINITY,
    synergyConfigs,
    60
  );
  const midScoreYamal = midResult.homePlayers.find(p => p.player.name === 'Lamine Yamal')?.cumulativeScore || 0;
  const fullScoreYamal = fullResult.homePlayers.find(p => p.player.name === 'Lamine Yamal')?.cumulativeScore || 0;
  assert.ok(fullScoreYamal >= midScoreYamal, 'Cumulative score must grow monotonically with minutes');
});

test('computeIntegralCumulativeAffinity accumulates contextual affinity and passes across match timeline', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);
  const synergyConfig = { type: 'factor' as const, k: 1.0 };

  // Minute 0
  const startAffinity = computeIntegralCumulativeAffinity(timeline, matchData, 'home', synergyConfig, 0);
  assert.ok(startAffinity.players.length === 11);
  const totalStartPasses = startAffinity.pass_cum.flat().reduce((a, b) => a + b, 0);
  assert.equal(totalStartPasses, 0);

  // Minute 60
  const midAffinity = computeIntegralCumulativeAffinity(timeline, matchData, 'home', synergyConfig, 60);
  const totalMidPasses = midAffinity.pass_cum.flat().reduce((a, b) => a + b, 0);
  assert.ok(totalMidPasses > 0, 'Passes must accumulate by minute 60');

  // Minute 120
  const fullAffinity = computeIntegralCumulativeAffinity(timeline, matchData, 'home', synergyConfig, 120);
  const totalFullPasses = fullAffinity.pass_cum.flat().reduce((a, b) => a + b, 0);
  assert.ok(totalFullPasses >= totalMidPasses, 'Cumulative passes must grow monotonically');

  // Check AC_cum values
  const hasPositiveAffinity = fullAffinity.AC_cum.some(row => row.some(v => v > 0));
  assert.ok(hasPositiveAffinity, 'Cumulative affinity matrix must have positive values');
});

test('extractMatchInfoFromUrl dynamically parses competition, stage, date, and venue from URL slugs', () => {
  const wcInfo = extractMatchInfoFromUrl('https://es.whoscored.com/matches/2007644/live/internacional-fifa-world-cup-2026-spain-argentina');
  assert.equal(wcInfo.competition, 'FIFA World Cup 2026');
  assert.equal(wcInfo.stage, 'Final');
  assert.equal(wcInfo.homeTeam, 'España');
  assert.equal(wcInfo.awayTeam, 'Argentina');
  assert.ok(wcInfo.venueName.includes('MetLife Stadium'));

  const laligaInfo = extractMatchInfoFromUrl('https://www.whoscored.com/Matches/1735000/Live/Spain-LaLiga-2023-2024-Real-Madrid-Barcelona');
  assert.equal(laligaInfo.competition, 'LaLiga 2023/2024');
  assert.equal(laligaInfo.stage, 'Jornada de Liga');
  assert.equal(laligaInfo.homeTeam, 'Real Madrid');
  assert.equal(laligaInfo.awayTeam, 'Barcelona');
  assert.ok(laligaInfo.venueName.includes('Santiago Bernabéu'));

  const plInfo = extractMatchInfoFromUrl('https://www.whoscored.com/Matches/1821532/Live/England-Premier-League-2023-2024-Arsenal-Chelsea');
  assert.equal(plInfo.competition, 'Premier League 2023/2024');
  assert.equal(plInfo.homeTeam, 'Arsenal');
  assert.equal(plInfo.awayTeam, 'Chelsea');
  assert.ok(plInfo.venueName.includes('Emirates Stadium'));

  // Test formatMatchDate
  assert.equal(formatMatchDate('2026-07-19T20:00:00Z'), '19/07/2026');
  assert.equal(formatMatchDate('2024-04-21T21:00:00'), '21/04/2024');
});

test('SOCCER_OWA_PRESETS implements Promedio, Especialista, and Equilibrado with correct mathematical ratios', () => {
  const avg = SOCCER_OWA_PRESETS.average;
  const spec = SOCCER_OWA_PRESETS.specialist;
  const bal = SOCCER_OWA_PRESETS.balanced;

  assert.equal(avg.length, 12);
  assert.equal(spec.length, 12);
  assert.equal(bal.length, 12);

  // Sums must all normalize to 1.0
  const avgSum = avg.reduce((a, b) => a + b, 0);
  const specSum = spec.reduce((a, b) => a + b, 0);
  const balSum = bal.reduce((a, b) => a + b, 0);

  assert.ok(Math.abs(avgSum - 1.0) < 0.001);
  assert.ok(Math.abs(specSum - 1.0) < 0.001);
  assert.ok(Math.abs(balSum - 1.0) < 0.001);

  // Specialist: each weight is half of previous
  assert.ok(spec[0] > spec[1] && spec[1] > spec[2]);
  assert.ok(Math.abs(spec[0] - 2 * spec[1]) < 0.01);

  // Balanced: each weight is double of previous
  assert.ok(bal[11] > bal[10] && bal[10] > bal[9]);
  assert.ok(Math.abs(bal[11] - 2 * bal[10]) < 0.01);
});

test('computeSoccerAggregatedAnalysis applies equalization adjustment relative to dimension maximum', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);
  const firstSeg = timeline.homeSegments[0];

  const dimAnalyses = SOCCER_CONCEPTS.map(c =>
    computeSoccerDimensionalAnalysis(matchData, firstSeg, true, { type: 'factor', k: 1.0 }, c.key)
  );

  const agg = computeSoccerAggregatedAnalysis(dimAnalyses, firstSeg, {
    type: 'specialist',
    weights: SOCCER_OWA_PRESETS.specialist
  });

  assert.ok(agg.equalizedV, 'equalizedV matrix must be returned');
  assert.equal(agg.equalizedV.length, 11);
  assert.equal(agg.equalizedV[0].length, 12);

  // In each dimension column j, all values must be in [0, 1] and the max must be 1.0 (or 0 if all 0)
  for (let j = 0; j < 12; j++) {
    const colVals = agg.equalizedV.map(row => row[j]);
    const maxVal = Math.max(...colVals);
    assert.ok(maxVal <= 1.0, `Max equalized value in dim ${j} must be <= 1.0`);
    if (agg.V.some(row => row[j] > 0)) {
      assert.equal(maxVal, 1.0, `Max equalized value in non-zero dim ${j} must be 1.0`);
    }
  }
});

test('Pipeline configuration functions and defaults (propagation, blocking, synergy, relative, equalization)', () => {
  const matchData = createRecreationMatchData2007644();
  const timeline = parseSoccerTimeline(matchData);
  const seg = timeline.homeSegments[0];

  // 1. Default pipeline: propagation=maxRatio, blocking=none, synergy=none, relative=none, equalization=max
  const dim = computeSoccerDimensionalAnalysis(
    matchData,
    seg,
    true,
    { type: 'none', k: 1.0 },
    'dribblesWon',
    { type: 'maxRatio' },
    { type: 'none' },
    { type: 'none' }
  );

  // Diagonal of A must be 1
  for (let i = 0; i < dim.players.length; i++) {
    assert.equal(dim.A[i][i], 1.0, `Diagonal A[${i}][${i}] must be 1`);
  }

  // With maxRatio, off-diagonal values must be in [0, 1]
  for (let i = 0; i < dim.players.length; i++) {
    for (let j = 0; j < dim.players.length; j++) {
      assert.ok(dim.A[i][j] >= 0 && dim.A[i][j] <= 1.0);
    }
  }

  // Without blocking or synergy, AC should equal A
  for (let i = 0; i < dim.players.length; i++) {
    for (let j = 0; j < dim.players.length; j++) {
      assert.equal(dim.AC[i][j], dim.A[i][j]);
    }
  }

  // 2. Propagation triangular option
  const dimTri = computeSoccerDimensionalAnalysis(
    matchData,
    seg,
    true,
    { type: 'none', k: 1.0 },
    'dribblesWon',
    { type: 'triangular', limit: 10 }
  );
  assert.equal(dimTri.A[0][0], 1.0);

  // 3. Blocking threshold option
  const dimBlock = computeSoccerDimensionalAnalysis(
    matchData,
    seg,
    true,
    { type: 'none', k: 1.0 },
    'dribblesWon',
    { type: 'maxRatio' },
    { type: 'threshold', threshold: 0.5 }
  );
  // Cells below 0.5 must be 0
  for (let i = 0; i < dimBlock.players.length; i++) {
    for (let j = 0; j < dimBlock.players.length; j++) {
      if (dim.A[i][j] < 0.5) {
        assert.equal(dimBlock.AC[i][j], 0);
      }
    }
  }

  // 4. Equalization options: max vs sum vs none
  const allDims = SOCCER_CONCEPTS.map(c =>
    computeSoccerDimensionalAnalysis(matchData, seg, true, { type: 'none', k: 1.0 }, c.key)
  );

  const aggMax = computeSoccerAggregatedAnalysis(
    allDims,
    seg,
    { type: 'average', weights: SOCCER_OWA_PRESETS.average },
    DEFAULT_SOCCER_DIM_AFFINITY,
    { type: 'max' }
  );
  const aggSum = computeSoccerAggregatedAnalysis(
    allDims,
    seg,
    { type: 'average', weights: SOCCER_OWA_PRESETS.average },
    DEFAULT_SOCCER_DIM_AFFINITY,
    { type: 'sum' }
  );
  const aggNone = computeSoccerAggregatedAnalysis(
    allDims,
    seg,
    { type: 'average', weights: SOCCER_OWA_PRESETS.average },
    DEFAULT_SOCCER_DIM_AFFINITY,
    { type: 'none' }
  );

  assert.ok(aggMax.scores.length === 11);
  assert.ok(aggSum.scores.length === 11);
  assert.ok(aggNone.scores.length === 11);

  // In aggNone, equalizedV equals raw V
  assert.deepEqual(aggNone.equalizedV, aggNone.V);

  // 5. Integral match cumulative scores with default propagation, blocking, relative, and equalization
  const integralRes = computeIntegralMatchCumulativeScores(
    timeline,
    matchData,
    'aggregate',
    { type: 'average', weights: SOCCER_OWA_PRESETS.average },
    DEFAULT_SOCCER_DIM_AFFINITY,
    {
      dribblesWon: { type: 'none', k: 1.0 },
      goals: { type: 'none', k: 1.0 },
      aerial: { type: 'none', k: 1.0 },
      shotsOnTarget: { type: 'none', k: 1.0 },
      touches: { type: 'none', k: 1.0 },
      passAccuracy: { type: 'none', k: 1.0 },
      accuratePasses: { type: 'none', k: 1.0 },
      keyPasses: { type: 'none', k: 1.0 },
      tacklesSuccessful: { type: 'none', k: 1.0 },
      clearances: { type: 'none', k: 1.0 },
      interceptions: { type: 'none', k: 1.0 },
      cornerAccuracy: { type: 'none', k: 1.0 },
      dribbles: { type: 'none', k: 1.0 },
      shots: { type: 'none', k: 1.0 }
    },
    120,
    { type: 'maxRatio' },
    { type: 'none' },
    { type: 'none' },
    { type: 'max' }
  );
  assert.ok(integralRes.homePlayers.length > 0);
  assert.ok(integralRes.awayPlayers.length > 0);
  assert.ok(integralRes.matchMvp !== null);
});
