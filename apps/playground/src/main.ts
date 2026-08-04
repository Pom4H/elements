import '@pom4h/process-elements/register';
import './style.css';

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing playground element: ${selector}`);
  return element;
}

function randomBits(length: number, probability = .5): string {
  return Array.from({ length }, () => Math.random() < probability ? '1' : '0').join('');
}

const pump = required<HTMLElement>('#pump');
const controller = required<HTMLElement>('#controller');
const speed = required<HTMLInputElement>('#speed');
const speedValue = required<HTMLOutputElement>('#speed-value');
const pumpStatus = required<HTMLSelectElement>('#pump-status');
const pumpQuality = required<HTMLSelectElement>('#pump-quality');
const pumpToggle = required<HTMLButtonElement>('#pump-toggle');
const channels = required<HTMLSelectElement>('#channels');
const load = required<HTMLInputElement>('#load');
const loadValue = required<HTMLOutputElement>('#load-value');
const activity = required<HTMLButtonElement>('#activity');
const controllerAlarm = required<HTMLButtonElement>('#controller-alarm');

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
