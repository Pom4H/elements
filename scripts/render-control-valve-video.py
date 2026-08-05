from pathlib import Path
import math
import re
import shutil
import subprocess

import cairosvg

repository = Path(__file__).resolve().parents[1]
source = repository / 'packages/process-elements/src/elements/control-valve.ts'
media = repository / 'docs/media'
frames = repository / '.control-valve-preview-frames'
media.mkdir(parents=True, exist_ok=True)
shutil.rmtree(frames, ignore_errors=True)
frames.mkdir()

text = source.read_text()
inner = re.search(r"template: svg`(.*?)`,\n  styles:", text, re.S).group(1)
css = re.search(r"styles: `\n(.*?)\n:host\(\[data-state", text, re.S).group(1)
css = css.replace(':host', 'svg.device')
css = css.replace('font:700 12px/1 ui-monospace,monospace', 'font-weight:700;font-size:12px;font-family:monospace')
css = css.replace('font:700 14px/1 ui-monospace,monospace', 'font-weight:700;font-size:14px;font-family:monospace')
css = css.replace('font:650 7px/1 ui-monospace,monospace', 'font-weight:650;font-size:7px;font-family:monospace')
css = css.replace('font:700 9px/1 ui-monospace,monospace', 'font-weight:700;font-size:9px;font-family:monospace')


def clamp(value: float, minimum: float = 0, maximum: float = 1) -> float:
    return min(maximum, max(minimum, value))


def ease(value: float) -> float:
    return 4 * value ** 3 if value < .5 else 1 - (-2 * value + 2) ** 3 / 2


def values(time: float) -> tuple[float, float, str]:
    status = 'normal'
    if time < 1:
        command = position = 0
    elif time < 3:
        command = 82
        position = 82 * ease(clamp((time - 1) / 2))
    elif time < 4:
        command = position = 82
    elif time < 5.5:
        command = 25
        position = 82 + (25 - 82) * ease(clamp((time - 4) / 1.5))
    elif time < 7:
        command = 75
        position = 25
        status = 'warning'
    else:
        command = 75
        position = 25
        status = 'alarm'
    return command, position, status


def set_attribute(fragment: str, part: str, attribute: str, value: str) -> str:
    pattern = rf'(<[^>]+data-part="{re.escape(part)}"[^>]*?)(\s*/?>)'
    return re.sub(pattern, lambda match: match.group(1) + f' {attribute}="{value}"' + match.group(2), fragment, count=1)


def set_text(fragment: str, part: str, value: str) -> str:
    pattern = rf'(<text[^>]+data-part="{re.escape(part)}"[^>]*>)(.*?)(</text>)'
    return re.sub(pattern, lambda match: match.group(1) + value + match.group(3), fragment, count=1, flags=re.S)


fps = 24
duration = 8
for index in range(fps * duration):
    time = index / fps
    command, position, status = values(time)
    position_ratio = position / 100
    command_ratio = command / 100
    flow_rate = max(0, position * .62)
    travel = 54
    fragment = inner
    fragment = set_attribute(fragment, 'moving-assembly', 'transform', f'translate(0 {-travel * position_ratio:.3f})')
    fragment = set_attribute(fragment, 'actual-marker', 'transform', f'translate(0 {-travel * position_ratio:.3f})')
    fragment = set_attribute(fragment, 'command-marker', 'transform', f'translate(0 {-travel * command_ratio:.3f})')
    fragment = set_attribute(fragment, 'flow-line', 'style', f'stroke-dashoffset:{-time * (18 + flow_rate * .65):.2f};opacity:{.08 + position_ratio * .92:.3f}')

    pulse = .45 + .55 * abs(math.sin(time * 5))
    moving = abs(command - position) > .8
    color = '#ff5c74' if status == 'alarm' else '#ffbe4a' if status == 'warning' else '#52d6ff' if moving else '#55e39a'
    filter_id = 'url(#valve-red-glow)' if status == 'alarm' else 'url(#valve-amber-glow)' if status == 'warning' else 'url(#valve-cyan-glow)' if moving else 'url(#valve-green-glow)'
    fragment = set_attribute(fragment, 'status-ring', 'style', f'stroke:{color};filter:{filter_id};opacity:{pulse if status != "normal" else .78:.3f}')
    fragment = set_attribute(fragment, 'status-strip', 'style', f'fill:{color};filter:{filter_id};opacity:{pulse if status == "alarm" else 1:.3f}')
    if status == 'alarm':
        fragment = set_attribute(fragment, 'housing', 'style', 'stroke:#ff5c74')
    glow = .16 + .25 * abs(math.sin(time * 7)) if moving else .12
    fragment = set_attribute(fragment, 'actuator-glow', 'style', f'opacity:{glow:.3f}')
    fragment = set_text(fragment, 'position-readout', f'{round(position)}%')
    fragment = set_text(fragment, 'setpoint', f'SP {round(command)}%')
    fragment = set_text(fragment, 'flow-value', f'{flow_rate:.1f} m³/h')

    state = (
        'TRAVEL DEVIATION · ALARM' if status == 'alarm'
        else 'POSITION STUCK · WARNING' if status == 'warning'
        else 'TRAVELLING · REMOTE' if moving
        else 'CLOSED · REMOTE' if position < 2
        else 'IN POSITION · REMOTE'
    )
    actual_width = position * 2.6
    command_width = command * 2.6
    flow_width = min(100, flow_rate * 1.6) * 2.6
    grid = ''.join(f'<path d="M {x} 0 V 640"/>' for x in range(0, 800, 28)) + ''.join(f'<path d="M 0 {y} H 800"/>' for y in range(0, 640, 28))

    frame = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<defs><radialGradient id="bg"><stop stop-color="#162a3d"/><stop offset=".58" stop-color="#09131f"/><stop offset="1" stop-color="#04080d"/></radialGradient><linearGradient id="card" x2="0" y2="1"><stop stop-color="#0f1b29"/><stop offset="1" stop-color="#060c14"/></linearGradient></defs>
