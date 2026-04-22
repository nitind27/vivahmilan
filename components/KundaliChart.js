'use client';

// North Indian Kundali Chart — SVG-based 4×4 diamond grid
// House layout (fixed positions):
//  [12][1 ][2 ][3 ]
//  [11][  center  ][4 ]
//  [10][  center  ][5 ]
//  [9 ][8 ][7 ][6 ]

const GRAHA_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

// Fixed house positions in the 4×4 grid [row, col] (0-indexed)
const HOUSE_CELLS = {
  1:  [0, 1],
  2:  [0, 2],
  3:  [0, 3],
  4:  [1, 3],
  5:  [2, 3],
  6:  [3, 3],
  7:  [3, 2],
  8:  [3, 1],
  9:  [3, 0],
  10: [2, 0],
  11: [1, 0],
  12: [0, 0],
};

const CELL_SIZE = 80;
const GRID_SIZE = CELL_SIZE * 4;

function HouseCell({ house, x, y, w, h, grahas, lagnaSign, isLagna }) {
  const lines = [];
  if (isLagna) lines.push(lagnaSign);
  grahas.forEach(g => lines.push(GRAHA_ABBR[g] || g));

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="var(--vd-border, #e5e7eb)" strokeWidth="1" />
      {isLagna && (
        <text x={x + w / 2} y={y + 14} textAnchor="middle" fontSize="9" fill="var(--vd-primary, #c8a45c)" fontWeight="bold">
          H{house}
        </text>
      )}
      {!isLagna && (
        <text x={x + 5} y={y + 13} fontSize="8" fill="var(--vd-text-light, #9ca3af)">
          {house}
        </text>
      )}
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + (isLagna ? 28 : 22) + i * 14}
          textAnchor="middle"
          fontSize="11"
          fill={isLagna && i === 0 ? 'var(--vd-primary, #c8a45c)' : 'var(--vd-text-heading, #1f2937)'}
          fontWeight={isLagna && i === 0 ? 'bold' : 'normal'}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function KundaliSVG({ kundali }) {
  const { lagna, planetaryPositions } = kundali;

  // Group grahas by house
  const grahasByHouse = {};
  for (let h = 1; h <= 12; h++) grahasByHouse[h] = [];
  Object.entries(planetaryPositions).forEach(([graha, pos]) => {
    const h = pos.house;
    if (h >= 1 && h <= 12) grahasByHouse[h].push(graha);
  });

  const cells = [];
  for (let house = 1; house <= 12; house++) {
    const [row, col] = HOUSE_CELLS[house];
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    cells.push(
      <HouseCell
        key={house}
        house={house}
        x={x} y={y} w={CELL_SIZE} h={CELL_SIZE}
        grahas={grahasByHouse[house]}
        lagnaSign={lagna}
        isLagna={house === 1}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      className="w-full max-w-xs mx-auto"
      style={{ background: 'var(--vd-bg-section, #fff)' }}
      aria-label="North Indian Kundali Chart"
    >
      {/* Center 2×2 merged cell */}
      <rect
        x={CELL_SIZE} y={CELL_SIZE}
        width={CELL_SIZE * 2} height={CELL_SIZE * 2}
        fill="var(--vd-accent-soft, #fdf6e3)"
        stroke="var(--vd-border, #e5e7eb)"
        strokeWidth="1"
      />
      {/* Diamond lines in center */}
      <line x1={CELL_SIZE} y1={CELL_SIZE} x2={CELL_SIZE * 3} y2={CELL_SIZE * 3} stroke="var(--vd-border, #e5e7eb)" strokeWidth="0.5" />
      <line x1={CELL_SIZE * 3} y1={CELL_SIZE} x2={CELL_SIZE} y2={CELL_SIZE * 3} stroke="var(--vd-border, #e5e7eb)" strokeWidth="0.5" />
      <text x={GRID_SIZE / 2} y={GRID_SIZE / 2 - 6} textAnchor="middle" fontSize="10" fill="var(--vd-primary, #c8a45c)" fontWeight="bold">
        ॐ
      </text>
      <text x={GRID_SIZE / 2} y={GRID_SIZE / 2 + 8} textAnchor="middle" fontSize="9" fill="var(--vd-text-light, #9ca3af)">
        Kundali
      </text>
      {cells}
    </svg>
  );
}

function SummaryPanel({ kundali }) {
  const { lagna, rashi, nakshatra, manglik } = kundali;
  const items = [
    { label: 'Lagna (Ascendant)', value: lagna },
    { label: 'Rashi (Moon Sign)', value: rashi },
    { label: 'Nakshatra', value: nakshatra },
    { label: 'Manglik', value: manglik ? '✅ Yes (Manglik)' : '❌ No (Non-Manglik)' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border">
          <p className="text-xs text-vd-text-light mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-vd-text-heading">{value}</p>
        </div>
      ))}
    </div>
  );
}

function DashaList({ dashaSequence }) {
  if (!dashaSequence || dashaSequence.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">Vimshottari Dasha</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {dashaSequence.map((entry, i) => (
          <div key={i} className="flex items-center justify-between bg-vd-bg-alt rounded-xl px-3 py-2 border border-vd-border text-xs">
            <span className="font-semibold text-vd-text-heading w-20">{entry.planet}</span>
            <span className="text-vd-text-light">{entry.startDate}</span>
            <span className="text-vd-text-light">→</span>
            <span className="text-vd-text-light">{entry.endDate}</span>
          </div>
        ))}
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
        <p className="text-vd-text-light text-sm mb-4">Generate your Vedic birth chart to see planetary positions and dasha sequence.</p>
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

  // Parse JSON fields if they're strings
  const planetaryPositions = typeof kundali.planetaryPositions === 'string'
    ? JSON.parse(kundali.planetaryPositions)
    : kundali.planetaryPositions;
  const dashaSequence = typeof kundali.dashaSequence === 'string'
    ? JSON.parse(kundali.dashaSequence)
    : kundali.dashaSequence;

  const normalizedKundali = { ...kundali, planetaryPositions, dashaSequence };

  return (
    <div className="bg-vd-bg-section rounded-2xl border border-vd-border p-4">
      <p className="text-sm font-bold text-vd-text-heading mb-3 flex items-center gap-2">
        🪐 Kundali Chart
      </p>
      <KundaliSVG kundali={normalizedKundali} />
      <SummaryPanel kundali={normalizedKundali} />
      <DashaList dashaSequence={normalizedKundali.dashaSequence} />
    </div>
  );
}
