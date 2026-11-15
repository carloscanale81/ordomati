import React, { useId } from 'react';
import { FlavourWatermarkVariant } from '../../logic/flavours';

export interface FlavourWatermarkProps {
  variant: FlavourWatermarkVariant;
}

export interface FlavourIllustrationProps {
  variant: FlavourWatermarkVariant;
  strokeWidth?: number;
  className?: string;
}

interface LineArtProps {
  strokeWidth: number;
  className?: string;
}

const CX = 200;
const CY = 200;
const BALL_R = 152;
const SPOKE_ANGLES_DEG = [-90, -18, 54, 126, 198];

interface Point {
  x: number;
  y: number;
}

const polarPoint = (angleDeg: number, radius: number): Point => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((CX + radius * Math.cos(rad)).toFixed(2)),
    y: Number((CY + radius * Math.sin(rad)).toFixed(2))
  };
};

const SOCCER_INNER_PENTAGON = SPOKE_ANGLES_DEG.map(a => polarPoint(a, 46));
const SOCCER_MID_NODES = SPOKE_ANGLES_DEG.map(a => polarPoint(a, 98));
const SOCCER_LEFT_FLARES = SPOKE_ANGLES_DEG.map(a => polarPoint(a - 19, 134));
const SOCCER_RIGHT_FLARES = SPOKE_ANGLES_DEG.map(a => polarPoint(a + 19, 134));
const SOCCER_LEFT_RIM = SPOKE_ANGLES_DEG.map(a => polarPoint(a - 13, BALL_R + 4));
const SOCCER_RIGHT_RIM = SPOKE_ANGLES_DEG.map(a => polarPoint(a + 13, BALL_R + 4));

const SOCCER_PENTAGON_POINTS = SOCCER_INNER_PENTAGON.map(p => `${p.x},${p.y}`).join(' ');

const SoccerBallLineArt: React.FC<LineArtProps> = ({ strokeWidth, className = 'w-full h-full' }) => {
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={CX} cy={CY} r={BALL_R} />
        </clipPath>
      </defs>

      <g transform="rotate(-14 200 200)">
        <circle cx={CX} cy={CY} r={BALL_R} />

        <g clipPath={`url(#${clipId})`}>
          <polygon points={SOCCER_PENTAGON_POINTS} />

          {SPOKE_ANGLES_DEG.map((_, idx) => {
            const inner = SOCCER_INNER_PENTAGON[idx];
            const mid = SOCCER_MID_NODES[idx];
            const leftFlare = SOCCER_LEFT_FLARES[idx];
            const rightFlare = SOCCER_RIGHT_FLARES[idx];
            const nextLeftFlare = SOCCER_LEFT_FLARES[(idx + 1) % SPOKE_ANGLES_DEG.length];
            const leftRim = SOCCER_LEFT_RIM[idx];
            const rightRim = SOCCER_RIGHT_RIM[idx];

            return (
              <g key={idx}>
                <line x1={inner.x} y1={inner.y} x2={mid.x} y2={mid.y} />
                <polyline
                  points={`${leftRim.x},${leftRim.y} ${leftFlare.x},${leftFlare.y} ${mid.x},${mid.y} ${rightFlare.x},${rightFlare.y} ${rightRim.x},${rightRim.y}`}
                />
                <line
                  x1={rightFlare.x}
                  y1={rightFlare.y}
                  x2={nextLeftFlare.x}
                  y2={nextLeftFlare.y}
                />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
};

const SingleSeaterCarLineArt: React.FC<LineArtProps> = ({
  strokeWidth,
  className = 'w-full h-full'
}) => (
  <svg
    viewBox="0 0 400 400"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <g transform="rotate(-40 200 200)">
      {/* Front wing */}
      <path d="M114 66 Q200 50 286 66 L282 78 Q200 66 118 78 Z" />
      <path d="M122 71 Q200 58 278 71" />
      <line x1="112" y1="56" x2="112" y2="86" />
      <line x1="288" y1="56" x2="288" y2="86" />

      {/* Nose cone */}
      <path d="M194 46 Q200 39 206 46 L214 142 L186 142 Z" />

      {/* Front wheels & wishbone suspension */}
      <rect x="108" y="88" width="32" height="50" rx="8" />
      <rect x="260" y="88" width="32" height="50" rx="8" />
      <polyline points="189,96 140,104 187,124" />
      <polyline points="211,96 260,104 213,124" />

      {/* Cockpit, protection arch & driver helmet */}
      <path d="M186 142 Q200 132 214 142 L212 206 Q200 214 188 206 Z" />
      <line x1="200" y1="144" x2="200" y2="164" />
      <path d="M185 198 Q186 172 200 164 Q214 172 215 198" />
      <circle cx="200" cy="183" r="10.5" />

      {/* Sidepods & tapered engine cover */}
      <path d="M186 146 C158 150 152 168 152 198 C152 242 172 280 186 318" />
      <path d="M214 146 C242 150 248 168 248 198 C248 242 228 280 214 318" />
      <line x1="158" y1="176" x2="156" y2="266" />
      <line x1="242" y1="176" x2="244" y2="266" />
      <polyline points="194,209 200,220 206,209" />
      <line x1="200" y1="220" x2="200" y2="326" />

      {/* Rear wheels & rear axle links */}
      <rect x="104" y="266" width="38" height="54" rx="9" />
      <rect x="258" y="266" width="38" height="54" rx="9" />
      <line x1="142" y1="285" x2="178" y2="280" />
      <line x1="142" y1="303" x2="182" y2="306" />
      <line x1="258" y1="285" x2="222" y2="280" />
      <line x1="258" y1="303" x2="218" y2="306" />

      {/* Rear structure & rear wing */}
      <line x1="186" y1="318" x2="194" y2="332" />
      <line x1="214" y1="318" x2="206" y2="332" />
      <rect x="132" y="332" width="136" height="22" rx="3" />
      <line x1="132" y1="343" x2="268" y2="343" />
      <line x1="128" y1="326" x2="128" y2="358" />
      <line x1="272" y1="326" x2="272" y2="358" />
    </g>
  </svg>
);

const ILLUSTRATION_COMPONENTS: Record<FlavourWatermarkVariant, React.FC<LineArtProps>> = {
  'soccer-ball': SoccerBallLineArt
};

const DEFAULT_WATERMARK_STROKE: Record<FlavourWatermarkVariant, number> = {
  'soccer-ball': 2.5
};

/**
 * Shared monochrome line-art symbol for each flavour (used in both menus and page watermarks).
 */
export const FlavourIllustration: React.FC<FlavourIllustrationProps> = ({
  variant,
  strokeWidth,
  className
}) => {
  const Illustration = ILLUSTRATION_COMPONENTS[variant];
  const resolvedStroke = strokeWidth ?? DEFAULT_WATERMARK_STROKE[variant];
  return <Illustration strokeWidth={resolvedStroke} className={className} />;
};

/**
 * Monochrome line-art watermark anchored in the top-right corner behind flavour cards.
 */
export const FlavourWatermark: React.FC<FlavourWatermarkProps> = ({ variant }) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute -top-2 -right-2 sm:top-2 sm:right-4 w-[34vw] min-w-[240px] max-w-[540px] aspect-square text-gray-900/[0.065] dark:text-gray-100/[0.065] z-0"
    >
      <FlavourIllustration variant={variant} />
    </div>
  );
};
