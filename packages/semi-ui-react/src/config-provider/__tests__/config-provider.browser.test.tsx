import { render, screen } from '@testing-library/react';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { Modal, Switch, Tooltip } from '@fibrae/semi-ui-react';
import ConfigProvider from '../index';

const layoutOf = (name: string) => {
    const root = screen.getByRole('switch', { name }).closest('.semi-switch') as HTMLElement;
    const box = root.getBoundingClientRect();
    const knob = (root.querySelector('.semi-switch-knob') as HTMLElement).getBoundingClientRect();
    return { direction: getComputedStyle(root).direction, knobOnLeft: knob.left - box.left < box.right - knob.right };
};

describe('ConfigProvider 方向（浏览器）', () => {
    it('rtl 内嵌套 direction="ltr" 的 ConfigProvider 时，内层组件按 ltr 渲染', () => {
        render(
            <ConfigProvider direction="rtl">
                <Switch aria-label="outer" />
                <ConfigProvider direction="ltr">
                    <Switch aria-label="inner" />
                </ConfigProvider>
            </ConfigProvider>
        );
        expect(layoutOf('outer')).toEqual({ direction: 'rtl', knobOnLeft: false });
        expect(layoutOf('inner')).toEqual({ direction: 'ltr', knobOnLeft: true });
    });

    it('页面为 dir="rtl" 时，最外层 direction="ltr" 的 ConfigProvider 内组件按 ltr 渲染', () => {
        render(
            <div dir="rtl">
                <ConfigProvider direction="ltr">
                    <Switch aria-label="inner" />
                </ConfigProvider>
            </div>
        );
        expect(layoutOf('inner')).toEqual({ direction: 'ltr', knobOnLeft: true });
    });
});

describe('弹层方向（浏览器）', () => {
    const popups = (name: string) => (
        <>
            <Tooltip content={`tip-${name}`} trigger="custom" visible>
                <span>{name}</span>
            </Tooltip>
            <Modal title={`modal-${name}`} mask={false} motion={false} visible />
        </>
    );
    const directionsOf = async (name: string) => {
        const tooltip = (await screen.findByText(`tip-${name}`)).closest('.semi-tooltip-wrapper') as HTMLElement;
        const modal = screen.getByRole('dialog', { name: `modal-${name}` });
        return [getComputedStyle(tooltip).direction, getComputedStyle(modal).direction];
    };

    it('纯 rtl 时弹层按 rtl 渲染', async () => {
        render(<ConfigProvider direction="rtl">{popups('rtl')}</ConfigProvider>);
        expect(await directionsOf('rtl')).toEqual(['rtl', 'rtl']);
    });

    it('rtl 页面内 rtl 嵌套 ltr 时，内层弹层按 ltr 渲染', async () => {
        document.documentElement.dir = 'rtl';
        onTestFinished(() => document.documentElement.removeAttribute('dir'));
        render(
            <ConfigProvider direction="rtl">
                {popups('outer')}
                <ConfigProvider direction="ltr">{popups('inner')}</ConfigProvider>
            </ConfigProvider>
        );
        expect(await directionsOf('outer')).toEqual(['rtl', 'rtl']);
        expect(await directionsOf('inner')).toEqual(['ltr', 'ltr']);
    });
});
