import { registerProcessElements } from '@pom4h/process-elements/register';
import './style-harness.css';

// Internal designer board only. It is intentionally absent from production
// entrypoints and CI; render it, look at the whole matrix, then edit elements.
registerProcessElements();

type Theme = 'light' | 'dark';

const root = document.documentElement;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select');
const motionToggle = document.querySelector<HTMLButtonElement>('#motion-toggle');
const cells = [...document.querySelectorAll<HTMLElement>('.style-cell')];

if (!themeSelect || !motionToggle) throw new Error('Incomplete style board controls.');

const query = new URLSearchParams(location.search);
let paused = query.get('motion') !== 'running';

function applyTheme(theme: Theme): void {
  root.dataset.theme = theme;
  themeSelect.value = theme;
  for (const cell of cells) cell.classList.toggle('studio-scene', theme === 'light');
}

function applyMotion(nextPaused: boolean): void {
  paused = nextPaused;
  for (const animation of document.getAnimations()) {
    if (paused) animation.pause();
    else animation.play();
  }
  motionToggle.textContent = paused ? 'Resume motion' : 'Pause motion';
}

const initialTheme: Theme = query.get('theme') === 'dark' ? 'dark' : 'light';
applyTheme(initialTheme);

for (const tag of ['pe-tank', 'pe-pump', 'pe-control-valve', 'pe-controller']) {
  await customElements.whenDefined(tag);
}
await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
applyMotion(paused);

themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value === 'dark' ? 'dark' : 'light');
  applyMotion(paused);
});

motionToggle.addEventListener('click', () => applyMotion(!paused));
