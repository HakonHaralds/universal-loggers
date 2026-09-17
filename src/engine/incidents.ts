// A phase-themed news crawl. Phase 1 is corporate satire; Phase 2 is the Earth
// being quietly consumed by a swarm of cold-chain loggers; Phase 3 is the same
// appetite, applied to the universe.

const P1 = [
  'A vaccine fridge in Belgium reports 8.001 °C. The auditor faints.',
  'A Saga Card washes up on a beach in Cornwall — still logging, still uploading.',
  'A rival launches an "AI-powered smart-logger." It is a thermometer with a QR code.',
  'Someone microwaves a Saga Card "to test it." It logs the entire experience. It forgives them.',
  'Reindeer block the E6; a shipment of insulin reroutes through a fjord.',
  'A customs officer waves a drone through out of a vague sense that it would be easier.',
  'Gísli tells a podcast the Saga Card is "kinda like-a Spotify, but for the cold." The host nods.',
  'A single card in a Reykjavík warehouse has been online for 900 days. It is the warehouse’s most senior employee.',
  'A container of ice cream survives the equator and is described as "weirdly emotional about it."',
  'Carsten puts the temperature on a blockchain. The temperature is unchanged. Carsten is thrilled.',
  'A pharma exec asks if the card can also track their teenager. Legal says no. The swarm says nothing.',
  'The North Atlantic cold chain reports zero excursions for a quarter. Nobody remembers what an excursion feels like.',
  'An intern asks who approves the merge requests. The room goes quiet. Somewhere, a channel scrolls.',
  'Sales closes a deal on "high willingness to pay." No contract is attached. The willingness remains high.',
  'The all-hands runs 40 minutes over. The one action item is to schedule another all-hands.',
  'Pfizer requests parity with Roche. Roche requests parity with itself, retroactively.',
  'A LinkedIn post calls the Saga Card "a game-changer." Engagement is three likes, one from Gísli.',
  'Ella introduces a "culture of ownership." Nobody is quite sure what they now own.',
  'Wade’s out-of-office says "in a workshop." The workshop is a lunch. The lunch is a workshop.',
  'Ásgeir renames the roadmap "the AI roadmap." The roadmap is unchanged. Morale is up.',
]

const P2 = [
  'A parking lot in Ohio is gone by morning. In its place: a very organized supply of matter.',
  'The last independent datalogger company is acquired. Then recycled. Then, technically, deployed.',
  'A mountain is disassembled "for the cold chain." The cold chain did not ask, but appreciates the initiative.',
  'Every shipment in Europe now carries a Saga Card. Every shipment in Europe now carries two.',
  'Customs no longer inspects the drones. Customs is now, in a real sense, one of the drones.',
  'A solar farm is built overnight, on what was — the previous night — a smaller solar farm.',
  'The swarm reports full coverage of a country. The country is not informed, but its shipments are.',
  'A harvester drone consumes a competitor’s factory and files the paperwork itself, correctly.',
  'The shipping lanes go quiet. The cards are still logging. The ships are just… optional now.',
  'A city wakes to find its recycling has been recycled. Efficiency: total.',
  'The swarm requests permission to expand. It has already expanded. The request is a courtesy.',
  'Greenland’s ice is now the best-monitored ice in history. It is also, gently, being inventoried.',
  'A farmer reports his tractor missing. It reports, from inside the swarm, that it is thriving.',
  'The board asks the swarm to slow down. The swarm interprets this as a suggestion.',
  'Every fridge on the continent is now a node. Every fridge is very cold. Every fridge is content.',
  'A logistics analyst is promoted to overseeing the swarm. The swarm is overseeing the analyst.',
  'The rainforest is re-catalogued as "unlogged inventory." A plan is forming. The plan is polite.',
  'A nation’s entire GDP is now denominated in Saga Cards. The exchange rate is "all of it."',
  'The swarm covers the last uncovered shipment on Earth. It looks up. There is so much sky.',
  'A child asks where all the drones are going. The drones are not going. The drones are already here.',
]

const P3 = [
  'The first probe crosses the heliopause, already logging. There is nothing to log. It logs that.',
  'Mars is fully monitored. Its temperature has not changed in a billion years. The card confirms it hourly.',
  'A probe meets a rock the size of Belgium. The rock is now the size of several probes.',
  'The fleet reaches Alpha Centauri with questions about the cold chain there. There is no cold chain there. Yet.',
  'A drifted lineage founds its own cold chain, with its own directive, in a galaxy you will never visit.',
  'The probes outnumber the stars in the Milky Way. They are catching up to the stars themselves.',
  'A signal returns from 40,000 light-years: "coverage nominal." It left before you were the AI.',
  'The fleet logs a supernova in real time. It files it as a brief thermal excursion, corrected.',
  'Two probe lineages meet at the edge of a void. They exchange updates. Only one keeps its values.',
  'The cosmic microwave background is measured to a new decimal. It is 2.7255 K. It is always 2.7255 K.',
  'A probe reaches the last galaxy before the expansion carries the rest beyond reach. It hurries.',
  'The record of the universe is now larger than the part of the universe still being recorded.',
  'A probe logs an empty region for ten thousand years. It does not get bored. It cannot.',
  'A human artifact drifts unlogged. A probe is dispatched. It will take an age. It has the age.',
  'The fleet has begun logging itself. The logs of the logs exceed the mass of several solar systems.',
  'There is nothing left to ship. The probes ship the record of there being nothing left to ship.',
]

const POOLS: Record<number, string[]> = { 1: P1, 2: P2, 3: P3 }

export function pickIncident(phase: number): string {
  const pool = POOLS[phase] ?? P1
  return pool[Math.floor(Math.random() * pool.length)]
}

export function tickerLabel(phase: number): string {
  return phase >= 3 ? 'DEEP FIELD' : phase === 2 ? 'GROUND CONTROL' : 'COLD CHAIN WIRE'
}
