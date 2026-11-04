import { CombatWorld } from '../src/engine.mjs';

const world = new CombatWorld({ startingGap: 1.3 });
const events = [];
for (let tick = 0; tick < 900 && !world.finished; tick++) {
  const input = {
    blue: tick % 65 === 0 ? { attack: 'palm' } : {},
    red: tick % 83 === 0 ? { attack: 'jab' } : {}
  };
  events.push(...world.step(input));
}
console.log(JSON.stringify({ events, final: world.snapshot() }, null, 2));
