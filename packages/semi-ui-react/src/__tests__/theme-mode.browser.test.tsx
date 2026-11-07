import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import '@fibrae/semi-foundation/base/tokens.scss';

const primary = (el: Element) => getComputedStyle(el).getPropertyValue('--semi-color-primary').trim();
const bg0 = (el: Element) => getComputedStyle(el).getPropertyValue('--semi-color-bg-0').trim();

describe('主题模式', () => {
    afterEach(() => {
        document.body.removeAttribute('theme-mode');
    });

    it('body 切换 theme-mode 后语义 token 随之变化', async () => {
        const light = bg0(document.body);
        document.body.setAttribute('theme-mode', 'dark');
        await expect.poll(() => bg0(document.body)).not.toBe(light);
        document.body.removeAttribute('theme-mode');
        await expect.poll(() => bg0(document.body)).toBe(light);
        expect(primary(document.body)).not.toBe('');
    });

    it('暗色 body 下 semi-always-light 子树回到浅色', async () => {
        const { container } = render(<div className="semi-always-light" />);
        const light = bg0(document.body);
        document.body.setAttribute('theme-mode', 'dark');
        await expect.poll(() => bg0(document.body)).not.toBe(light);
        expect(bg0(container.firstElementChild)).toBe(light);
    });

    it('浅色 body 下 always-dark 内嵌 always-light 时内部取浅色', () => {
        const { container } = render(
            <div className="semi-always-dark">
                <div className="semi-always-light" />
            </div>
        );
        const dark = container.querySelector('.semi-always-dark');
        const inner = container.querySelector('.semi-always-light');
        expect(bg0(dark)).not.toBe(bg0(document.body));
        expect(bg0(inner)).toBe(bg0(document.body));
    });
});
