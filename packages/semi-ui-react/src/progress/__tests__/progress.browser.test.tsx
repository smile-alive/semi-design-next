import { render } from '@testing-library/react';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Progress, { type ProgressProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-progress`;

/** Paints the computed color on a canvas pixel, which turns any CSS color syntax into [r, g, b, a] bytes */
function toRgba(color: string) {
    const context = document.createElement('canvas').getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
}

function expectColorClose(actual: number[], expected: number[]) {
    actual.forEach((channel, i) => expect(Math.abs(channel - expected[i])).toBeLessThanOrEqual(1));
}

const ringColor = (props: ProgressProps) => {
    const { container, unmount } = render(<Progress type="circle" {...props} />);
    const color = toRgba(getComputedStyle(container.querySelector(`.${prefixCls}-circle-ring-inner`)).stroke);
    unmount();
    return color;
};

describe('Progress stroke 颜色', () => {
    it('Semi 色板名随主题切换变色，不需要重新渲染', () => {
        const { container } = render(<Progress percent={50} stroke={[{ percent: 0, color: 'blue' }]} />);
        const inner = container.querySelector(`.${prefixCls}-track-inner`);
        const color = () => toRgba(getComputedStyle(inner).backgroundColor);
        expect(color()).toEqual([0, 100, 250, 255]);
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        expect(color()).toEqual([84, 169, 255, 255]);
    });

    it('渐变按区间位置混合相邻色标，色板名与其他写法可以混用', () => {
        const stroke = [
            { percent: 0, color: 'red' },
            { percent: 50, color: 'rgb(0, 99, 167)' },
            { percent: 100, color: 'hsla(125, 50%, 46%, 1)' },
        ];
        expectColorClose(ringColor({ stroke, strokeGradient: true, percent: 55 }), [6, 107, 157, 255]);
        const tokens = [
            { percent: 0, color: 'blue' },
            { percent: 100, color: 'white' },
        ];
        expectColorClose(ringColor({ stroke: tokens, strokeGradient: true, percent: 50 }), [128, 178, 253, 255]);
    });

    it('渐变的透明度从起点色向终点色过渡', () => {
        const stroke = [
            { percent: 0, color: '#ffffffff' },
            { percent: 100, color: '#ffffff00' },
        ];
        expect(ringColor({ stroke, strokeGradient: true, percent: 1 })[3]).toBe(252);
        expect(ringColor({ stroke, strokeGradient: true, percent: 99 })[3]).toBe(3);
    });
});
