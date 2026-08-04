import '@pom4h/process-elements/register';
import './style.css';

const pump = document.querySelector<HTMLElement>('#pump');
const controller = document.querySelector<HTMLElement>('#controller');
const speed = document.querySelector<HTMLInputElement>('#speed');
const load = document.querySelector<HTMLInputElement>('#load');
const pumpToggle = document.querySelector<HTMLButtonElement>('#pump-toggle');
const pumpAlarm = document.querySelector<HTMLButtonElement>('#pump-alarm');
const activity = document.querySelector<HTMLButtonElement>('#activity');
const channels = document.querySelector<HTMLButtonElement>('#channels');

if (!pump || !controller || !speed || !load || !pumpToggle || !pumpAlarm || !activity || !channels) {
  throw new Error('Playground controls are incomplete.');
}

speed.addEventListener('input', () => {
  pump.setAttribute('speed', speed.value);
  pump.toggleAttribute('running', Number(speed.value) > 0);
  pumpToggle.textContent = Number(speed.value) > 0 ? 'Stop pump' : 'Start pump';
});

load.addEventListener('input', () => controller.setAttribute('load', load.value));

pumpToggle.addEventListener('click', () => {
  const running = !pump.hasAttribute('running');
  pump.toggleAttribute('running', running);
  pump.setAttribute('speed', running ? speed.value : '0');
  pumpToggle.textContent = running ? 'Stop pump' : 'Start pump';
});

pumpAlarm.addEventListener('click', () => {
  pump.setAttribute('status', pump.getAttribute('status') === 'alarm' ? 'normal' : 'alarm');
});

activity.addEventListener('click', () => {
  controller.setAttribute('activity', String(Number(controller.getAttribute('activity') ?? 0) + 1));
  const bits = controller.getAttribute('input-state') ?? '00000000';
  controller.setAttribute('input-state', [...bits].map(() => (Math.random() > 0.5 ? '1' : '0')).join(''));
});

channels.addEventListener('click', () => {
  const current = Number(controller.getAttribute('inputs') ?? 8);
  const next = current >= 24 ? 8 : current + 8;
  controller.setAttribute('inputs', String(next));
  controller.setAttribute('input-state', Array.from({ length: next }, () => (Math.random() > 0.55 ? '1' : '0')).join(''));
});
