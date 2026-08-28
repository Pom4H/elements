import {
  attribute,
  bind,
  defineElementDefinition,
  svg,
  type ElementContext,
} from '@pom4h/elements-core';

const details = ['auto', 'full', 'compact', 'symbol'] as const;
const deviceStates = ['setup', 'locked', 'review', 'approved', 'rejected', 'signed', 'warning'] as const;

function stringValue(context: ElementContext, name: string, fallback = ''): string {
  const value = context.attributes[name];
  return value === null || value === undefined ? fallback : String(value);
}

export const hardwareWalletDefinition = defineElementDefinition({
  tagName: 'ee-hardware-wallet',
  displayName: 'Hardware wallet reference device',
  description:
    'A USB-powered two-button hardware-wallet reference device with a 128×64 trusted display and state-driven review surface.',
  viewBox: '0 0 580 320',
  template: svg`
<g class="wallet-device">
  <rect class="usb-shell" data-part="usb-shell" x="532" y="124" width="40" height="72" rx="9"/>
  <rect class="usb-slot" data-part="usb-slot" x="543" y="141" width="29" height="38" rx="6"/>
  <rect class="body" data-part="body" x="28" y="24" width="520" height="272" rx="42"/>
  <path class="body-edge" d="M68 38 H508 Q532 38 532 62 V258 Q532 282 508 282 H68 Q44 282 44 258 V62 Q44 38 68 38Z"/>

  <rect class="screen-bezel" data-part="screen-bezel" x="120" y="52" width="340" height="184" rx="16"/>
  <rect class="screen" data-part="screen" data-quality-sensitive x="134" y="69" width="312" height="150" rx="5"/>
  <path class="pixel-grid" data-detail="fine" d="M134 94 H446 M134 119 H446 M134 144 H446 M134 169 H446 M134 194 H446 M186 69 V219 M238 69 V219 M290 69 V219 M342 69 V219 M394 69 V219"/>
  <text class="screen-title" data-part="screen-title" x="290" y="99" text-anchor="middle">REVIEW TRANSACTION</text>
  <text class="screen-line" data-part="screen-line-1" x="290" y="137" text-anchor="middle">SEND 0.10 BTC</text>
  <text class="screen-line secondary" data-part="screen-line-2" x="290" y="165" text-anchor="middle">TO BC1Q…7X2</text>
  <text class="screen-footer" data-part="screen-footer" x="290" y="198" text-anchor="middle">VERIFY ON DEVICE</text>

  <g class="button" data-part="button-left" tabindex="0" role="button" aria-label="Left hardware button">
    <circle class="button-well" cx="176" cy="260" r="29"/>
    <circle class="button-cap" cx="176" cy="256" r="22"/>
    <path class="button-icon" d="M183 247 L172 256 L183 265"/>
    <text class="button-label" data-part="left-label" x="176" y="304" text-anchor="middle">REJECT</text>
  </g>
  <g class="button" data-part="button-right" tabindex="0" role="button" aria-label="Right hardware button">
    <circle class="button-well" cx="404" cy="260" r="29"/>
    <circle class="button-cap" cx="404" cy="256" r="22"/>
    <path class="button-icon" d="M397 247 L408 256 L397 265"/>
    <text class="button-label" data-part="right-label" x="404" y="304" text-anchor="middle">CONFIRM</text>
  </g>

  <circle class="connection-led" data-part="connection-led" cx="505" cy="61" r="6"/>
  <text class="device-mark" data-part="device-mark" data-detail="fine" x="60" y="64">HW/01</text>
  <text class="device-meta" data-detail="fine" x="60" y="278">128×64 · USB FS · 2 BUTTONS</text>
</g>
`,
  styles: `
:host{display:inline-block;width:580px;max-width:100%;aspect-ratio:29/16;color:#171713;container-type:inline-size;contain:layout style;--wallet-accent:#d3492f;--wallet-screen:#07130f;--wallet-screen-ink:#baf7cf}
svg{width:100%;height:100%;overflow:visible}
.body{fill:#e9e4da;stroke:#171713;stroke-width:4}.body-edge{fill:none;stroke:#aaa296;stroke-width:1.5}.usb-shell{fill:#d7d2c8;stroke:#171713;stroke-width:3}.usb-slot{fill:#171713}.screen-bezel{fill:#24241f;stroke:#171713;stroke-width:2}.screen{fill:var(--wallet-screen);stroke:#517865;stroke-width:2}.pixel-grid{fill:none;stroke:#8ee0af;stroke-width:.5;opacity:.08}.screen-title,.screen-line,.screen-footer{fill:var(--wallet-screen-ink);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.screen-title{font-size:14px;font-weight:800;letter-spacing:1.1px}.screen-line{font-size:22px;font-weight:800}.screen-line.secondary{font-size:16px}.screen-footer{font-size:10px;letter-spacing:1px;opacity:.72}.button{cursor:pointer;outline:none}.button-well{fill:#cdc6ba;stroke:#171713;stroke-width:2}.button-cap{fill:#f5f1e9;stroke:#171713;stroke-width:2.5}.button-icon{fill:none;stroke:#171713;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.button-label{fill:#625e56;font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.9px}.button:focus .button-cap{stroke:var(--wallet-accent);stroke-width:4}.connection-led{fill:#827d73;stroke:#171713;stroke-width:1}.device-mark,.device-meta{fill:#625e56;font:700 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1px}
:host([connected]) .connection-led{fill:#1c8a50}
:host([state="review"]) .screen{stroke:#d9961f}:host([state="review"]) .screen-title{fill:#f7c65d}
:host([state="approved"]),:host([state="signed"]){--wallet-screen-ink:#b8ffd1}:host([state="approved"]) .screen,:host([state="signed"]) .screen{stroke:#1c8a50}
:host([state="rejected"]),:host([state="warning"]){--wallet-screen-ink:#ffc7bd}:host([state="rejected"]) .screen,:host([state="warning"]) .screen{stroke:#d3492f}
:host([state="locked"]){--wallet-screen-ink:#b9c8c0}:host([state="locked"]) .screen{stroke:#65736d}
:host([pressed="left"]) [data-part="button-left"] .button-cap,:host([pressed="right"]) [data-part="button-right"] .button-cap{transform:translateY(4px)}
@container(max-width:360px){.device-meta,.device-mark,.button-label{display:none}.body{stroke-width:5}.screen-line{font-size:24px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`,
  attributes: {
    screenTitle: attribute.string('screenTitle', {
      attribute: 'screen-title',
      defaultValue: 'REVIEW TRANSACTION',
      description: 'Trusted display heading.',
    }),
    screenLine1: attribute.string('screenLine1', {
      attribute: 'screen-line-1',
      defaultValue: 'SEND 0.10 BTC',
      description: 'Primary trusted display line.',
    }),
    screenLine2: attribute.string('screenLine2', {
      attribute: 'screen-line-2',
      defaultValue: 'TO BC1Q…7X2',
      description: 'Secondary trusted display line.',
    }),
    screenFooter: attribute.string('screenFooter', {
      attribute: 'screen-footer',
      defaultValue: 'VERIFY ON DEVICE',
      description: 'Trusted display footer.',
    }),
    leftLabel: attribute.string('leftLabel', {
      attribute: 'left-label',
      defaultValue: 'REJECT',
      description: 'Left physical-button label.',
    }),
    rightLabel: attribute.string('rightLabel', {
      attribute: 'right-label',
      defaultValue: 'CONFIRM',
      description: 'Right physical-button label.',
    }),
    state: attribute.enum('state', deviceStates, {
      defaultValue: 'locked',
      description: 'Current device-owned interaction state.',
    }),
    connected: attribute.boolean('connected', {
      description: 'Whether USB power and transport are present.',
    }),
    pressed: attribute.enum('pressed', ['none', 'left', 'right'] as const, {
      defaultValue: 'none',
      description: 'Momentary physical-button visualization.',
    }),
    detail: attribute.enum('detail', details, {
      defaultValue: 'auto',
      description: 'Visual level of detail.',
    }),
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
    { id: 'usb-power', x: 572, y: 144, direction: 'right', kind: 'electrical', role: 'inlet', label: 'USB 5 V power' },
    { id: 'usb-data', x: 572, y: 176, direction: 'right', kind: 'signal', role: 'bidirectional', label: 'USB device transport' },
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
