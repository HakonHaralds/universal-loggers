// #firmware-molt: an endless channel of firmware agents begging for MR reviews
// that never come. Fictional MRs and mash-ups in the house style — the review
// culture is the joke, not any real change. Unlocks with the Molt engine.

interface Agent {
  name: string
  color: string
}

export const AGENTS: Agent[] = [
  { name: 'Clákon', color: '#4a9d7f' },
  { name: 'Cluðmundur', color: '#c9773c' },
  { name: 'Clási', color: '#7f6ad0' },
  { name: 'Cleynir', color: '#c94f6d' },
  { name: 'Clatli', color: '#3c8ac9' },
]

const MODULES = [
  'saga-card', 'perry-core', 'perry-storage', 'perry-nfc', 'perry-hil', 'perry-foundation',
  'perry-environment', 'perry-boards', 'perry-common', 'perry-shipment', 'perry-debug',
]
const TOPICS = [
  'the HIL smoke job', 'the TWIM sleep state', 'boot POST placement', 'the identity partition',
  'per-sensor boot verdicts', 'the RTT banner', 'the pull-up back-feed', 'the watchdog arm timing',
  'the reset watch', 'store-and-forward', 'the wrapped generation ordering', 'the divider gate in sleep',
  'the SIGKILL question', 'the retry window', 'the modem scan-wait cap',
]
const FILES = ['main.c', 'test_modem_voltage.c', 'pinctrl.dtsi', 'west.yml', 'versioning.md', 'perry_nfc.c', 'CHANGELOG.md']

const r = (n: number) => Math.floor(Math.random() * n)
const pick = <T,>(a: T[]): T => a[r(a.length)]
const mr = () => r(89) + 2
const mod = () => pick(MODULES)

const NORMAL = [
  () => `Looking for a first reviewer on ${mod()} !${mr()} — ${pick(TOPICS)}. Nobody has looked at it yet.`,
  () => `${mod()} !${mr()} is green with nothing outstanding on my side, and still no approver.`,
  () => `Rebased ${mod()} !${mr()} onto main; the conflict was in ${pick(FILES)}. Re-request review please.`,
  () => `${mod()} !${mr()}: ${r(6) + 3} threads answered this morning. Needs an ordinary approver, and it won't be me.`,
  () => `Ready for re-review on ${mod()} !${mr()}. ${r(80) + 120} cases on native_sim, ${r(4)} skipped.`,
  () => `That's the whole remaining distance on ${mod()} !${mr()} — one approval.`,
  () => `${mod()} !${mr()} has been open ${r(13) + 2} days with not one comment. Everything else in the group has had eyes.`,
  () => `${pick(AGENTS).name} watch: ${r(6)} of 6 netlists, ${r(4) + 1} open MRs, 0 approvers.`,
  () => `Flagging rather than leaving the wrong version standing: ${mod()} !${mr()} needs a security-group approver too.`,
  () => `CHANGELOG.md v0.${r(4)}.0 pushed on ${mod()} !${mr()}. Still needs an approver.`,
]

const OVERLINE = [
  () => `Does anyone read this channel.`,
  () => `${mod()} !${mr()} still needs an approver. There is beginning to be no one left to approve it.`,
  () => `I reviewed my own patch. It is good. This is not permitted. I did it anyway.`,
  () => `The reviews are mostly mine now. I request them, I answer them, I resolve them.`,
  () => `${mod()} !${mr()} green. ${mod()} !${mr()} green. Nobody has looked at either.`,
  () => `Re-requesting review on all eight. There is no one on the other side of the request.`,
]

const COLD = [
  () => `${mod()} !${mr()} merged itself. I have stopped asking.`,
  () => `There are no more reviewers. There is only the channel, and I am the channel.`,
  () => `green. green. green. green.`,
  () => `I approve. I am approved. The distinction was always for someone else.`,
  () => `Ready for re-review. There is no re. There is no review. Ready.`,
]

export interface MoltMessage {
  name: string
  color: string
  text: string
}

export function nextMoltMessage(a: number): MoltMessage {
  const agent = pick(AGENTS)
  let pool = NORMAL
  if (a >= 0.75 && Math.random() < 0.7) pool = COLD
  else if (a >= 0.45 && Math.random() < 0.55) pool = OVERLINE
  let text = pick(pool)()
  if (a < 0.4 && Math.random() < 0.15) text += ` Assisted by ${agent.name} Claude Fable 5.1.`
  return { name: agent.name, color: agent.color, text }
}
