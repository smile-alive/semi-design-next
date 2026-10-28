import { type JSX, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import Icon, { IconActivity, IconAIBellLevel2, IconAILoading, IconAlarm, type IconFill, type IconProps } from '../src';
import { createSvgComponent } from '../src/components/create-icon';

describe('semi-icons-solid', () => {
    it('DOM 属性名渲染为对应的 SVG 属性，元素在 SVG 命名空间', () => {
        const { container } = render(() => <IconActivity />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        const path = container.querySelector('path');
        expect(path).toHaveAttribute('fill-rule', 'evenodd');
        expect(path?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('双色图标分配 fill，根 svg 保留原始 fill', () => {
        const [fill, setFill] = createSignal<IconFill>();
        const { container } = render(() => <IconAIBellLevel2 fill={fill()} />);
        const fills = () => [...container.querySelectorAll('path')].map((path) => path.getAttribute('fill'));
        expect(fills()).toEqual(['rgba(166,71,255)', 'currentColor']);
        setFill(['red', 'blue']);
        expect(fills()).toEqual(['red', 'blue']);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'none');
    });

    it('单色图标把 fill 传给根 svg', () => {
        const { container } = render(() => <IconAlarm fill="red" />);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'red');
    });

    it('四色图标不修改使用方数组', () => {
        const fill = ['a', 'b', 'c', 'd'];
        const { container } = render(() => <IconAILoading fill={fill} />);
        expect(fill).toEqual(['a', 'b', 'c', 'd']);
        expect([...container.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'))).toEqual(['d', 'c', 'b', 'a']);
    });

    it('属性变化保留 gradient id，stroke 指向同一渐变', () => {
        const [size, setSize] = createSignal<IconProps['size']>('default');
        const { container } = render(() => <IconAILoading size={size()} />);
        const id = container.querySelector('linearGradient')?.id;
        expect(id).toBeTruthy();
        setSize('large');
        expect(container.querySelector('linearGradient')?.id).toBe(id);
        expect(container.querySelector('path')).toHaveAttribute('stroke', `url(#${id})`);
    });

    it('同一页面的两个实例使用不同 gradient id', () => {
        const { container } = render(() => (
            <div>
                <IconAILoading />
                <IconAILoading />
            </div>
        ));
        const gradients = container.querySelectorAll('linearGradient');
        expect(gradients[0].id).not.toBe(gradients[1].id);
    });

    it('未命名时作为装饰元素，aria-label 与 aria-labelledby 暴露图像', () => {
        const [label, setLabel] = createSignal<string>();
        const { container } = render(() => <IconAlarm aria-label={label()} />);
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).not.toHaveAttribute('role');
        setLabel('Alarm');
        expect(screen.getByRole('img', { name: 'Alarm' })).toBe(icon);
        expect(icon).not.toHaveAttribute('aria-hidden');
        setLabel('');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        render(() => (
            <div>
                <span id="alarm-name">Alarm set</span>
                <IconAlarm aria-labelledby="alarm-name" />
            </div>
        ));
        expect(screen.getByRole('img', { name: 'Alarm set' })).toHaveClass('semi-icon');
    });

    it('可聚焦时保持暴露，不隐藏 Tab 焦点', () => {
        const { container } = render(() => <IconAlarm tabIndex={0} />);
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('role', 'img');
        expect(icon).not.toHaveAttribute('aria-hidden');
        expect(icon).not.toHaveAttribute('aria-label');
    });

    it('渲染 size、spin、rotate，使用方 style 覆盖旋转，class 追加在后', () => {
        const [style, setStyle] = createSignal<JSX.CSSProperties>();
        const [prefixCls, setPrefixCls] = createSignal<string>();
        const { container } = render(() => <IconAlarm size="large" spin rotate={90} style={style()} prefixCls={prefixCls()} class="extra" />);
        const icon = container.querySelector<HTMLElement>('span');
        expect(icon).toHaveClass('semi-icon', 'semi-icon-large', 'semi-icon-spinning', 'semi-icon-alarm', 'extra');
        expect(icon?.style.transform).toBe('rotate(90deg)');
        setStyle({ transform: 'scale(2)' });
        setPrefixCls('custom');
        expect(icon?.style.transform).toBe('scale(2)');
        expect(icon).toHaveClass('custom-icon', 'custom-icon-large');
    });

    it('size 为 inherit 时不加尺寸类名', () => {
        const { container } = render(() => <IconAlarm size="inherit" />);
        expect(container.querySelector('span')?.className).toBe('semi-icon semi-icon-alarm');
    });

    it('内置与自定义图标的 ref 落在根 span，自定义图标收到 fill', () => {
        const refs: Element[] = [];
        const { container } = render(() => (
            <div>
                <IconAlarm ref={(node) => refs.push(node)} />
                <Icon ref={(node) => refs.push(node)} fill="red" svg={(props) => <svg fill={String(props.fill)} />} />
            </div>
        ));
        expect(refs).toEqual([...container.querySelectorAll('.semi-icon')]);
        expect(container.querySelectorAll('svg')[1]).toHaveAttribute('fill', 'red');
    });

    it('SVG 工厂保留 style 字符串与 mask-type', () => {
        const Svg = createSvgComponent({
            name: 'fixture',
            attrs: { style: 'isolation:isolate', viewBox: '0 0 2 2' },
            children: [['mask', { 'mask-type': 'alpha', style: 'mask-type:alpha' }]],
        });
        const { container } = render(() => <Svg />);
        expect(container.querySelector<SVGSVGElement>('svg')?.style.isolation).toBe('isolate');
        expect(container.querySelector('mask')).toHaveAttribute('mask-type', 'alpha');
    });
});
