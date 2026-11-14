export interface TeamCrestColors {
  primary: string;
  border: string;
  accent: string;
  text: string;
}

const KNOWN_TEAM_CREST_COLORS: Record<string, TeamCrestColors> = {
  // National teams
  'españa': { primary: '#c61d23', border: '#f59e0b', accent: '#ef4444', text: '#ffffff' },
  'spain': { primary: '#c61d23', border: '#f59e0b', accent: '#ef4444', text: '#ffffff' },
  'argentina': { primary: '#0284c7', border: '#f59e0b', accent: '#38bdf8', text: '#ffffff' },
  'brasil': { primary: '#eab308', border: '#16a34a', accent: '#facc15', text: '#14532d' },
  'brazil': { primary: '#eab308', border: '#16a34a', accent: '#facc15', text: '#14532d' },
  'francia': { primary: '#1e3a8a', border: '#dc2626', accent: '#3b82f6', text: '#ffffff' },
  'france': { primary: '#1e3a8a', border: '#dc2626', accent: '#3b82f6', text: '#ffffff' },
  'alemania': { primary: '#18181b', border: '#eab308', accent: '#a1a1aa', text: '#ffffff' },
  'germany': { primary: '#18181b', border: '#eab308', accent: '#a1a1aa', text: '#ffffff' },
  'italia': { primary: '#1d4ed8', border: '#eab308', accent: '#60a5fa', text: '#ffffff' },
  'italy': { primary: '#1d4ed8', border: '#eab308', accent: '#60a5fa', text: '#ffffff' },
  'inglaterra': { primary: '#ffffff', border: '#dc2626', accent: '#f87171', text: '#0f172a' },
  'england': { primary: '#ffffff', border: '#dc2626', accent: '#f87171', text: '#0f172a' },
  'portugal': { primary: '#b91c1c', border: '#15803d', accent: '#ef4444', text: '#ffffff' },
  'países bajos': { primary: '#ea580c', border: '#ffffff', accent: '#fb923c', text: '#ffffff' },
  'netherlands': { primary: '#ea580c', border: '#ffffff', accent: '#fb923c', text: '#ffffff' },
  'uruguay': { primary: '#0284c7', border: '#18181b', accent: '#38bdf8', text: '#ffffff' },
  'colombia': { primary: '#eab308', border: '#1d4ed8', accent: '#facc15', text: '#1e1b4b' },

  // Clubs
  'real madrid': { primary: '#ffffff', border: '#7c3aed', accent: '#a855f7', text: '#1e1b4b' },
  'barcelona': { primary: '#991b1b', border: '#1d4ed8', accent: '#ef4444', text: '#ffffff' },
  'fc barcelona': { primary: '#991b1b', border: '#1d4ed8', accent: '#ef4444', text: '#ffffff' },
  'atletico madrid': { primary: '#dc2626', border: '#1d4ed8', accent: '#ef4444', text: '#ffffff' },
  'atlético de madrid': { primary: '#dc2626', border: '#1d4ed8', accent: '#ef4444', text: '#ffffff' },
  'manchester city': { primary: '#38bdf8', border: '#ffffff', accent: '#7dd3fc', text: '#0f172a' },
  'man city': { primary: '#38bdf8', border: '#ffffff', accent: '#7dd3fc', text: '#0f172a' },
  'liverpool': { primary: '#b91c1c', border: '#f59e0b', accent: '#ef4444', text: '#ffffff' },
  'arsenal': { primary: '#dc2626', border: '#ffffff', accent: '#f87171', text: '#ffffff' },
  'manchester united': { primary: '#dc2626', border: '#f59e0b', accent: '#ef4444', text: '#ffffff' },
  'chelsea': { primary: '#1d4ed8', border: '#ffffff', accent: '#60a5fa', text: '#ffffff' },
  'bayern munich': { primary: '#dc2626', border: '#1d4ed8', accent: '#ef4444', text: '#ffffff' },
  'bayern': { primary: '#dc2626', border: '#1d4ed8', accent: '#ef4444', text: '#ffffff' },
  'paris saint-germain': { primary: '#1e3a8a', border: '#dc2626', accent: '#3b82f6', text: '#ffffff' },
  'psg': { primary: '#1e3a8a', border: '#dc2626', accent: '#3b82f6', text: '#ffffff' },
  'juventus': { primary: '#18181b', border: '#ffffff', accent: '#a1a1aa', text: '#ffffff' },
  'inter': { primary: '#1d4ed8', border: '#18181b', accent: '#38bdf8', text: '#ffffff' },
  'milan': { primary: '#dc2626', border: '#18181b', accent: '#ef4444', text: '#ffffff' }
};

/**
 * Resolves the primary crest colors for graph nodes based on team crest availability and team name.
 */
export function getTeamCrestColors(
  teamKey?: 'home' | 'away',
  teamName?: string,
  crestUrl?: string
): TeamCrestColors {
  const isHome = teamKey === 'home';
  const hasCrest = Boolean(crestUrl && crestUrl.trim().length > 0);

  // If team crest is available or teamName is specified, look up crest colors
  if (teamName) {
    const normalized = teamName.toLowerCase().trim();
    if (KNOWN_TEAM_CREST_COLORS[normalized]) {
      return KNOWN_TEAM_CREST_COLORS[normalized];
    }
    // Partial search
    for (const [key, colors] of Object.entries(KNOWN_TEAM_CREST_COLORS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return colors;
      }
    }
  }

  // Also check if crestUrl points to known badge filenames (e.g. Spain, Argentina)
  if (crestUrl) {
    const urlLower = crestUrl.toLowerCase();
    if (urlLower.includes('spain') || urlLower.includes('espana')) {
      return KNOWN_TEAM_CREST_COLORS['españa'];
    }
    if (urlLower.includes('argentina')) {
      return KNOWN_TEAM_CREST_COLORS['argentina'];
    }
  }

  // If a crest is provided but team is unrecognized, use dignified national/club primary standards
  if (hasCrest) {
    return isHome
      ? { primary: '#c61d23', border: '#f59e0b', accent: '#ef4444', text: '#ffffff' } // Spanish Red & Gold
      : { primary: '#0284c7', border: '#f59e0b', accent: '#38bdf8', text: '#ffffff' }; // Sky Blue & Gold
  }

  // Default fallback when NO crest is available
  return isHome
    ? { primary: '#1d4ed8', border: '#93c5fd', accent: '#38bdf8', text: '#ffffff' }
    : { primary: '#0891b2', border: '#a5f3fc', accent: '#67e8f9', text: '#ffffff' };
}
