export interface DetailStyleOptions {
  readonly hideFineBelow?: number;
  readonly hideStandardBelow?: number;
}

/**
 * `detail` is what the markup asked for; `data-detail-level` is what the
 * element settled on once its width had a say. Both are honoured, so an
 * element that shrinks into `compact` sheds the same parts as one told to.
 */
export const detailModeStyles = `
:host([detail="full"]) [data-detail] { display: revert; }
:host([detail="compact"]) [data-detail="standard"] { display: revert; }
:host([detail="compact"]) [data-detail="fine"] { display: none; }
:host([detail="symbol"]) [data-detail] { display: none; }
:host([detail="symbol"]) text:not([data-detail]) { display: revert; }
:host([data-detail-level="compact"]) [data-detail="fine"] { display: none; }
:host([data-detail-level="symbol"]) [data-detail] { display: none; }
`;

function containerWidth(name: keyof DetailStyleOptions, value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive finite CSS pixel width.`);
  }
  return value;
}

export function detailStyles(options: DetailStyleOptions = {}): string {
  const hideFineBelow = containerWidth('hideFineBelow', options.hideFineBelow);
  const hideStandardBelow = containerWidth('hideStandardBelow', options.hideStandardBelow);
  const rules: string[] = [];

  if (hideFineBelow !== undefined) {
    rules.push(
      `@container (max-width: ${hideFineBelow}px) {`,
      '  :host(:not([detail="full"])) [data-detail="fine"] { display: none; }',
      '}',
    );
  }

  if (hideStandardBelow !== undefined) {
    rules.push(
      `@container (max-width: ${hideStandardBelow}px) {`,
      '  :host(:not([detail="full"]):not([detail="compact"])) [data-detail="standard"] { display: none; }',
      '}',
    );
  }

  return rules.join('\n');
}
