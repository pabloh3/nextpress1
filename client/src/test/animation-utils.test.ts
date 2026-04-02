import { describe, it, expect } from 'vitest';
import {
  getEntryAnimationAttributes,
  generateBlockAnimationCSS,
  generateHoverAnimationCSS,
  generateLoopAnimationCSS,
} from '@shared/animation-utils';
import type { BlockAnimation, EntryAnimation } from '@shared/schema-types';

describe('Shared Animation Utils', () => {
  it('getEntryAnimationAttributes generates correct AOS attributes', () => {
    const entry: EntryAnimation = { name: 'fadeInUp', duration: 800, delay: 200, once: false };
    const attrs = getEntryAnimationAttributes(entry);
    expect(attrs).toEqual({
      'data-aos': 'animate__fadeInUp',
      'data-aos-duration': '800',
      'data-aos-delay': '200',
      'data-aos-once': 'false',
    });
  });

  it('generateBlockAnimationCSS generates combined hover+loop CSS', () => {
    const animation: BlockAnimation = {
      entry: { name: 'fadeIn' },
      hover: { name: 'tada' },
      loop: { name: 'heartBeat' },
    };
    const css = generateBlockAnimationCSS('abc', animation);
    expect(css).toContain('.block-abc:hover');
    expect(css).toContain('tada');
    expect(css).toContain('.block-abc.aos-animate');
    expect(css).toContain('heartBeat');
    expect(css).toContain('infinite');
  });

  it('generateHoverAnimationCSS generates correct rule', () => {
    expect(generateHoverAnimationCSS('x', { name: 'wobble' })).toBe(
      '.block-x:hover { animation: wobble 1s both; }'
    );
  });

  it('generateLoopAnimationCSS scopes to aos-animate when hasEntry', () => {
    expect(generateLoopAnimationCSS('y', { name: 'swing' }, true)).toBe(
      '.block-y.aos-animate { animation: swing 1s infinite both; }'
    );
  });

  it('generateLoopAnimationCSS uses base selector when no entry', () => {
    expect(generateLoopAnimationCSS('y', { name: 'swing' }, false)).toBe(
      '.block-y { animation: swing 1s infinite both; }'
    );
  });
});
