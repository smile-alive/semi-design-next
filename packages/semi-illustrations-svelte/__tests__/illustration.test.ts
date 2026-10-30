import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { IllustrationFailure } from '../src';
import TwoInstances from './fixtures/two-instances.svelte';

describe('semi-illustrations-svelte', () => {
    it('插画直接渲染 SVG，没有 icon 外壳', () => {
        const { container } = render(IllustrationFailure);
        expect(container.querySelector('.semi-icon')).toBeNull();
        expect(container.querySelector('svg')).toHaveAttribute('width', '200');
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('使用方的 width 与 height 覆盖默认尺寸', () => {
        const { container } = render(IllustrationFailure, { props: { width: 100, height: 80 } });
        expect(container.querySelector('svg')).toHaveAttribute('width', '100');
        expect(container.querySelector('svg')).toHaveAttribute('height', '80');
    });

    it('两个实例使用各自唯一的 mask id', () => {
        const { container } = render(TwoInstances);
        const masks = container.querySelectorAll('mask');
        expect(masks.length).toBeGreaterThan(0);
        expect(new Set([...masks].map((mask) => mask.id)).size).toBe(masks.length);
        expect(container.querySelector('mask')).toHaveAttribute('mask-type', 'alpha');
    });
});
