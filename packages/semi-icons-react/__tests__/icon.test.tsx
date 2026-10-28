import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { IconActivity, IconAIBellLevel2, IconAILoading, IconAlarm } from '../src';
import Icon from '../src/components/Icon';

describe('semi-icons-react', () => {
    it('图标数据的 DOM 属性名渲染为对应的 SVG 属性', () => {
        const { container } = render(<IconActivity />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('path')).toHaveAttribute('fill-rule', 'evenodd');
    });

    it('双色图标把 fill 分给各自的元素，根 svg 不接收 fill', () => {
        const { container, rerender } = render(<IconAIBellLevel2 />);
        const fills = () => [...container.querySelectorAll('path')].map((path) => path.getAttribute('fill'));
        expect(fills()).toEqual(['rgba(166,71,255)', 'currentColor']);
        rerender(<IconAIBellLevel2 fill={['red', 'blue']} />);
        expect(fills()).toEqual(['red', 'blue']);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'none');
    });

    it('不修改四色图标的 fill 数组', () => {
        const fill = ['a', 'b', 'c', 'd'];
        const { container, rerender } = render(<IconAILoading fill={fill} />);
        rerender(<IconAILoading fill={fill} />);
        expect(fill).toEqual(['a', 'b', 'c', 'd']);
        const stops = [...container.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
        expect(stops).toEqual(['d', 'c', 'b', 'a']);
    });

    it('渲染间 gradient id 保持稳定，并让 stroke 指向它', () => {
        const { container, rerender } = render(<IconAILoading />);
        const id = container.querySelector('linearGradient').id;
        rerender(<IconAILoading />);
        expect(container.querySelector('linearGradient').id).toBe(id);
        expect(container.querySelector('path').getAttribute('stroke')).toBe(`url(#${id})`);
    });

    it('两个实例使用不同的 gradient id', () => {
        const { container } = render(
            <>
                <IconAILoading />
                <IconAILoading />
            </>
        );
        const [a, b] = container.querySelectorAll('linearGradient');
        expect(a.id).not.toBe(b.id);
    });

    it('未命名时作为装饰元素', () => {
        const { container, rerender } = render(<IconAlarm />);
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).not.toHaveAttribute('role');
        expect(icon).not.toHaveAttribute('aria-label');

        rerender(<IconAlarm aria-label="Alarm" />);
        expect(screen.getByRole('img', { name: 'Alarm' })).toBe(icon);
        expect(icon).not.toHaveAttribute('aria-hidden');

        rerender(
            <>
                <span id="alarm-name">Alarm set</span>
                <IconAlarm aria-labelledby="alarm-name" />
            </>
        );
        expect(screen.getByRole('img', { name: 'Alarm set' })).toHaveClass('semi-icon');

        // an empty name is no name
        rerender(<IconAlarm aria-label="" />);
        expect(container.querySelector('.semi-icon')).toHaveAttribute('aria-hidden', 'true');
    });

    it('可聚焦时保持暴露，使 Tab 焦点不被隐藏', () => {
        const { container } = render(<IconAlarm tabIndex={0} />);
        const icon = container.querySelector('.semi-icon');
        expect(icon).toHaveAttribute('role', 'img');
        expect(icon).not.toHaveAttribute('aria-hidden');
        expect(icon).not.toHaveAttribute('aria-label');
    });

    it('渲染 size、spin 与 rotate', () => {
        const { container } = render(<IconAlarm size="large" spin rotate={90} />);
        const icon = container.querySelector<HTMLElement>('.semi-icon');
        expect(icon.classList).toContain('semi-icon-large');
        expect(icon.classList).toContain('semi-icon-spinning');
        expect(icon.style.transform).toBe('rotate(90deg)');
    });

    it('内置与自定义图标都把 ref 传给外层 span', () => {
        const builtin = createRef<HTMLSpanElement>();
        const custom = createRef<HTMLSpanElement>();
        const { container } = render(
            <>
                <IconAlarm ref={builtin} />
                <Icon ref={custom} svg={<svg />} />
            </>
        );
        const [first, second] = container.querySelectorAll('.semi-icon');
        expect(builtin.current).toBe(first);
        expect(custom.current).toBe(second);
        expect(IconAlarm.elementType).toBe('Icon');
        expect(Icon.elementType).toBe('Icon');
    });
});
