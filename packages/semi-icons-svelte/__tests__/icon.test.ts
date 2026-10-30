import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { IconActivity, IconAIBellLevel2, IconAILoading, IconAlarm } from '../src';
import Svg from '../src/components/svg.svelte';
import { IconAccessibility } from '../src/lab';
import CustomIcon from './fixtures/custom-icon.svelte';
import LabelledBy from './fixtures/labelled-by.svelte';
import TwoInstances from './fixtures/two-instances.svelte';

describe('semi-icons-svelte', () => {
    it('DOM 属性名渲染为对应的 SVG 属性', () => {
        const { container } = render(IconActivity);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('path')).toHaveAttribute('fill-rule', 'evenodd');
    });

    it('lab 图标同样渲染', () => {
        const { container } = render(IconAccessibility);
        expect(container.querySelector('.semi-icon svg')).not.toBeNull();
    });

    it('双色图标分配 fill，根 svg 保留原始 fill', async () => {
        const view = render(IconAIBellLevel2);
        const { container } = view;
        const fills = () => [...container.querySelectorAll('path')].map((path) => path.getAttribute('fill'));
        expect(fills()).toEqual(['rgba(166,71,255)', 'currentColor']);
        await view.rerender({ fill: ['red', 'blue'] });
        expect(fills()).toEqual(['red', 'blue']);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'none');
    });

    it('四色图标不修改使用方数组', async () => {
        const fill = ['a', 'b', 'c', 'd'];
        const view = render(IconAILoading, { props: { fill } });
        const { container } = view;
        await view.rerender({ fill });
        expect(fill).toEqual(['a', 'b', 'c', 'd']);
        expect([...container.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'))).toEqual(['d', 'c', 'b', 'a']);
    });

    it('重渲染保留 gradient id，stroke 指向同一渐变', async () => {
        const view = render(IconAILoading);
        const { container } = view;
        const id = container.querySelector('linearGradient')?.id;
        expect(id).toBeTruthy();
        await view.rerender({ size: 'large' });
        expect(container.querySelector('linearGradient')?.id).toBe(id);
        expect(container.querySelector('path')).toHaveAttribute('stroke', `url(#${id})`);
    });

    it('同一页面的两个实例使用不同 gradient id', () => {
        const { container } = render(TwoInstances);
        const gradients = container.querySelectorAll('linearGradient');
        expect(gradients).toHaveLength(2);
        expect(gradients[0].id).not.toBe(gradients[1].id);
    });

    it('未命名时作为装饰元素，aria-label 与 aria-labelledby 暴露图像', async () => {
        const view = render(IconAlarm);
        const { container } = view;
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).not.toHaveAttribute('role');
        await view.rerender({ 'aria-label': 'Alarm' });
        expect(view.getByRole('img', { name: 'Alarm' })).toBe(icon);
        expect(icon).not.toHaveAttribute('aria-hidden');
        await view.rerender({ 'aria-label': '' });
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        const named = render(LabelledBy);
        expect(named.getByRole('img', { name: 'Alarm set' })).toHaveClass('semi-icon');
    });

    it('可聚焦时保持暴露，不隐藏 Tab 焦点', () => {
        const { container } = render(IconAlarm, { props: { tabindex: 0 } });
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('role', 'img');
        expect(icon).not.toHaveAttribute('aria-hidden');
        expect(icon).not.toHaveAttribute('aria-label');
    });

    it('渲染 size、spin、rotate，使用方 style 覆盖旋转，class 合并', async () => {
        const view = render(IconAlarm, { props: { size: 'large', spin: true, rotate: 90, class: 'mine' } });
        const { container } = view;
        const icon = container.querySelector<HTMLElement>('.semi-icon');
        expect(icon).toHaveClass('semi-icon-large', 'semi-icon-spinning', 'semi-icon-alarm', 'mine');
        expect(icon?.style.transform).toBe('rotate(90deg)');
        await view.rerender({ style: 'transform: scale(2)', prefixCls: 'custom' });
        expect(icon?.style.transform).toBe('scale(2)');
        expect(icon).toHaveClass('custom-icon');
    });

    it('size 为 inherit 时不加尺寸 class', () => {
        const { container } = render(IconAlarm, { props: { size: 'inherit' } });
        expect(container.querySelector('.semi-icon')?.className).not.toMatch(/semi-icon-(inherit|default)/);
    });

    it('自定义图标的 children 收到 fill', () => {
        const { container } = render(CustomIcon);
        expect(container.querySelector('.semi-icon')).toContainElement(container.querySelector('svg'));
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'red');
    });

    it('SVG 渲染保留 style 字符串与 mask-type', () => {
        const { container } = render(Svg, {
            props: {
                data: { name: 'fixture', attrs: { style: 'isolation:isolate', viewBox: '0 0 2 2' }, children: [['mask', { 'mask-type': 'alpha', style: 'mask-type:alpha' }]] },
            },
        });
        expect(container.querySelector<SVGSVGElement>('svg')?.style.isolation).toBe('isolate');
        expect(container.querySelector('mask')).toHaveAttribute('mask-type', 'alpha');
    });
});
