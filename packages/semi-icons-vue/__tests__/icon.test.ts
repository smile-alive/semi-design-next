import { defineComponent, h, useTemplateRef } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { IllustrationFailure } from '@fibrae/semi-illustrations-vue';
import { render } from '@test/utils/vue';
import Icon, { IconActivity, IconAIBellLevel2, IconAILoading, IconAlarm } from '../src';
import { createSvgComponent } from '../src/components/create-icon';

describe('semi-icons-vue', () => {
    it('DOM 属性名渲染为对应的 SVG 属性', () => {
        const { container } = render(IconActivity);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('path')).toHaveAttribute('fill-rule', 'evenodd');
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
        await view.rerender({ size: 'large' });
        expect(container.querySelector('linearGradient')?.id).toBe(id);
        expect(container.querySelector('path')).toHaveAttribute('stroke', `url(#${id})`);
    });

    it('同一 app 的两个实例使用不同 gradient id', () => {
        const { container } = render(defineComponent(() => () => h('div', [h(IconAILoading), h(IconAILoading)])));
        const gradients = container.querySelectorAll('linearGradient');
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
        const named = render(defineComponent(() => () => h('div', [h('span', { id: 'alarm-name' }, 'Alarm set'), h(IconAlarm, { 'aria-labelledby': 'alarm-name' })])));
        expect(named.getByRole('img', { name: 'Alarm set' })).toHaveClass('semi-icon');
    });

    it('可聚焦时保持暴露，不隐藏 Tab 焦点', () => {
        const { container } = render(IconAlarm, { attrs: { tabindex: 0 } });
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('role', 'img');
        expect(icon).not.toHaveAttribute('aria-hidden');
        expect(icon).not.toHaveAttribute('aria-label');
    });

    it('渲染 size、spin、rotate，使用方 style 覆盖旋转', async () => {
        const view = render(IconAlarm, { props: { size: 'large', spin: true, rotate: 90 } });
        const { container } = view;
        const icon = container.querySelector<HTMLElement>('.semi-icon');
        expect(icon).toHaveClass('semi-icon-large', 'semi-icon-spinning');
        expect(icon?.style.transform).toBe('rotate(90deg)');
        await view.rerender({ style: { transform: 'scale(2)' }, prefixCls: 'custom' });
        expect(icon?.style.transform).toBe('scale(2)');
        expect(icon).toHaveClass('custom-icon');
    });

    it('内置与自定义图标的组件 ref 暴露根 span，保留 elementType', () => {
        let roots: (() => Element[]) | undefined;
        const Fixture = defineComponent({
            setup() {
                const builtin = useTemplateRef<{ $el: Element }>('builtin');
                const custom = useTemplateRef<{ $el: Element }>('custom');
                roots = () => [builtin.value?.$el, custom.value?.$el].filter((value): value is Element => Boolean(value));
                return () => h('div', [h(IconAlarm, { ref: 'builtin' }), h(Icon, { ref: 'custom', fill: 'red' }, { default: () => h('svg') })]);
            },
        });
        const { container } = render(Fixture);
        expect(roots?.()).toEqual([...container.querySelectorAll('.semi-icon')]);
        expect(container.querySelectorAll('svg')[1]).toHaveAttribute('fill', 'red');
        expect(IconAlarm.elementType).toBe('Icon');
        expect(Icon.elementType).toBe('Icon');
    });

    it('SVG 工厂保留 style 字符串与 mask-type', () => {
        const Svg = createSvgComponent({
            name: 'fixture',
            attrs: { style: 'isolation:isolate', viewBox: '0 0 2 2' },
            children: [['mask', { 'mask-type': 'alpha', style: 'mask-type:alpha' }]],
        });
        const { container } = render(Svg);
        expect(container.querySelector<SVGSVGElement>('svg')?.style.isolation).toBe('isolate');
        expect(container.querySelector('mask')).toHaveAttribute('mask-type', 'alpha');
    });

    it('插画直接渲染 SVG 并使用实例唯一 mask id', () => {
        const { container } = render(defineComponent(() => () => h('div', [h(IllustrationFailure), h(IllustrationFailure)])));
        expect(container.querySelector('.semi-icon')).toBeNull();
        expect(container.querySelector('svg')).toHaveAttribute('width', '200');
        const masks = container.querySelectorAll('mask');
        expect(masks.length).toBeGreaterThan(0);
        expect(new Set([...masks].map((mask) => mask.id)).size).toBe(masks.length);
        expect(container.querySelector('mask')).toHaveAttribute('mask-type', 'alpha');
    });
});
