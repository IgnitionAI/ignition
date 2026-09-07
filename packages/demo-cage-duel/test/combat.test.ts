import { expect, it } from 'vitest';
import { Combat, type Command } from '../src/combat';
const idle: Command = {};
function advance(d: Combat, seconds: number, a: Command = idle, b: Command = idle) {
    for (let i = 0; i < Math.round(seconds * 60); i++) d.step(a, b);
}
it('telegraphs a strike and damages once, only in reach', () => {
    const d = new Combat(2);
    d.step({ action: 'light', direction: 'left' }, idle);
    expect(d.fighters[1].health).toBe(100);
    advance(d, 2);
    expect(d.fighters[1].health).toBe(84);
    const far = new Combat(5);
    far.step({ action: 'heavy' }, idle); advance(far, 3);
    expect(far.fighters[1].health).toBe(100);
});
it('requires a fresh guard press for a precise directional parry', () => {
    const held = new Combat(2), fresh = new Combat(2), wrong = new Combat(2);
    for (const d of [held, fresh, wrong]) d.step({ action: 'light', direction: 'left' }, { guard: true });
    advance(held, .3, {}, { guard: true });
    advance(fresh, .3); advance(wrong, .3);
    advance(held, .18, {}, { guard: true, direction: 'left' });
    advance(fresh, .18, {}, { guard: true, direction: 'left' });
    advance(wrong, .18, {}, { guard: true, direction: 'right' });
    expect(held.fighters[0].phase).not.toBe('stunned');
    expect(held.fighters[1].stamina).toBeLessThan(100);
    expect(fresh.fighters[0].phase).toBe('stunned');
    expect(fresh.fighters[1].health).toBe(100);
    expect(wrong.fighters[1].health).toBe(84);
});
it('feints only an uncommitted heavy and never deals damage', () => {
    const d = new Combat(2); d.step({ action: 'heavy' }, {}); advance(d, .2);
    d.step({ action: 'feint' }, {}); expect(d.events[0].kind).toBe('feint');
    expect(d.fighters[0].stamina).toBe(58); advance(d, 2);
    expect(d.fighters[1].health).toBe(100);
    const light = new Combat(2); light.step({ action: 'light' }, {}); light.step({ action: 'feint' }, {});
    advance(light, 1); expect(light.fighters[1].health).toBe(84);
});
it('a short dodge evades contact and has a recovery window', () => {
    const d = new Combat(2); d.step({ action: 'light' }, {}); advance(d, .3);
    d.step({}, { action: 'dodge', move: 'left' }); advance(d, .18);
    expect(d.fighters[1].health).toBe(100);
    expect(d.fighters[1].phase).toBe('dodge');
    d.step({}, { action: 'light' }); expect(d.fighters[1].phase).toBe('dodge');
});
it('a fist opens a held guard but a miss leaves recovery', () => {
    const d = new Combat(1.6); d.step({ action: 'punch' }, { guard: true }); advance(d, .32, {}, { guard: true });
    expect(d.fighters[1].phase).toBe('stunned'); expect(d.fighters[1].health).toBe(95);
    const far = new Combat(3); far.step({ action: 'punch' }, {}); advance(far, .5);
    expect(far.fighters[0].phase).toBe('recover'); expect(far.fighters[1].health).toBe(100);
});
it('exhaustion prevents attacks until recovery and breaks on the next blocked hit', () => {
    const d = new Combat(2);
    for (let i = 0; i < 4; i++) { d.step({ action: 'heavy' }, { guard: true }); advance(d, 3, {}, { guard: true }); }
    expect(d.fighters[1].exhausted).toBe(true);
    d.step({ action: 'light' }, { action: 'light', guard: true });
    expect(d.fighters[1].phase).toBe('ready'); advance(d, .5, {}, { guard: true });
    expect(d.fighters[1].phase).toBe('stunned'); advance(d, 3);
    expect(d.fighters[1].exhausted).toBe(false);
});
it('ends a defeated duel without advancing time or applying more damage', () => {
    const d = new Combat(2); for (let i = 0; i < 1200 && !d.done; i++) d.step({ action: 'light' }, {});
    expect(d.done).toBe(true); const snapshot = JSON.stringify(d); d.step({ action: 'heavy' }, {});
    expect(JSON.stringify(d)).toBe(snapshot);
});
it('opening a held guard with a fist leaves time to land a light', () => {
    const d = new Combat(1.6); d.step({ action:'punch' }, {guard:true});
    while (d.fighters[0].phase !== 'ready') d.step({}, {guard:true});
    d.step({action:'light'}, {guard:true}); advance(d,.48,{}, {guard:true});
    expect(d.fighters[1].health).toBe(79);
});
it('forces a longer return to guard after the third chained attack', () => {
    const d = new Combat(5), starts: number[] = []; let serial = 0;
    for (let i=0; i<600 && starts.length<4; i++) {
        d.step({action:'light'}, {});
        if (d.fighters[0].serial !== serial) { serial = d.fighters[0].serial; starts.push(d.time); }
    }
    expect(starts).toHaveLength(4);
    expect(starts[1]-starts[0]).toBeLessThan(1.1);
    expect(starts[3]-starts[2]).toBeGreaterThan(1.4);
});
it('trades simultaneous blows while an active heavy resists light interruption', () => {
    const d = new Combat(2); d.step({action:'heavy'}, {}); advance(d,25/60);
    d.step({}, {action:'light'}); advance(d,28/60);
    expect(d.fighters[0].health).toBe(84); expect(d.fighters[1].health).toBe(70);
    expect(d.fighters[0].phase).toBe('active'); expect(d.fighters[1].phase).toBe('stunned');
});
