import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { Button, Input, Table } from '@fibrae/semi-ui-react';

function pick(el: Element, props: string[]) {
    const style = getComputedStyle(el);
    return Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)]));
}
const token = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();
// Serialized by the browser under test: Chromium on macOS computes BlinkMacSystemFont as "system-ui", on Linux it keeps the name
function computedFontFamily(fontFamily: string) {
    const probe = document.createElement('div');
    probe.style.fontFamily = fontFamily;
    document.body.append(probe);
    const value = getComputedStyle(probe).fontFamily;
    probe.remove();
    return value;
}
const FONT = computedFontFamily(`Inter, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif`);
const TEXT = ['font-size', 'line-height', 'font-weight', 'font-family'];
const BOX = ['height', 'padding-inline-start', 'padding-inline-end', 'padding-block-start', 'padding-block-end'];

describe('主题尺寸 token', () => {
    afterEach(() => {
        document.body.removeAttribute('theme-mode');
        document.body.style.removeProperty('--semi-font-size-regular');
    });

    // Values recorded before the size tokens became CSS variables: declaring them must not move any component
    it('Button、Input、Table 的关键尺寸保持不变', () => {
        const { container } = render(
            <>
                <Button>go</Button>
                <Button size="small">go</Button>
                <Button size="large">go</Button>
                <Input aria-label="name" />
                <Table columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[{ key: '1', name: 'a' }]} pagination={false} />
            </>
        );
        const [button, small, large] = container.querySelectorAll('.semi-button');
        expect(pick(button, [...BOX, ...TEXT])).toEqual({
            height: '32px',
            'padding-inline-start': '12px',
            'padding-inline-end': '12px',
            'padding-block-start': '6px',
            'padding-block-end': '6px',
            'font-size': '14px',
            'line-height': '20px',
            'font-weight': '600',
            'font-family': FONT,
        });
        expect(pick(small, ['height', 'padding-inline-start'])).toEqual({
            height: '24px',
            'padding-inline-start': '12px',
        });
        expect(pick(large, ['height', 'padding-inline-start'])).toEqual({
            height: '40px',
            'padding-inline-start': '16px',
        });
        expect(pick(container.querySelector('.semi-input-wrapper'), ['height', ...TEXT])).toEqual({
            height: '32px',
            'font-size': '14px',
            'line-height': '30px',
            'font-weight': '400',
            'font-family': FONT,
        });
        expect(pick(container.querySelector('.semi-input'), BOX)).toEqual({
            height: '30px',
            'padding-inline-start': '12px',
            'padding-inline-end': '12px',
            'padding-block-start': '0px',
            'padding-block-end': '0px',
        });
        expect(pick(container.querySelector('.semi-table-row-head'), [...BOX, ...TEXT])).toEqual({
            height: '45px',
            'padding-inline-start': '16px',
            'padding-inline-end': '16px',
            'padding-block-start': '12px',
            'padding-block-end': '12px',
            'font-size': '14px',
            'line-height': '20px',
            'font-weight': '600',
            'font-family': FONT,
        });
        expect(pick(container.querySelector('.semi-table-row-cell'), [...BOX, ...TEXT])).toEqual({
            height: '53px',
            'padding-inline-start': '16px',
            'padding-inline-end': '16px',
            'padding-block-start': '16px',
            'padding-block-end': '16px',
            'font-size': '14px',
            'line-height': '20px',
            'font-weight': '400',
            'font-family': FONT,
        });
        expect(pick(document.body, ['line-height', 'font-family'])).toEqual({
            'line-height': '22.8571px',
            'font-family': FONT,
        });
    });

    it('尺寸 token 声明在 body 上，暗色与 always-light 子树继承同一值', async () => {
        const { container } = render(<div className="semi-always-light" />);
        expect(token(document.body, '--semi-spacing-base')).toBe('16px');
        expect(token(document.body, '--semi-z-modal')).toBe('1000');
        document.body.setAttribute('theme-mode', 'dark');
        await expect.poll(() => token(document.body, 'color-scheme')).toBe('dark');
        expect(token(document.body, '--semi-font-size-regular')).toBe('14px');
        expect(token(container.firstElementChild, '--semi-height-control-default')).toBe('32px');
    });

    it('在 body 上覆盖字号 token 后组件随之变化', async () => {
        const { container } = render(<Button>go</Button>);
        const button = container.querySelector('.semi-button');
        document.body.style.setProperty('--semi-font-size-regular', '20px');
        await expect.poll(() => getComputedStyle(button).fontSize).toBe('20px');
    });
});
