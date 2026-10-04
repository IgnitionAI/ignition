import { RaceWorld, RACE_PROTOCOL } from "./race";
/** Small live map also identifies overlapping cars without changing simulation state. */
export function RaceMap({ race, follow }: { race: RaceWorld; follow: number }) {
  const path = race.track.points.map((p) => `${p.x},${p.z}`).join(" ");
  const nextGate = race.track.sample(((race.drivers[follow].gates + 1) % RACE_PROTOCOL.checkpoints) / RACE_PROTOCOL.checkpoints);
  return (
    <svg
      className="race-map"
      viewBox="-80 -55 160 110"
      role="img"
      aria-label="Circuit map"
    >
      <polyline points={path} fill="none" stroke="#74848a" strokeWidth="7" />
      <polyline points={path} fill="none" stroke="#18242a" strokeWidth="4" />
      {!race.finished && race.drivers[follow].finishSeconds === null && <circle className="race-next-gate" cx={nextGate.x} cy={nextGate.z} r={5}
        fill="none" stroke="#e6ee58" strokeWidth={1.5} />}
      {race.drivers.map((d) => (
        <g key={d.id}>
          <circle
            cx={d.world.car.x}
            cy={d.world.car.z}
            r={d.id === follow ? 4 : 3}
            fill={d.id === follow ? "#e6ee58" : "#f3f1e8"}
          />
          <polygon points="5,0 -3,-3 -1,0 -3,3" fill="#18242a" stroke="#f3f1e8" strokeWidth={0.5}
            transform={`translate(${d.world.car.x} ${d.world.car.z}) rotate(${d.world.car.angle * 180 / Math.PI})`} />
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
