import { RaceWorld } from "./race";

export const OBSERVATION_CONTRACT = "racing-observation-v1";
export const OBSERVATION_SIZE = 20;
const clamp = (n: number) => Math.max(-1, Math.min(1, n));
/** Track-relative sensors, identical in collection, evaluation and races. */
export function observeDriver(race: RaceWorld, id = 0): number[] {
  const car = race.drivers[id].world.car;
  const near = race.track.nearest(car.x, car.z);
  const heading = Math.atan2(
    Math.sin(near.angle - car.angle),
    Math.cos(near.angle - car.angle),
  );
  const lateral =
    (car.x - near.x) * -Math.sin(near.angle) +
    (car.z - near.z) * Math.cos(near.angle);
  const result = [
    car.speed / 32,
    car.steering,
    clamp(lateral / (race.track.width / 2)),
    heading / Math.PI,
  ];
  for (const meters of [3 + car.speed * 0.15, 10, 20, 35]) {
    const target = race.track.sample(
      near.progress + meters / race.track.length,
    );
    const error = Math.atan2(
      Math.sin(Math.atan2(target.z - car.z, target.x - car.x) - car.angle),
      Math.cos(Math.atan2(target.z - car.z, target.x - car.x) - car.angle),
    );
    result.push(clamp(error / 0.6));
  }
  const opponents = race.drivers
    .filter((d) => d.id !== id)
    .map((d) => {
      const dx = d.world.car.x - car.x,
        dz = d.world.car.z - car.z;
      return {
        distance: Math.hypot(dx, dz),
        values: [
          clamp((dx * Math.cos(car.angle) + dz * Math.sin(car.angle)) / 30),
          clamp((-dx * Math.sin(car.angle) + dz * Math.cos(car.angle)) / 10),
          (d.world.car.speed - car.speed) / 32,
          1,
        ],
      };
    })
    .sort((a, b) => a.distance - b.distance);
  for (let i = 0; i < 3; i++)
    result.push(...(opponents[i]?.values ?? [0, 0, 0, 0]));
  return result;
}
