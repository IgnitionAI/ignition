/** Fixed 100 ms simulation ticks; rendering and learning share this contract. */
export enum Action {
    Idle,
    Advance,
    Retreat,
    Left,
    Right,
    Attack,
    Guard
}
export type Phase = 'ready' | 'windup' | 'recover' | 'stunned';
export interface Fighter {
    x: number;
    z: number;
    health: number;
    stamina: number;
    phase: Phase;
    timer: number;
    guard: boolean;
    guardAge: number;
}
export interface Impact {
    kind: 'hit' | 'block' | 'parry';
    target: number;
    tick: number;
}
export const TICK_SECONDS = .1;
export const ROUND_TICKS = 600;
export const REACH = 2.65;
export class Duel {
    fighters: [
        Fighter,
        Fighter
    ];
    tick = 0;
    events: Impact[] = [];
    constructor(public seed = 1, distance = 4.5) {
        const make = (z: number): Fighter => ({ x: 0, z, health: 100, stamina: 100, phase: 'ready', timer: 0, guard: false, guardAge: 0 });
        this.fighters = [make(distance / 2), make(-distance / 2)];
    }
    get distance(): number { const [a, b] = this.fighters; return Math.hypot(a.x - b.x, a.z - b.z); }
    get done(): boolean { return this.fighters.some(f => f.health <= 0) || this.tick >= ROUND_TICKS; }
    step(a: Action, b: Action): void {
        if (this.done)
            return;
        this.tick++;
        this.events = [];
        const actions = [a, b];
        const strikes: number[] = [];
        this.fighters.forEach((f, i) => {
            const other = this.fighters[1 - i];
            const wasGuard = f.guard;
            f.guard = false;
            if (f.timer > 0) {
                f.timer--;
                if (f.timer === 0) {
                    if (f.phase === 'windup') {
                        strikes.push(i);
                        f.phase = 'recover';
                        f.timer = 6;
                    }
                    else
                        f.phase = 'ready';
                }
            }
            if (f.phase === 'ready') {
                if (actions[i] === Action.Attack && f.stamina >= 24) {
                    f.stamina -= 24;
                    f.phase = 'windup';
                    f.timer = 4;
                }
                else if (actions[i] === Action.Guard && f.stamina >= 5) {
                    f.guard = true;
                    f.stamina -= 2;
                }
                else {
                    const d = Math.max(.001, this.distance), dx = (other.x - f.x) / d, dz = (other.z - f.z) / d;
                    const move = actions[i] === Action.Advance ? 1 : actions[i] === Action.Retreat ? -1 : 0;
                    const side = actions[i] === Action.Left ? 1 : actions[i] === Action.Right ? -1 : 0;
                    f.x += .23 * (dx * move + dz * side);
                    f.z += .23 * (dz * move - dx * side);
                }
            }
            f.guardAge = f.guard ? (wasGuard ? f.guardAge + 1 : 1) : 0;
            if (!f.guard && f.phase !== 'windup')
                f.stamina = Math.min(100, f.stamina + 2);
            const radius = Math.hypot(f.x, f.z);
            if (radius > 5.3) {
                f.x *= 5.3 / radius;
                f.z *= 5.3 / radius;
            }
        });
        // Resolve contacts simultaneously; one strike is consumed even when it misses.
        const range = this.distance;
        const contacts = strikes.filter(() => range <= REACH).map(i => ({ attacker: i, target: 1 - i, guard: this.fighters[1 - i].guard, age: this.fighters[1 - i].guardAge }));
        for (const c of contacts) {
            const target = this.fighters[c.target], attacker = this.fighters[c.attacker];
            const parry = c.guard && c.age <= 2;
            const kind = parry ? 'parry' : c.guard ? 'block' : 'hit';
            target.health = Math.max(0, target.health - (parry ? 0 : c.guard ? 3 : 20));
            if (parry) {
                attacker.phase = 'stunned';
                attacker.timer = 9;
                target.stamina = Math.min(100, target.stamina + 10);
            }
            else if (c.guard)
                target.stamina = Math.max(0, target.stamina - 12);
            this.events.push({ kind, target: c.target, tick: this.tick });
        }
        const [p, q] = this.fighters, d = this.distance;
        if (d < 1.3) {
            const dx = d > .001 ? (p.x - q.x) / d : 0, dz = d > .001 ? (p.z - q.z) / d : 1;
            const k = (1.3 - d) / 2;
            p.x += dx * k;
            p.z += dz * k;
            q.x -= dx * k;
            q.z -= dz * k;
        }
    }
    observe(i: number): number[] {
        const f = this.fighters[i], o = this.fighters[1 - i];
        const phase = (v: Fighter) => v.phase === 'windup' ? (v.timer <= 2 ? 2 : 1) : v.phase === 'recover' ? 3 : v.phase === 'stunned' ? 4 : 0;
        return [Math.min(5, Math.floor(this.distance / .7)), phase(o), phase(f), Math.min(5, Math.floor(f.stamina / 20))];
    }
    reference(i: number): Action {
        const f = this.fighters[i], o = this.fighters[1 - i];
        if (this.distance > 2.3)
            return Action.Advance;
        if (o.phase === 'windup' && o.timer <= 2 && (this.tick + this.seed) % 4 !== 0)
            return Action.Guard;
        if (f.stamina < 26)
            return Action.Retreat;
        return (this.tick + this.seed) % 9 < 6 ? Action.Attack : Action.Idle;
    }
}