<rect width="1280" height="720" fill="url(#bg)"/><rect x="50" y="40" width="1180" height="640" rx="28" fill="url(#card)" stroke="#263a4e"/>
<g transform="translate(50 40)" opacity=".12" stroke="#4f7898" stroke-width="1">{grid}</g>
<rect x="850" y="40" width="380" height="640" fill="#08131e" opacity=".96"/><path d="M850 40V680" stroke="#263a4e"/>
<style>{css}</style><svg class="device" x="110" y="75" width="680" height="570" viewBox="0 0 440 370">{fragment}</svg>
<g font-family="Arial,sans-serif"><text x="890" y="124" fill="#678098" font-size="10" font-weight="700" letter-spacing="2.2">PE-CONTROL-VALVE</text><text x="890" y="165" fill="#e2ecf4" font-size="30" font-weight="700">Modulating globe</text><text x="890" y="199" fill="#e2ecf4" font-size="30" font-weight="700">control valve</text>
<g transform="translate(890 250)"><text fill="#6d849a" font-size="10" font-weight="700" letter-spacing="1.2">ACTUAL POSITION</text><text x="300" y="4" text-anchor="end" fill="#e2ecf4" font-size="26" font-weight="700">{round(position)}%</text><rect y="24" width="260" height="7" rx="4" fill="#122334"/><rect y="24" width="{actual_width:.1f}" height="7" rx="4" fill="#52d6ff"/></g>
<g transform="translate(890 340)"><text fill="#6d849a" font-size="10" font-weight="700" letter-spacing="1.2">COMMAND</text><text x="300" y="4" text-anchor="end" fill="#e2ecf4" font-size="26" font-weight="700">{round(command)}%</text><rect y="24" width="260" height="7" rx="4" fill="#122334"/><rect y="24" width="{command_width:.1f}" height="7" rx="4" fill="#ffbe4a"/></g>
<g transform="translate(890 430)"><text fill="#6d849a" font-size="10" font-weight="700" letter-spacing="1.2">PROCESS FLOW</text><text x="300" y="4" text-anchor="end" fill="#e2ecf4" font-size="26" font-weight="700">{flow_rate:.1f}</text><rect y="24" width="260" height="7" rx="4" fill="#122334"/><rect y="24" width="{flow_width:.1f}" height="7" rx="4" fill="#55e39a"/></g>
<circle cx="897" cy="561" r="6" fill="{color}"/><text x="914" y="565" fill="#9cafbf" font-size="11" font-weight="700" letter-spacing=".8">{state}</text></g></svg>'''
    cairosvg.svg2png(bytestring=frame.encode(), write_to=str(frames / f'{index:04d}.png'), output_width=1280, output_height=720)

subprocess.run([
    'ffmpeg', '-y', '-framerate', str(fps), '-i', str(frames / '%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-movflags', '+faststart',
    str(media / 'control-valve.mp4'),
], check=True)
shutil.copy(frames / '0084.png', media / 'control-valve-poster.png')
shutil.rmtree(frames)
