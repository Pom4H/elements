import { registerEditingElements } from '@pom4h/elements-core/editing';
import { registerProcessElements } from '@pom4h/process-elements/register';
import { enableSceneDragging } from './drag.js';
import './style.css';

registerProcessElements();
registerEditingElements();

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing playground element: ${selector}`);
  return element;
}

function randomBits(length: number, probability = .5): string {
  return Array.from({ length }, () => Math.random() < probability ? '1' : '0').join('');
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/* Scene: T-101 drain header tees to a duty and a standby train. */

const processScene = required<HTMLElement>('.process-scene');
const tankNode = required<HTMLElement>('#t1');
const headerPipe = required<HTMLElement>('#header');
const branchPipe = required<HTMLElement>('#branches');
const recyclePipe = required<HTMLElement>('#recycle');
const ventPipe = required<HTMLElement>('#vent');
const command = required<HTMLInputElement>('#command');
const commandValue = required<HTMLOutputElement>('#command-value');
const commandB = required<HTMLInputElement>('#command-b');
const commandBValue = required<HTMLOutputElement>('#command-b-value');
const medium = required<HTMLSelectElement>('#medium');
const pumpPower = required<HTMLButtonElement>('#pump-power');
const standby = required<HTMLButtonElement>('#standby');
const valveJam = required<HTMLButtonElement>('#valve-jam');
const sceneNote = required<HTMLElement>('#scene-note');

interface Train {
  readonly valve: HTMLElement;
  readonly pump: HTMLElement;
  readonly feed: HTMLElement;
  readonly command: HTMLInputElement;
  travel: number;
  running: boolean;
  jammed: boolean;
}

const trains: readonly Train[] = [
  {
    valve: required('#v1'), pump: required('#p1'), feed: required('#feed-a'),
    command, travel: 68, running: true, jammed: false,
  },
  {
    valve: required('#v2'), pump: required('#p2'), feed: required('#feed-b'),
    command: commandB, travel: 35, running: false, jammed: false,
  },
];

const scene = { level: 72 };

function trainFlow(train: Train): number {
  return train.running ? train.travel / 100 : 0;
}

function renderScene(): void {
  for (const train of trains) {
    const flow = trainFlow(train);
    train.valve.setAttribute('position', train.travel.toFixed(1));
    train.valve.setAttribute('command', train.command.value);
    train.valve.toggleAttribute('stuck', train.jammed);
    train.valve.setAttribute('status', train.jammed ? 'warning' : 'normal');

    train.pump.toggleAttribute('running', train.running);
    train.pump.setAttribute('speed', train.running ? '1450' : '0');
    train.pump.setAttribute('value', (train.running ? 2.4 + flow * 4.6 : 0).toFixed(1));
    train.pump.setAttribute('status', train.running ? 'normal' : 'idle');

    train.feed.toggleAttribute('flowing', flow > 0.02);
    train.feed.setAttribute('speed', (0.35 + flow * 1.6).toFixed(2));
  }

  const total = trains.reduce((sum, train) => sum + trainFlow(train), 0);
  tankNode.setAttribute('level', scene.level.toFixed(1));
  for (const pipe of [headerPipe, branchPipe]) {
    pipe.toggleAttribute('flowing', total > 0.02);
    pipe.setAttribute('speed', (0.35 + total * 1.1).toFixed(2));
  }

  // Only the duty train recycles, and the vent tap follows the run it branches off.
  const recycling = trainFlow(trains[0]!) > 0.02;
  recyclePipe.toggleAttribute('flowing', recycling);
  ventPipe.toggleAttribute('flowing', recycling);

  commandValue.value = `${command.value}%`;
  commandBValue.value = `${commandB.value}%`;

  const jammed = trains.filter((train) => train.jammed);
  sceneNote.textContent = jammed.length > 0
    ? `${jammed.map((train) => train.valve.getAttribute('label')).join(', ')} jammed and no longer following command.`
    : `T-101 at ${Math.round(scene.level)}% · header ${total > 0.02 ? 'in service' : 'idle'} · drag equipment to re-route.`;
}

// A small process model so the scene evolves on its own: valves stroke towards
// their command, running pumps drain T-101, and make-up refills the vessel once
// it reaches the low limit.
let refilling = false;
setInterval(() => {
  for (const train of trains) {
    const target = Number(train.command.value);
    if (!train.jammed && Math.abs(target - train.travel) > 0.3) {
      train.travel += clamp(target - train.travel, -2.2, 2.2);
    }
  }

  const draw = trains.reduce((sum, train) => sum + trainFlow(train) * 0.55, 0);
  if (scene.level <= 12) refilling = true;
  if (scene.level >= 82) refilling = false;
  scene.level = clamp(scene.level - draw + (refilling ? 0.9 : 0), 0, 100);

  renderScene();
}, 220);

for (const train of trains) train.command.addEventListener('input', renderScene);

medium.addEventListener('change', () => {
  tankNode.setAttribute('medium', medium.value);
  for (const train of trains) train.valve.setAttribute('medium', medium.value);
});

pumpPower.addEventListener('click', () => {
  const duty = trains[0]!;
  duty.running = !duty.running;
  pumpPower.textContent = duty.running ? 'Stop P-101' : 'Start P-101';
  renderScene();
});

standby.addEventListener('click', () => {
  const spare = trains[1]!;
  spare.running = !spare.running;
  standby.textContent = spare.running ? 'Stop P-102' : 'Start P-102';
  renderScene();
});

valveJam.addEventListener('click', () => {
  const duty = trains[0]!;
  duty.jammed = !duty.jammed;
  valveJam.textContent = duty.jammed ? 'Release FV-101' : 'Jam FV-101';
  renderScene();
});

enableSceneDragging(processScene, { grid: 12 });
renderScene();

/* Control valve card. */

const valve = required<HTMLElement>('#valve');
const valvePosition = required<HTMLInputElement>('#valve-position');
const valvePositionValue = required<HTMLOutputElement>('#valve-position-value');
const valveCommand = required<HTMLInputElement>('#valve-command');
const valveCommandValue = required<HTMLOutputElement>('#valve-command-value');
const valveAction = required<HTMLSelectElement>('#valve-action');
const valveMode = required<HTMLButtonElement>('#valve-mode');

valvePosition.addEventListener('input', () => {
  valve.setAttribute('position', valvePosition.value);
  valvePositionValue.value = `${valvePosition.value}%`;
});

valveCommand.addEventListener('input', () => {
  valve.setAttribute('command', valveCommand.value);
  valveCommandValue.value = `${valveCommand.value}%`;
});

valveAction.addEventListener('change', () => valve.setAttribute('action', valveAction.value));

valveMode.addEventListener('click', () => {
  const manual = valve.getAttribute('mode') !== 'manual';
  valve.setAttribute('mode', manual ? 'manual' : 'auto');
  valve.setAttribute('actuator', manual ? 'electric' : 'pneumatic');
  valveMode.textContent = manual ? 'Go auto' : 'Go manual';
});

/* Tank card. */

const tank = required<HTMLElement>('#tank');
const tankLevel = required<HTMLInputElement>('#tank-level');
const tankLevelValue = required<HTMLOutputElement>('#tank-level-value');
const tankNozzles = required<HTMLSelectElement>('#tank-nozzles');
const tankOrientation = required<HTMLSelectElement>('#tank-orientation');
const tankAgitator = required<HTMLButtonElement>('#tank-agitator');

tankLevel.addEventListener('input', () => {
  tank.setAttribute('level', tankLevel.value);
  tankLevelValue.value = `${tankLevel.value}%`;
});

tankNozzles.addEventListener('change', () => tank.setAttribute('nozzles', tankNozzles.value));
tankOrientation.addEventListener('change', () => tank.setAttribute('orientation', tankOrientation.value));

tankAgitator.addEventListener('click', () => {
  const running = tank.getAttribute('agitator-speed') === '0';
  tank.setAttribute('agitator-speed', running ? '55' : '0');
  tankAgitator.textContent = running ? 'Stop agitator' : 'Start agitator';
});

/* Pump card. */

const pump = required<HTMLElement>('#pump');
const speed = required<HTMLInputElement>('#speed');
const speedValue = required<HTMLOutputElement>('#speed-value');
const pumpStatus = required<HTMLSelectElement>('#pump-status');
const pumpQuality = required<HTMLSelectElement>('#pump-quality');
const pumpToggle = required<HTMLButtonElement>('#pump-toggle');

speed.addEventListener('input', () => {
  const value = Number(speed.value);
  pump.setAttribute('speed', speed.value);
  pump.toggleAttribute('running', value > 0);
  speedValue.value = `${value} rpm`;
  pumpToggle.textContent = value > 0 ? 'Stop' : 'Start';
});

pumpStatus.addEventListener('change', () => pump.setAttribute('status', pumpStatus.value));
pumpQuality.addEventListener('change', () => pump.setAttribute('quality', pumpQuality.value));

pumpToggle.addEventListener('click', () => {
  const running = !pump.hasAttribute('running');
  pump.toggleAttribute('running', running);
  pump.setAttribute('speed', running ? speed.value : '0');
  pumpToggle.textContent = running ? 'Stop' : 'Start';
});

/* Controller card. */

const controller = required<HTMLElement>('#controller');
const channels = required<HTMLSelectElement>('#channels');
const load = required<HTMLInputElement>('#load');
const loadValue = required<HTMLOutputElement>('#load-value');
const activity = required<HTMLButtonElement>('#activity');
const controllerAlarm = required<HTMLButtonElement>('#controller-alarm');

channels.addEventListener('change', () => {
  const count = Number(channels.value);
  controller.setAttribute('inputs', String(count));
  controller.setAttribute('outputs', String(count));
  controller.setAttribute('input-state', randomBits(count, .55));
  controller.setAttribute('output-state', randomBits(count, .38));
});

load.addEventListener('input', () => {
  controller.setAttribute('load', load.value);
  loadValue.value = `${load.value}%`;
});

activity.addEventListener('click', () => {
  const count = Number(controller.getAttribute('inputs') ?? 16);
  controller.setAttribute('activity', String(Number(controller.getAttribute('activity') ?? 0) + 1));
  controller.setAttribute('input-state', randomBits(count, .55));
});

controllerAlarm.addEventListener('click', () => {
  const alarm = controller.getAttribute('status') !== 'alarm';
  controller.setAttribute('status', alarm ? 'alarm' : 'normal');
  controllerAlarm.textContent = alarm ? 'Clear fault' : 'Toggle fault';
});
