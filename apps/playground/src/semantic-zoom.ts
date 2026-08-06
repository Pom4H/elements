import {
  semanticZoomLevels,
  stepSemanticZoom,
  type SemanticZoomLevel,
} from '@pom4h/elements-core';
import { registerProcessElements } from '@pom4h/process-elements/register';
import './semantic-zoom.css';

registerProcessElements();
document.documentElement.dataset.playground = 'semantic-zoom';

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing semantic zoom element: ${selector}`);
  return element;
}

const descriptions: Record<SemanticZoomLevel, string> = {
  symbol: 'Only the canonical engineering symbols and connection ports are visible.',
  process: 'Flow direction, liquid level, and other live process quantities appear.',
  operational: 'Actuators, motion, equipment state, position, and tags are added.',
  diagnostic: 'Measurements, instrument bubbles, load bars, and quality information are exposed.',
};

const labels: Record<SemanticZoomLevel, string> = {
  symbol: 'Symbol',
  process: 'Process',
  operational: 'Operational',
  diagnostic: 'Diagnostic',
};

const viewport = required<HTMLElement>('#zoom-viewport');
const devices = Array.from(document.querySelectorAll<HTMLElement>('pe-pid-pump, pe-pid-valve, pe-pid-vessel'));
const levelName = required<HTMLElement>('#level-name');
const levelOutput = required<HTMLOutputElement>('#level-output');
const levelDescription = required<HTMLElement>('#level-description');
const levelButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-level]'));
const zoomInButton = required<HTMLButtonElement>('#zoom-in');
const zoomOutButton = required<HTMLButtonElement>('#zoom-out');
const speed = required<HTMLInputElement>('#speed');
const speedOutput = required<HTMLOutputElement>('#speed-output');
const position = required<HTMLInputElement>('#position');
const positionOutput = required<HTMLOutputElement>('#position-output');
const vesselLevel = required<HTMLInputElement>('#vessel-level');
const vesselLevelOutput = required<HTMLOutputElement>('#level-value-output');
const status = required<HTMLSelectElement>('#status');
const quality = required<HTMLSelectElement>('#quality');
const motionToggle = required<HTMLButtonElement>('#motion-toggle');
const pump = required<HTMLElement>('#pid-pump');
const valve = required<HTMLElement>('#pid-valve');
const vessel = required<HTMLElement>('#pid-vessel');

let level: SemanticZoomLevel = 'symbol';
let processActive = true;
let lastWheelStep = 0;

function isSemanticZoomLevel(value: string | undefined): value is SemanticZoomLevel {
  return semanticZoomLevels.includes(value as SemanticZoomLevel);
}

function setLevel(next: SemanticZoomLevel): void {
  level = next;
  devices.forEach((device) => device.setAttribute('abstraction', next));
  viewport.dataset.level = next;
  levelName.textContent = labels[next];
  levelOutput.value = `${semanticZoomLevels.indexOf(next) + 1} / ${semanticZoomLevels.length}`;
  levelDescription.textContent = descriptions[next];

  levelButtons.forEach((button) => {
    const active = button.dataset.level === next;
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    button.classList.toggle('active', active);
  });

  zoomOutButton.disabled = next === semanticZoomLevels[0];
  zoomInButton.disabled = next === semanticZoomLevels[semanticZoomLevels.length - 1];
}

function moveLevel(direction: number): void {
  setLevel(stepSemanticZoom(level, direction));
}

viewport.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaY) < 3) return;
  event.preventDefault();
  const now = performance.now();
  if (now - lastWheelStep < 180) return;
  lastWheelStep = now;
  moveLevel(event.deltaY < 0 ? 1 : -1);
}, { passive: false });

viewport.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === '+') {
    event.preventDefault();
    moveLevel(1);
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === '-') {
    event.preventDefault();
    moveLevel(-1);
  }
});

levelButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const requested = button.dataset.level;
    if (isSemanticZoomLevel(requested)) setLevel(requested);
  });
});

zoomInButton.addEventListener('click', () => moveLevel(1));
zoomOutButton.addEventListener('click', () => moveLevel(-1));

speed.addEventListener('input', () => {
  const value = Number(speed.value);
  pump.setAttribute('speed', speed.value);
  pump.toggleAttribute('running', processActive && value > 0);
  speedOutput.value = `${value} rpm`;
});

position.addEventListener('input', () => {
  valve.setAttribute('position', position.value);
  valve.toggleAttribute('active', processActive);
  positionOutput.value = `${position.value}%`;
});

vesselLevel.addEventListener('input', () => {
  vessel.setAttribute('level', vesselLevel.value);
  vesselLevelOutput.value = `${vesselLevel.value}%`;
});

status.addEventListener('change', () => {
  devices.forEach((device) => device.setAttribute('status', status.value));
});

quality.addEventListener('change', () => {
  devices.forEach((device) => device.setAttribute('quality', quality.value));
});

motionToggle.addEventListener('click', () => {
  processActive = !processActive;
  pump.toggleAttribute('running', processActive && Number(speed.value) > 0);
  valve.toggleAttribute('active', processActive);
  vessel.toggleAttribute('active', processActive);
  motionToggle.textContent = processActive ? 'Pause process' : 'Resume process';
});

setLevel(level);
