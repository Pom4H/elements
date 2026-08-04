export interface SvgTemplate {
  readonly markup: string;
}

const templateCache = new WeakMap<SvgTemplate, HTMLTemplateElement>();

export function svg(strings: TemplateStringsArray, ...values: readonly (string | number)[]): SvgTemplate {
  let markup = strings[0] ?? '';
  for (let index = 0; index < values.length; index += 1) {
    markup += String(values[index]);
    markup += strings[index + 1] ?? '';
  }
  return Object.freeze({ markup });
}

function compileTemplate(template: SvgTemplate, viewBox: string): HTMLTemplateElement {
  const cached = templateCache.get(template);
  if (cached) return cached;

  const element = document.createElement('template');
  element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" part="svg">${template.markup}</svg>`;
  templateCache.set(template, element);
  return element;
}

export function instantiateSvg(template: SvgTemplate, viewBox: string): SVGSVGElement {
  const fragment = compileTemplate(template, viewBox).content.cloneNode(true) as DocumentFragment;
  const root = fragment.firstElementChild;
  if (!(root instanceof SVGSVGElement)) throw new TypeError('Elements template must produce an SVG root.');
  return root;
}

export function createStyleSheet(cssText: string): CSSStyleSheet | HTMLStyleElement {
  if ('adoptedStyleSheets' in Document.prototype && 'replaceSync' in CSSStyleSheet.prototype) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    return sheet;
  }
  const style = document.createElement('style');
  style.textContent = cssText;
  return style;
}
