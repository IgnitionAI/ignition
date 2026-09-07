/** Fixed-step combat rules. Independent of the legacy Duel / saved learning policy. */
export type Move = 'forward' | 'back' | 'left' | 'right';
export type Attack = 'light' | 'heavy' | 'punch' | 'kick';
export type Command = { move?: Move; guard?: boolean; action?: Attack | 'dodge' | 'feint' };
export type Phase = 'ready' | 'windup' | 'active' | 'recover' | 'dodge' | 'stunned';
export const STEP = 1 / 60;
// Shared with animation playback so travelling speed and foot cadence stay aligned.
export const movement = { walkSpeed: 1.8, guardSpeed: 1.15, dodgeSpeed: 5.25 } as const;
export const strikes = {
    light: { windup: .46, active: .12, recover: .44, cost: 18, damage: 16, reach: 2.5 },
    heavy: { windup: .9, active: .2, recover: .65, cost: 32, damage: 30, reach: 2.65 },
    kick: { windup: .55, active: .12, recover: .6, cost: 26, damage: 8, reach: 2.1 },
    punch: { windup: .3, active: .1, recover: .65, cost: 20, damage: 5, reach: 1.8 }
} as const;
export interface Fighter {
    x: number; z: number; health: number; stamina: number; exhausted: boolean;
    phase: Phase; remaining: number; elapsed: number; duration: number;
    attack: Attack; riposte: boolean; riposteUntil: number; serial: number; recovery: number;
    guarding: boolean; guardHeld: boolean; parryUntil: number; move?: Move; dodgeMove: Move;
    chain: number; chainUntil: number; regenAt: number; punchImmuneUntil: number;
}
export interface CombatEvent { kind: 'hit' | 'block' | 'parry' | 'miss' | 'evade' | 'break' | 'feint'; source: number; target: number; attack: Attack; riposte: boolean }
const fighter = (z: number): Fighter => ({ x: 0, z, health: 100, stamina: 100, exhausted: false,
    phase: 'ready', remaining: 0, elapsed: 0, duration: 0, attack: 'light', riposte: false, riposteUntil: -1, serial: 0, recovery: .44, guarding: false, guardHeld: false, parryUntil: -1, dodgeMove: 'back',
    chain: 0, chainUntil: 0, regenAt: 0, punchImmuneUntil: 0 });
