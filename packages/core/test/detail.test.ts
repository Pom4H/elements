import { describe, expect, test } from 'bun:test';
import { detailModeStyles, detailStyles } from '../src/detail.js';

describe('visual detail styles', () => {
  test('keeps explicit modes stronger than automatic breakpoints', () => {
    expect(detailModeStyles).toContain(':host([detail="full"]) [data-detail] { display: revert; }');
    expect(detailModeStyles).toContain(':host([detail="compact"]) [data-detail="standard"] { display: revert; }');
    expect(detailModeStyles).toContain(':host([detail="symbol"]) text:not([data-detail]) { display: revert; }');

    const css = detailStyles({ hideFineBelow: 460, hideStandardBelow: 300 });
    expect(css).toContain(':host(:not([detail="full"])) [data-detail="fine"]');
    expect(css).toContain(':host(:not([detail="full"]):not([detail="compact"])) [data-detail="standard"]');
  });

  test('rejects invalid breakpoints', () => {
    expect(() => detailStyles({ hideFineBelow: 0 })).toThrow(TypeError);
    expect(() => detailStyles({ hideStandardBelow: Number.NaN })).toThrow(TypeError);
  });
});
