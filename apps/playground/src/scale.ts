import { registerProcessElements } from '@pom4h/process-elements/register';

registerProcessElements();

const widths = [96, 128, 160, 260];
const cases: readonly (readonly [string, string])[] = [
  ['auto · 68/75 open', 'position="68" command="75" powered status="normal"'],
  ['auto · shut', 'position="0" command="0" powered status="normal"'],
  ['auto · electric', 'actuator="electric" position="68" command="68" powered'],
  ['auto · stuck alarm', 'stuck position="55" command="20" status="alarm" powered'],
  ['forced full', 'detail="full" position="68" command="75" powered'],
  ['forced symbol', 'detail="symbol" position="68" command="75" powered'],
];

const root = document.querySelector('#root');
if (root) {
  root.innerHTML = cases.map(([title, attributes]) => `
    <section>
      <h2>${title}</h2>
      <div class="row">
        ${widths.map((width) => `
          <div class="cell w${width}">
            <pe-control-valve ${attributes}></pe-control-valve>
            <span>${width}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}
