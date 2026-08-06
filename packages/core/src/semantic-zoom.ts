export const semanticZoomLevels = ['symbol', 'process', 'operational', 'diagnostic'] as const;

export type SemanticZoomLevel = (typeof semanticZoomLevels)[number];

function levelIndex(level: SemanticZoomLevel): number {
  return semanticZoomLevels.indexOf(level);
}

export function stepSemanticZoom(level: SemanticZoomLevel, direction: number): SemanticZoomLevel {
  const step = direction === 0 ? 0 : direction > 0 ? 1 : -1;
  const nextIndex = Math.min(
    semanticZoomLevels.length - 1,
    Math.max(0, levelIndex(level) + step),
  );
  return semanticZoomLevels[nextIndex]!;
}

export function semanticZoomStyles(attribute = 'abstraction'): string {
  if (!/^[a-z][a-z0-9-]*$/.test(attribute)) {
    throw new TypeError('Semantic zoom attribute must be a valid lowercase HTML attribute name.');
  }

  const rules = [
    '[data-zoom-layer] { display: none; }',
    `:host(:not([${attribute}])) [data-zoom-layer="symbol"] { display: revert; }`,
  ];

  semanticZoomLevels.forEach((level, index) => {
    const selectors = semanticZoomLevels
      .slice(0, index + 1)
      .map((layer) => `:host([${attribute}="${level}"]) [data-zoom-layer="${layer}"]`)
      .join(',\n');
    rules.push(`${selectors} { display: revert; }`);
  });

  return rules.join('\n');
}
