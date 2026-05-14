'use client';

/**
 * North Indian Kundali Chart — SVG diamond layout
 *
 * Classic North Indian style: fixed sign positions, Lagna house rotates.
 * 12 triangular/trapezoidal cells in a diamond (rotated square).
 *
 * House 1 (Lagna) = top-right cell, going clockwise to house 12.
 */

const GRAHA_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const RASHI_FULL  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASHI_SHORT = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];

const S = 280;
const C = S / 2;  // 140
const Q = S / 4;  // 70

// Outer square corners + midpoints
const OT  = [C, 0];   const OR  = [S, C];   const OB  = [C, S];   const OL  = [0, C];
const OTR = [S, 0];   const OBR = [S, S];   const OBL = [0, S];   const OTL = [0, 0];

// Inner diamond corners
const IT = [C, Q];    const IR = [S-Q, C];  const IB = [C, S-Q];  const IL = [Q, C];

function poly(pts) { return pts.map(p => p.join(',')).join(' '); }

// 12 non-overlapping cells, house 1 at top-right going clockwise
const NI_CELLS = [
  { house: 1,  points: poly([OT,OTR,IR,IT]),   cx: C+Q*0.85, cy: Q*0.55   }, // top-right
  { house: 2,  points: poly([OTR,OR,IR]),       cx: S-Q*0.45, cy: Q*0.45   }, // right-top corner
  { house: 3,  points: poly([IT,IR,IB]),        cx: C+Q*0.5,  cy: C        }, // center-right inner
  { house: 4,  points: poly([IR,OBR,OB,IB]),   cx: C+Q*0.85, cy: S-Q*0.55 }, // bottom-right
  { house: 5,  points: poly([OBR,OB,IR]),       cx: S-Q*0.45, cy: S-Q*0.45 }, // right-bottom corner
  { house: 6,  points: poly([OBL,OB,IB,IL]),   cx: C-Q*0.85, cy: S-Q*0.55 }, // bottom-left
  { house: 7,  points: poly([OL,OBL,IL]),       cx: Q*0.45,   cy: S-Q*0.45 }, // left-bottom corner
  { house: 8,  points: poly([IT,IL,IB]),        cx: C-Q*0.5,  cy: C        }, // center-left inner
  { house: 9,  points: poly([OTL,OL,IL,IT]),   cx: C-Q*0.85, cy: Q*0.55   }, // top-left
  { house: 10, points: poly([OTL,OT,IT]),       cx: Q*0.45,   cy: Q*0.45   }, // left-top corner
  { house: 11, points: poly([OTL,OL,IL]),       cx: Q*0.45,   cy: C-Q*0.5  }, // left corner
  { house: 12, points: poly([OT,OTL,IT]),       cx: C-Q*0.45, cy: Q*0.45   }, // top-left corner
];

