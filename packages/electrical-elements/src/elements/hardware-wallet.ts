import {
  attribute,
  bind,
  defineElementDefinition,
  svg,
  type ElementContext,
} from '@pom4h/elements-core';

const details = ['auto', 'full', 'compact', 'symbol'] as const;
const deviceStates = ['setup', 'menu', 'locked', 'review', 'approved', 'rejected', 'signed', 'sleeping', 'warning'] as const;

function stringValue(context: ElementContext, name: string, fallback = ''): string {
  const value = context.attributes[name];
  return value === null || value === undefined ? fallback : String(value);
}

export const hardwareWalletDefinition = defineElementDefinition({
  tagName: 'ee-hardware-wallet',
  displayName: 'Hardware wallet reference device',
  description:
    'A USB-powered two-button hardware-wallet reference device centered on a 128×64 trusted display and physical confirmation controls.',
  viewBox: '0 0 620 390',
  template: svg`
<g class="wallet-device">
  <path class="usb-neck" data-part="usb-shell" d="M544 154 H590 Q604 154 604 168 V222 Q604 236 590 236 H544 Z"/>
  <rect class="usb-metal" data-part="usb-slot" x="563" y="169" width="52" height="52" rx="7"/>
  <path class="usb-contact" d="M574 181 H604 M574 195 H604 M574 209 H604"/>

  <rect class="body-shadow" x="35" y="38" width="520" height="322" rx="54"/>
  <rect class="body" data-part="body" x="24" y="24" width="520" height="322" rx="54"/>
  <path class="body-highlight" d="M77 45 H492 Q522 45 522 76"/>

  <g class="display-assembly" data-part="screen-bezel">
    <rect class="screen-bezel" x="78" y="66" width="412" height="202" rx="22"/>
    <rect class="screen-lip" x="91" y="79" width="386" height="176" rx="12"/>
    <rect class="screen" data-part="screen" data-quality-sensitive x="104" y="91" width="360" height="152" rx="5"/>
    <path class="pixel-grid" data-detail="fine" d="M104 110 H464 M104 129 H464 M104 148 H464 M104 167 H464 M104 186 H464 M104 205 H464 M104 224 H464 M149 91 V243 M194 91 V243 M239 91 V243 M284 91 V243 M329 91 V243 M374 91 V243 M419 91 V243"/>
    <text class="screen-title" data-part="screen-title" x="284" y="121" text-anchor="middle">REVIEW TRANSACTION</text>
    <text class="screen-line" data-part="screen-line-1" x="284" y="161" text-anchor="middle">SEND 0.10 BTC</text>
    <text class="screen-line secondary" data-part="screen-line-2" x="284" y="192" text-anchor="middle">TO BC1Q…7X2</text>
    <text class="screen-footer" data-part="screen-footer" x="284" y="224" text-anchor="middle">VERIFY ON DEVICE</text>
  </g>

  <g class="button" data-part="button-left" tabindex="0" role="button" aria-label="Left hardware button">
    <ellipse class="button-shadow" cx="176" cy="307" rx="57" ry="27"/>
    <rect class="button-well" x="116" y="273" width="120" height="57" rx="28.5"/>
    <rect class="button-cap" x="124" y="277" width="104" height="45" rx="22.5"/>
    <path class="button-icon" d="M184 290 L169 299 L184 308"/>
    <text class="button-label" data-part="left-label" x="176" y="344" text-anchor="middle">REJECT</text>
  </g>

  <g class="button" data-part="button-right" tabindex="0" role="button" aria-label="Right hardware button">
    <ellipse class="button-shadow" cx="392" cy="307" rx="57" ry="27"/>
    <rect class="button-well" x="332" y="273" width="120" height="57" rx="28.5"/>
    <rect class="button-cap" x="340" y="277" width="104" height="45" rx="22.5"/>
    <path class="button-icon" d="M384 290 L399 299 L384 308"/>
    <text class="button-label" data-part="right-label" x="392" y="344" text-anchor="middle">CONFIRM</text>
  </g>

  <circle class="connection-led" data-part="connection-led" cx="501" cy="57" r="7"/>
  <circle class="connection-led-inner" cx="501" cy="57" r="3"/>
  <text class="device-mark" data-part="device-mark" data-detail="fine" x="65" y="54">HW/01</text>
</g>
`,
  styles: `
:host{display:inline-block;width:620px;max-width:100%;aspect-ratio:62/39;color:#171713;container-type:inline-size;contain:layout style;--wallet-accent:#d3492f;--wallet-screen:#06110d;--wallet-screen-ink:#baf7cf}
svg{width:100%;height:100%;overflow:visible}.body-shadow{fill:#171713;opacity:.13;transform:translateY(7px)}.body{fill:#ece7dd;stroke:#171713;stroke-width:4}.body-highlight{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;opacity:.56}.usb-neck{fill:#d6d0c5;stroke:#171713;stroke-width:3}.usb-metal{fill:#b7b5af;stroke:#171713;stroke-width:2}.usb-contact{fill:none;stroke:#787771;stroke-width:2;stroke-linecap:round}.screen-bezel{fill:#1c1c19;stroke:#171713;stroke-width:3}.screen-lip{fill:#34342e;stroke:#56564d;stroke-width:1.5}.screen{fill:var(--wallet-screen);stroke:#567665;stroke-width:2}.pixel-grid{fill:none;stroke:#8ee0af;stroke-width:.55;opacity:.07}.screen-title,.screen-line,.screen-footer{fill:var(--wallet-screen-ink);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.screen-title{font-size:13px;font-weight:850;letter-spacing:1.4px}.screen-line{font-size:24px;font-weight:850;letter-spacing:.2px}.screen-line.secondary{font-size:17px}.screen-footer{font-size:10px;font-weight:700;letter-spacing:1.2px;opacity:.7}.button{cursor:pointer;outline:none}.button-shadow{fill:#171713;opacity:.12}.button-well{fill:#c7c0b5;stroke:#171713;stroke-width:2.5}.button-cap{fill:#faf7f1;stroke:#171713;stroke-width:2.5;transition:transform 90ms ease}.button-icon{fill:none;stroke:#171713;stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round}.button-label{fill:#625e56;font:800 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1px}.button:focus .button-cap{stroke:var(--wallet-accent);stroke-width:4}.connection-led{fill:#7f7a70;stroke:#171713;stroke-width:1.3}.connection-led-inner{fill:#c9c4bb}.device-mark{fill:#625e56;font:800 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1.2px}
:host([connected]) .connection-led{fill:#1c8a50}:host([connected]) .connection-led-inner{fill:#b8ffd1}
:host([state="review"]) .screen{stroke:#d9961f}:host([state="review"]) .screen-title{fill:#f7c65d}
:host([state="approved"]),:host([state="signed"]){--wallet-screen-ink:#b8ffd1}:host([state="approved"]) .screen,:host([state="signed"]) .screen{stroke:#1c8a50}
:host([state="rejected"]),:host([state="warning"]){--wallet-screen-ink:#ffc7bd}:host([state="rejected"]) .screen,:host([state="warning"]) .screen{stroke:#d3492f}
:host([state="locked"]){--wallet-screen-ink:#b9c8c0}:host([state="locked"]) .screen{stroke:#65736d}
:host([state="menu"]){--wallet-screen-ink:#d8f6e2}:host([state="menu"]) .screen{stroke:#78a88b}
:host([state="sleeping"]) .screen{fill:#020403;stroke:#252a27}:host([state="sleeping"]) .screen-title,:host([state="sleeping"]) .screen-line,:host([state="sleeping"]) .screen-footer{opacity:0}:host([state="sleeping"]) .connection-led,:host([state="sleeping"]) .connection-led-inner{fill:#4b4943}
:host([pressed="left"]) [data-part="button-left"] .button-cap,:host([pressed="right"]) [data-part="button-right"] .button-cap,:host([pressed="both"]) [data-part="button-left"] .button-cap,:host([pressed="both"]) [data-part="button-right"] .button-cap{transform:translateY(7px)}
@container(max-width:390px){.device-mark,.button-label{display:none}.body{stroke-width:5}.screen-title{font-size:14px}.screen-line{font-size:27px}.screen-line.secondary{font-size:19px}.button-well{stroke-width:3}.button-cap{stroke-width:3}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`,
  attributes: {
    screenTitle: attribute.string('screenTitle', { attribute: 'screen-title', defaultValue: 'REVIEW TRANSACTION', description: 'Trusted display heading.' }),
    screenLine1: attribute.string('screenLine1', { attribute: 'screen-line-1', defaultValue: 'SEND 0.10 BTC', description: 'Primary trusted display line.' }),
    screenLine2: attribute.string('screenLine2', { attribute: 'screen-line-2', defaultValue: 'TO BC1Q…7X2', description: 'Secondary trusted display line.' }),
    screenFooter: attribute.string('screenFooter', { attribute: 'screen-footer', defaultValue: 'VERIFY ON DEVICE', description: 'Trusted display footer.' }),
    leftLabel: attribute.string('leftLabel', { attribute: 'left-label', defaultValue: 'REJECT', description: 'Left physical-button label.' }),
    rightLabel: attribute.string('rightLabel', { attribute: 'right-label', defaultValue: 'CONFIRM', description: 'Right physical-button label.' }),
    state: attribute.enum('state', deviceStates, { defaultValue: 'locked', description: 'Current device-owned interaction state.' }),
    connected: attribute.boolean('connected', { description: 'Whether USB power and transport are present.' }),
    pressed: attribute.enum('pressed', ['none', 'left', 'right', 'both'] as const, { defaultValue: 'none', description: 'Momentary left, right, or simultaneous two-button visualization.' }),
    detail: attribute.enum('detail', details, { defaultValue: 'auto', description: 'Visual level of detail.' }),
  },
  states: {
    connected: (context) => Boolean(context.attributes.connected),
    reviewing: (context) => stringValue(context, 'state') === 'review',
    approved: (context) => ['approved', 'signed'].includes(stringValue(context, 'state')),
    rejected: (context) => ['rejected', 'warning'].includes(stringValue(context, 'state')),
  },
  bindings: [
    bind.text('screen-title', (context) => stringValue(context, 'screenTitle', 'REVIEW TRANSACTION'), ['screenTitle']),
    bind.text('screen-line-1', (context) => stringValue(context, 'screenLine1', 'SEND 0.10 BTC'), ['screenLine1']),
    bind.text('screen-line-2', (context) => stringValue(context, 'screenLine2', 'TO BC1Q…7X2'), ['screenLine2']),
    bind.text('screen-footer', (context) => stringValue(context, 'screenFooter', 'VERIFY ON DEVICE'), ['screenFooter']),
    bind.text('left-label', (context) => stringValue(context, 'leftLabel', 'REJECT'), ['leftLabel']),
    bind.text('right-label', (context) => stringValue(context, 'rightLabel', 'CONFIRM'), ['rightLabel']),
  ],
  ports: [
    { id: 'usb-power', x: 615, y: 178, direction: 'right', kind: 'electrical', role: 'inlet', label: 'USB 5 V power' },
    { id: 'usb-data', x: 615, y: 211, direction: 'right', kind: 'signal', role: 'bidirectional', label: 'USB device transport' },
  ],
  parts: [
    { name: 'body', description: 'USB-powered reference enclosure.', detail: 'essential' },
    { name: 'usb-shell', description: 'Physical USB connector.', detail: 'standard' },
    { name: 'usb-slot', detail: 'fine' },
    { name: 'screen-bezel', detail: 'essential' },
    { name: 'screen', description: 'Trusted 128×64 display surface.', detail: 'essential' },
    { name: 'screen-title', detail: 'essential' },
    { name: 'screen-line-1', detail: 'essential' },
    { name: 'screen-line-2', detail: 'standard' },
    { name: 'screen-footer', detail: 'standard' },
    { name: 'button-left', description: 'Left physical button.', detail: 'essential' },
    { name: 'button-right', description: 'Right physical button.', detail: 'essential' },
    { name: 'left-label', detail: 'fine' },
    { name: 'right-label', detail: 'fine' },
    { name: 'connection-led', detail: 'standard' },
    { name: 'device-mark', detail: 'fine' },
  ],
});
