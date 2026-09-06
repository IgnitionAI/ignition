import { RaceWorld } from "./race";
/** Small live map also identifies overlapping cars without changing simulation state. */
export function RaceMap({ race, follow }: { race: RaceWorld; follow: number }) {
  const path = race.track.points.map((p) => `${p.x},${p.z}`).join(" ");
  return (
    <svg
      className="race-map"
      viewBox="-80 -55 160 110"
      role="img"
      aria-label="Circuit map"
    >
      <polyline points={path} fill="none" stroke="#74848a" strokeWidth="7" />
      <polyline points={path} fill="none" stroke="#18242a" strokeWidth="4" />
      {race.drivers.map((d) => (
        <g key={d.id}>
          <circle
            cx={d.world.car.x}
            cy={d.world.car.z}
            r={d.id === follow ? 4 : 3}
            fill={d.id === follow ? "#e6ee58" : "#f3f1e8"}
          />
          <text
            x={d.world.car.x + 4}
            y={d.world.car.z - 4}
            fill="white"
            fontSize="7"
          >
            {d.id + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
