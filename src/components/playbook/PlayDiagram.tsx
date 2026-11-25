/**
 * The identity mark: a play drawn up like a coach's chalkboard, where the route
 * runs through the sections of the plan. `progress` (0–1) draws part of the
 * route (used while a playbook is being made); without it the route draws once.
 */
const ROUTE = "M30,232 C65,232 65,150 100,150 C140,150 140,210 180,210 C217,210 217,110 255,110 C295,110 295,165 335,165 C372,165 372,75 410,75 C442,75 442,130 475,130 C510,130 516,66 536,42";
const STOPS: [number, number, string, "above" | "below"][] = [
  [30, 232, "Opportunity", "below"],
  [100, 150, "Positioning", "above"],
  [180, 210, "Big idea", "below"],
  [255, 110, "Launch", "above"],
  [335, 165, "Channels", "below"],
  [410, 75, "Collaborators", "above"],
  [475, 130, "Story", "below"],
];
const DEFENDERS = [[58, 92], [212, 160], [300, 60], [372, 232], [470, 190], [140, 262]];

export function PlayDiagram({ progress, className }: { progress?: number; className?: string }) {
  return (
    <svg viewBox="0 0 570 280" className={className} role="img" aria-label="The plan: opportunity, positioning, big idea, launch, channels, collaborators, story and game plan">
      <g className="stroke-sage/10" strokeWidth="1">
        {[20, 80, 140, 200, 260].map((y) => <line key={y} x1="0" x2="570" y1={y} y2={y} strokeDasharray="2 7" />)}
      </g>
      <g className="stroke-sage/25" strokeWidth="1.5" strokeLinecap="round">
        {DEFENDERS.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 5},${y - 5}l10,10M${x + 5},${y - 5}l-10,10`} />)}
      </g>
      <path d={ROUTE} fill="none" className="stroke-sage/20" strokeWidth="1.75" />
      <path
        d={ROUTE}
        fill="none"
        pathLength={1}
        strokeDasharray="1"
        strokeWidth="1.75"
        strokeLinecap="round"
        className={progress === undefined ? "route-draw stroke-sage" : "stroke-sage transition-[stroke-dashoffset] duration-1000 ease-out"}
        style={progress === undefined ? undefined : { strokeDashoffset: 1 - progress }}
      />
      <path d="M526,45 L541,35 L541,53" fill="none" className="stroke-lime" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      {STOPS.map(([x, y, label, pos]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="6" className="fill-forest stroke-sage" strokeWidth="1.75" />
          <text x={x === 30 ? 0 : x} y={pos === "above" ? y - 16 : y + 26} textAnchor={x === 30 ? "start" : "middle"} className="fill-sage/80 font-sans text-[13px]">{label}</text>
        </g>
      ))}
      <text x="566" y="20" textAnchor="end" className="fill-lime font-sans text-[13px] font-medium">Game plan</text>
    </svg>
  );
}
