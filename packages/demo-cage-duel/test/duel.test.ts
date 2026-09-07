import { describe, it, expect } from 'vitest';
import { Duel, Action } from '../src/duel';
describe('duel combat contract', () => {
    it('telegraphs an attack and applies its damage once, only within reach', () => {
        const duel = new Duel(1, 2);
        duel.step(Action.Attack, Action.Idle);
        expect(duel.fighters[1].health).toBe(100);
        for (let i = 0; i < 4; i++)
            duel.step(Action.Idle, Action.Idle);
        expect(duel.fighters[1].health).toBe(80);
        for (let i = 0; i < 6; i++)
            duel.step(Action.Idle, Action.Idle);
        expect(duel.fighters[1].health).toBe(80);
        const far = new Duel(1, 5);
        for (let i = 0; i < 5; i++)
            far.step(Action.Attack, Action.Idle);
        expect(far.fighters[1].health).toBe(100);
    });
});
it('a timed parry avoids damage and opens a counter window', () => {
    const d = new Duel(1, 2);
    d.step(Action.Attack, Action.Idle);
    d.step(Action.Idle, Action.Idle);
    d.step(Action.Idle, Action.Idle);
    d.step(Action.Idle, Action.Guard);
    d.step(Action.Idle, Action.Guard);
    expect(d.fighters[1].health).toBe(100);
    expect(d.fighters[0].phase).toBe('stunned');
    expect(d.events[0].kind).toBe('parry');
});
it('held guard reduces damage but consumes stamina', () => {
    const d = new Duel(1, 2);
    for (let i = 0; i < 5; i++)
        d.step(i === 0 ? Action.Attack : Action.Idle, Action.Guard);
    expect(d.fighters[1].health).toBe(97);
    expect(d.fighters[1].stamina).toBeLessThan(100);
});
it('a finished duel cannot apply further hits or advance time', () => {
    const d = new Duel(1, 2);
    while (!d.done)
        d.step(Action.Attack, Action.Idle);
    const snapshot = JSON.stringify(d);
    d.step(Action.Attack, Action.Attack);
    expect(JSON.stringify(d)).toBe(snapshot);
});
