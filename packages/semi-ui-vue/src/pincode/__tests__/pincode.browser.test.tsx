/** @jsxImportSource vue */
import { createApp } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import PinCode from '..';

const digit = (index: number, count = 4) => zh_CN.PinCode.digit.replace('${index}', String(index)).replace('${count}', String(count));
const input = (index: number) => screen.getByRole<HTMLInputElement>('textbox', { name: digit(index) });

describe('PinCode（浏览器）', () => {
    it('输入时焦点向后移动，Backspace 向前移动，聚焦的数字位显示主题焦点边框', async () => {
        render(PinCode, { props: { count: 4 }, attrs: { 'aria-label': 'code' } });
        await tabTo(input(1));
        const probe = document.createElement('span');
        probe.style.color = 'var(--semi-color-focus-border)';
        document.body.append(probe);
        const focusBorder = getComputedStyle(probe).color;
        probe.remove();
        expect(getComputedStyle(input(1).closest('.semi-input-wrapper') as Element).borderColor).toBe(focusBorder);

        await userEvent.keyboard('1');
        expect(input(2)).toHaveFocus();
        await userEvent.keyboard('2');
        expect(input(3)).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        expect(input(2)).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        expect(input(1)).toHaveFocus();
        expect(input(2)).toHaveValue('');
    });

    it('光标在已填字符之前输入时，写入的是新输入的字符', async () => {
        const onChange = vi.fn<(value: string) => void>();
        render(PinCode, { props: { defaultValue: '1', count: 4, onChange }, attrs: { 'aria-label': 'code' } });
        await userEvent.click(input(1));
        input(1).setSelectionRange(0, 0);
        await userEvent.keyboard('2');
        expect(onChange).toHaveBeenLastCalledWith('2');
        expect(input(1)).toHaveValue('2');
    });

    it('未设置 autofocus 时挂载不获取焦点', async () => {
        const plain = render(PinCode, { props: { count: 4 }, attrs: { 'aria-label': 'code' } });
        expect(document.body).toHaveFocus();
        plain.unmount();

        // Test Utils mounts into a detached node and attaches it afterwards, which drops a mount-time focus
        const host = document.body.appendChild(document.createElement('div'));
        const app = createApp(PinCode, { autofocus: true, count: 4, 'aria-label': 'code' });
        app.mount(host);
        onTestFinished(() => {
            app.unmount();
            host.remove();
        });
        await vi.waitFor(() => expect(input(1)).toHaveFocus());
    });

    it('焦点离开整个验证码时 blur 只发出一次，在数字位之间移动时不发出', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render({
            render: () => (
                <>
                    <PinCode aria-label="code" count={4} onBlur={onBlur} />
                    <button type="button">after</button>
                </>
            ),
        });
        await tabTo(input(1));
        await userEvent.keyboard('1');
        await userEvent.keyboard('2');
        expect(input(3)).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();

        await userEvent.keyboard('{Tab}{Tab}');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    // Playwright has no IME, so the composition goes through the Chromium input domain
    it('输入法组合提交一个字符时只发出一次 change，焦点移到下一格', async () => {
        const onChange = vi.fn<(value: string) => void>();
        render(PinCode, { props: { count: 4, format: 'mixed', onChange }, attrs: { 'aria-label': 'code' } });
        await userEvent.click(input(1));
        await cdp().send('Input.imeSetComposition', { text: 'a', selectionStart: 1, selectionEnd: 1 });
        expect(onChange).not.toHaveBeenCalled();
        await cdp().send('Input.insertText', { text: 'b' });
        await vi.waitFor(() => expect(input(2)).toHaveFocus());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('b');
        expect(input(1)).toHaveValue('b');
    });
});