export class Combat {
    fighters: [Fighter, Fighter]; time = 0; events: CombatEvent[] = [];
    constructor(distance = 3.8) { this.fighters = [fighter(distance / 2), fighter(-distance / 2)]; }
    get done(): boolean { return this.fighters.some(f => f.health <= 0); }
    distance(): number { const [a,b] = this.fighters; return Math.hypot(a.x-b.x, a.z-b.z); }
    private phase(f: Fighter, phase: Phase, duration: number): void {
        f.phase = phase; f.remaining = duration; f.elapsed = 0;
    }
    private spend(f: Fighter, cost: number): void {
        f.stamina = Math.max(0, f.stamina - cost); f.regenAt = this.time + .9;
        if (f.stamina <= 0) f.exhausted = true;
    }
    private move(f: Fighter, other: Fighter, move: Move, speed: number): void {
        const distance = Math.max(.001, this.distance()), dx = (other.x-f.x)/distance, dz = (other.z-f.z)/distance;
        const vector = { forward: [dx,dz], back: [-dx,-dz], left: [dz,-dx], right: [-dz,dx] }[move];
        f.x += vector[0]*speed*STEP; f.z += vector[1]*speed*STEP;
        const radius = Math.hypot(f.x, f.z); if (radius > 4.6) { f.x *= 4.6/radius; f.z *= 4.6/radius; }
    }
    step(a: Command, b: Command): void {
        if (this.done) return;
        this.events = []; this.time += STEP;
        const contacts: number[] = [];
        this.fighters.forEach((f, i) => {
            const input = i === 0 ? a : b, other = this.fighters[1-i];
            f.move = undefined;
            const freshGuard = !!input.guard && !f.guardHeld; f.guardHeld = !!input.guard;
            f.remaining -= STEP; f.elapsed += STEP;
            if (f.remaining <= 1e-8 && f.phase !== 'ready') {
                if (f.phase === 'windup') { this.phase(f, 'active', strikes[f.attack].active); contacts.push(i); }
                else if (f.phase === 'active') this.phase(f, 'recover', f.recovery + (f.chain >= 3 ? .45 : 0));
                else { this.phase(f, 'ready', 0); if (f.chain >= 3) f.chain = 0; }
            }
            f.guarding = f.phase === 'ready' && !!input.guard;
            if (freshGuard && f.guarding) f.parryUntil = this.time + .15;
            if (f.phase === 'ready') {
                if (this.time > f.chainUntil) f.chain = 0;
                if (input.move) { f.move = input.move; this.move(f, other, input.move, f.guarding ? movement.guardSpeed : movement.walkSpeed); }
                if (input.action && input.action !== 'feint' && !f.exhausted) {
                    const cost = input.action === 'dodge' ? 24 : strikes[input.action].cost;
                    if (f.stamina >= cost) {
                        this.spend(f, cost); f.guarding = false; f.serial++;
                        if (input.action === 'dodge') {
                            f.dodgeMove = input.move ?? 'back'; f.duration = .65; this.phase(f, 'dodge', .65);
                        } else {
                            f.riposte = input.action === 'light' && this.time <= f.riposteUntil; f.riposteUntil = -1;
                            f.attack = input.action; f.recovery = strikes[f.attack].recover; f.chain++;
                            f.duration = strikes[f.attack].windup + strikes[f.attack].active + f.recovery + (f.chain >= 3 ? .45 : 0);
                            f.chainUntil = this.time + f.duration + .35;
                            this.phase(f, 'windup', strikes[f.attack].windup);
                        }
                    }
                }
            } else if (input.action === 'feint' && f.phase === 'windup' && f.attack === 'heavy' && !f.exhausted && f.stamina >= 10) {
                this.spend(f, 10); this.phase(f, 'recover', .22); f.chain = 0;
                this.events.push({ kind: 'feint', source: i, target: 1-i, attack: f.attack, riposte: false });
            }
            if (f.phase === 'dodge' && f.elapsed < .3) this.move(f, other, f.dodgeMove, movement.dodgeSpeed);
            if (f.phase === 'ready' && !f.guarding && this.time >= f.regenAt) f.stamina = Math.min(100, f.stamina + 18*STEP);
            if (f.exhausted && f.stamina >= 25) f.exhausted = false;
        });
        // Contacts use the same phase snapshot so simultaneous blows can trade.
        const snapshot = this.fighters.map(f => ({ ...f }));
        for (const i of contacts) this.contact(i, snapshot);
        const [p,q] = this.fighters, distance = this.distance();
        if (distance < 1.45) {
            const dx = distance > .001 ? (q.x-p.x)/distance : 0, dz = distance > .001 ? (q.z-p.z)/distance : -1;
            const push = (1.45-distance)/2; p.x -= dx*push; p.z -= dz*push; q.x += dx*push; q.z += dz*push;
        }
    }
    private contact(i: number, snapshot: Fighter[]): void {
        const attacker = this.fighters[i], target = this.fighters[1-i], before = snapshot[1-i], attack = snapshot[i].attack;
        let kind: CombatEvent['kind'];
        const distance = Math.hypot(before.x-snapshot[i].x, before.z-snapshot[i].z);
        if (distance > strikes[attack].reach) kind = 'miss';
        else if (before.phase === 'dodge' && before.elapsed >= .04 && before.elapsed <= .27) kind = 'evade';
        else if (attack !== 'punch' && before.guarding) {
            if (this.time <= before.parryUntil && !before.exhausted) {
                kind = 'parry'; target.riposteUntil = this.time + .55; this.phase(attacker, 'stunned', 1.1); attacker.chain = 0;
            } else {
                kind = before.exhausted ? 'break' : 'block'; this.spend(target, attack === 'heavy' ? 26 : 14);
                if (kind === 'break') this.phase(target, 'stunned', .9);
            }
        } else {
            kind = 'hit'; target.health = Math.max(0, target.health - strikes[attack].damage);
            if (attack === 'kick') {
                const divisor = Math.max(.001, distance);
                target.x += (before.x-snapshot[i].x)/divisor*.65; target.z += (before.z-snapshot[i].z)/divisor*.65;
                const radius = Math.hypot(target.x,target.z);
                if (radius>4.6) { target.x *= 4.6/radius; target.z *= 4.6/radius; }
            }
            const armour = before.attack === 'heavy' && before.phase === 'active' && attack === 'light';
            const protectedPunch = attack === 'punch' && this.time < before.punchImmuneUntil;
            if (!armour && !protectedPunch) {
                const opensGuard = attack === 'punch' && before.guarding;
                this.phase(target, 'stunned', opensGuard ? .72 : .3); target.chain = 0;
                if (opensGuard) { attacker.recovery = .12; kind = 'break'; target.punchImmuneUntil = this.time + 2.5; }
            }
        }
        target.guarding = target.guarding && target.phase === 'ready';
        this.events.push({ kind, source: i, target: 1-i, attack, riposte: snapshot[i].riposte });
    }
    /** Deliberately scripted, readable sparring partner; not an Ignition policy. */
    opponent(): Command {
        const f = this.fighters[1], p = this.fighters[0];
        if (f.phase !== 'ready') return {};
        if (f.exhausted || f.stamina < 24) return { move: 'back' };
        const beat = Math.floor(this.time / 2.7);
        const attack = (['heavy','light','punch','kick'] as const)[beat % 4];
        if (this.distance() > strikes[attack].reach-.15) return { move: 'forward' };
        if (p.phase === 'windup' && beat % 3 !== 0) return { guard: true };
        if (this.time % 2.7 < .08) return { action: attack };
        return {};
    }
}