function HouseCell({ cell, grahas, isLagna, signName }) {
  const { points, cx, cy } = cell;
  const lines = [signName, ...grahas.map(g => GRAHA_ABBR[g] || g)];
  const totalH = lines.length * 11;
  const startY = cy - totalH / 2 + 5;

  return (
    <g>
      <polygon
        points={points}
        fill={isLagna ? 'rgba(200,164,92,0.15)' : 'none'}
        stroke="var(--vd-border, #d1d5db)"
        strokeWidth="1"
      />
      <text x={cx} y={startY - 6} textAnchor="middle" fontSize="7" fill="var(--vd-text-light, #9ca3af)">
        {cell.house}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={startY + i * 11}
          textAnchor="middle"
          fontSize={i === 0 ? 8 : 10}
          fontWeight={isLagna && i === 0 ? 'bold' : 'normal'}
          fill={
            i === 0
              ? isLagna ? 'var(--vd-primary, #c8a45c)' : 'var(--vd-text-light, #6b7280)'
              : 'var(--vd-text-heading, #1f2937)'
          }
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function KundaliSVG({ kundali }) {
  const { lagna, planetaryPositions } = kundali;
  const lagnaIdx = RASHI_FULL.indexOf(lagna);

  const grahasByHouse = {};
  for (let h = 1; h <= 12; h++) grahasByHouse[h] = [];
  Object.entries(planetaryPositions).forEach(([graha, pos]) => {
    if (pos.house >= 1 && pos.house <= 12) grahasByHouse[pos.house].push(graha);
  });

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="w-full max-w-sm mx-auto"
      style={{ background: 'var(--vd-bg-section, #fff)' }}
      aria-label="North Indian Kundali Chart"
    >
      <rect x="0" y="0" width={S} height={S} fill="none" stroke="var(--vd-border,#d1d5db)" strokeWidth="1.5" />
      <polygon points={poly([OT,OR,OB,OL])} fill="none" stroke="var(--vd-border,#d1d5db)" strokeWidth="1.5" />
      <polygon points={poly([IT,IR,IB,IL])} fill="var(--vd-accent-soft,#fdf6e3)" stroke="var(--vd-border,#d1d5db)" strokeWidth="1" />
      <text x={C} y={C-8}  textAnchor="middle" fontSize="14" fill="var(--vd-primary,#c8a45c)" fontWeight="bold">ॐ</text>
      <text x={C} y={C+6}  textAnchor="middle" fontSize="8"  fill="var(--vd-text-light,#9ca3af)">Kundali</text>
      <text x={C} y={C+17} textAnchor="middle" fontSize="8"  fill="var(--vd-primary,#c8a45c)">{lagna}</text>

      {NI_CELLS.map(cell => {
        const signIdx  = lagnaIdx >= 0 ? (lagnaIdx + cell.house - 1) % 12 : cell.house - 1;
        const signName = RASHI_SHORT[signIdx];
        return (
          <HouseCell
            key={cell.house}
            cell={cell}
            grahas={grahasByHouse[cell.house]}
            isLagna={cell.house === 1}
            signName={signName}
          />
        );
      })}
    </svg>
  );
}

function SummaryPanel({ kundali }) {
  const { lagna, rashi, nakshatra, manglik } = kundali;
  const items = [
    { label: 'Lagna (Ascendant)', value: lagna },
    { label: 'Rashi (Moon Sign)', value: rashi },
    { label: 'Nakshatra',         value: nakshatra },
    { label: 'Manglik',           value: manglik ? '✅ Yes' : '❌ No' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border">
          <p className="text-xs text-vd-text-light mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-vd-text-heading">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PlanetTable({ planetaryPositions }) {
  const grahas = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">Planetary Positions</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-vd-bg-alt">
              {['Planet','Sign','Degree','House'].map(h => (
                <th key={h} className="text-left px-2 py-1.5 text-vd-text-light font-semibold border border-vd-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grahas.map(g => {
              const pos = planetaryPositions[g];
              if (!pos) return null;
              return (
                <tr key={g} className="border-b border-vd-border hover:bg-vd-bg-alt/50">
                  <td className="px-2 py-1 font-semibold text-vd-text-heading border border-vd-border">{g}</td>
                  <td className="px-2 py-1 text-vd-text-heading border border-vd-border">{pos.sign}</td>
                  <td className="px-2 py-1 text-vd-text-light border border-vd-border">{Number(pos.degree).toFixed(2)}°</td>
                  <td className="px-2 py-1 text-vd-text-light border border-vd-border">{pos.house}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashaList({ dashaSequence }) {
  if (!dashaSequence?.length) return null;
  const now = new Date().toISOString().slice(0, 10);
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">Vimshottari Dasha</p>
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {dashaSequence.map((entry, i) => {
          const isCurrent = entry.startDate <= now && now <= entry.endDate;
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl px-3 py-1.5 border text-xs ${
                isCurrent ? 'bg-vd-accent-soft border-vd-primary font-semibold' : 'bg-vd-bg-alt border-vd-border'
              }`}
            >
              <span className="w-20 text-vd-text-heading">{entry.planet}{isCurrent ? ' ◀' : ''}</span>
              <span className="text-vd-text-light">{entry.startDate}</span>
              <span className="text-vd-text-light mx-1">→</span>
              <span className="text-vd-text-light">{entry.endDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function KundaliChart({ kundali, onGenerateClick }) {
  if (!kundali) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 bg-vd-bg-section rounded-2xl border border-vd-border text-center">
        <div className="text-5xl mb-3">🪐</div>
        <p className="text-vd-text-heading font-semibold mb-1">No Kundali Generated</p>
        <p className="text-vd-text-light text-sm mb-4">
          Generate your Vedic birth chart to see planetary positions and dasha sequence.
        </p>
        {onGenerateClick && (
          <button
            onClick={onGenerateClick}
            className="vd-gradient-gold text-white px-6 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 4px 16px rgba(200,164,92,0.35)' }}
          >
            Generate Kundali
          </button>
        )}
      </div>
    );
  }

  const planetaryPositions = typeof kundali.planetaryPositions === 'string'
    ? JSON.parse(kundali.planetaryPositions) : kundali.planetaryPositions;
  const dashaSequence = typeof kundali.dashaSequence === 'string'
    ? JSON.parse(kundali.dashaSequence) : kundali.dashaSequence;

  const normalized = { ...kundali, planetaryPositions, dashaSequence };

  return (
    <div className="bg-vd-bg-section rounded-2xl border border-vd-border p-4">
      <p className="text-sm font-bold text-vd-text-heading mb-3 flex items-center gap-2">
        🪐 Kundali Chart
      </p>
      <KundaliSVG kundali={normalized} />
      <SummaryPanel kundali={normalized} />
      <PlanetTable planetaryPositions={normalized.planetaryPositions} />
      <DashaList dashaSequence={normalized.dashaSequence} />
    </div>
  );
}
