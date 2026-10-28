import { createSignal } from 'solid-js';
import { render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import type { UploadProps } from '@fibrae/semi-ui-solid/upload/index';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import AIChatInput from '../index';

const prefix = 'semi-aiChatInput';

// composites a computed color over an opaque background and returns its relative luminance; Chrome serializes
// relative color syntax as color(srgb ...) with 0-1 channels instead of rgb()/rgba() with 0-255 channels
function luminance(color: string, backdrop = [0, 0, 0]) {
    const scale = color.startsWith('color(srgb') ? 255 : 1;
    const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number);
    return [r, g, b].reduce((sum, channel, index) => {
        const c = (a * channel * scale + (1 - a) * backdrop[index]) / 255;
        const linear = c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
}

function contrast(foreground: string, background: string) {
    const [light, dark] = [luminance(foreground, [22, 22, 26]), luminance(background, [22, 22, 26])].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

const el = (parent: ParentNode, selector: string) => parent.querySelector(selector) as HTMLElement;

async function find<T extends Element = HTMLElement>(query: () => T | null | undefined) {
    return waitFor(() => {
        const el = query();
        expect(el).not.toBeNull();
        return el as T;
    });
}

describe('AIChatInput', () => {
    it('renderUploadButton 渲染的按钮不被 footer-action 后代规则清掉内边距和边框', async () => {
        const { container } = render(() => <AIChatInput renderUploadButton={() => <button type="button">custom</button>} />);
        const custom = await find(() => container.querySelector<HTMLElement>(`.${prefix}-footer-action button:not([aria-label])`));
        const style = getComputedStyle(custom);
        expect([style.paddingInlineStart, style.borderTopWidth]).toEqual(['6px', '2px']);
    });

    it('暗色模式下附件删除按钮和滚动按钮的图标与底色保持足够对比度', async () => {
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        const files: UploadProps['defaultFileList'] = Array.from({ length: 6 }, (_, index) => ({
            uid: String(index),
            name: `a${index}.png`,
            size: '1KB',
            status: 'success',
            url: 'https://semi.design/a.png',
        }));
        const { container } = render(() => (
            <div style={{ width: '400px' }}>
                <AIChatInput uploadProps={{ action: '', defaultFileList: files }} />
            </div>
        ));
        const remove = await find(() => container.querySelector<HTMLElement>(`.${prefix}-attachment-delete`));
        const scroll = await find(() => container.querySelector<HTMLElement>(`.${prefix}-scroll-button-right`));
        const removeStyle = getComputedStyle(remove);
        const scrollStyle = getComputedStyle(scroll);
        const scrollIcon = getComputedStyle(el(scroll, 'svg'));
        expect(contrast(removeStyle.color, removeStyle.backgroundColor)).toBeGreaterThan(3);
        expect(contrast(scrollIcon.color, scrollStyle.backgroundColor)).toBeGreaterThan(3);
    });

    it('方向键移到长列表末项时，skill 与建议面板滚动到该项', async () => {
        const items = Array.from({ length: 30 }, (_, index) => ({ label: `skill ${index}`, value: `s${index}` }));
        const [suggestions, setSuggestions] = createSignal<string[]>();
        const { container } = render(() => <AIChatInput skillHotKey="/" skills={items} suggestions={suggestions()} />);
        const editor = await find(() => container.querySelector<HTMLElement>('.ProseMirror'));
        const expectActiveVisible = async (panelSelector: string) => {
            const panel = await find(() => document.querySelector<HTMLElement>(panelSelector));
            await userEvent.keyboard('{ArrowUp}');
            await waitFor(() => expect(panel.lastElementChild).toHaveAttribute('aria-selected', 'true'));
            expect(panel.scrollTop).toBeGreaterThan(0);
            const panelRect = panel.getBoundingClientRect();
            const itemRect = (panel.lastElementChild as HTMLElement).getBoundingClientRect();
            expect(itemRect.top).toBeGreaterThanOrEqual(panelRect.top);
            expect(itemRect.bottom).toBeLessThanOrEqual(panelRect.bottom + 1);
        };

        await userEvent.click(editor);
        await userEvent.keyboard('/');
        await expectActiveVisible(`.${prefix}-skill`);

        await userEvent.keyboard('{Escape}{Backspace}');
        setSuggestions(items.map((item) => item.label));
        await expectActiveVisible(`.${prefix}-suggestion`);
    });

    it('建议面板与输入框同宽，打开期间输入框变宽时跟随', async () => {
        const host = document.createElement('div');
        host.style.width = '400px';
        document.body.append(host);
        onTestFinished(() => host.remove());
        const [suggestions, setSuggestions] = createSignal<string[]>();
        const { container } = render(() => <AIChatInput suggestions={suggestions()} />, { container: host });
        await waitFor(() => expect(container.querySelector('.ProseMirror')).not.toBeNull());
        setSuggestions(['first', 'second']);
        const trigger = el(container, `.${prefix}`);
        const panel = () => document.querySelector(`.${prefix}-suggestion`)?.closest<HTMLElement>('[popover]');
        await waitFor(() => expect(panel()).toBeTruthy());
        await waitFor(() => expect(panel()?.getBoundingClientRect().width).toBe(trigger.getBoundingClientRect().width));
        host.style.width = '600px';
        await waitFor(() => expect(trigger.getBoundingClientRect().width).toBe(600));
        await waitFor(() => expect(panel()?.getBoundingClientRect().width).toBe(600));
    });

    it('面板渲染在 shadow root 内时，方向键仍把末项滚动到可见区域', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        // document styles do not reach into the shadow root; the panel only needs to scroll
        const style = document.createElement('style');
        style.textContent = `.${prefix}-skill { overflow: auto; }`;
        const root = document.createElement('div');
        shadow.append(style, root);

        const items = Array.from({ length: 30 }, (_, index) => ({ label: `skill ${index}`, value: `s${index}` }));
        const { container } = render(() => <AIChatInput skillHotKey="/" skills={items} />, { container: root });
        const editor = await find(() => container.querySelector<HTMLElement>('.ProseMirror'));
        // focused without a click: the unstyled panel lands under the pointer, and scrolling it would hover an item
        editor.focus();
        await userEvent.keyboard('/');
        const panel = await find(() => shadow.querySelector<HTMLElement>(`.${prefix}-skill`));
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(panel.lastElementChild).toHaveAttribute('aria-selected', 'true'));
        expect(panel.scrollTop).toBeGreaterThan(0);
    });

    it('发送按钮显示主题焦点环', async () => {
        const { container } = render(() => <AIChatInput />);
        const send = await find(() => container.querySelector(`.${prefix}-footer-action > .${prefix}-footer-action-button`));
        await tabTo(send);
        expectThemeFocusRing(send);
    });

    it('键盘激活底部按钮后焦点留在按钮上，鼠标点击空白处仍聚焦编辑器', async () => {
        const { container } = render(() => <AIChatInput showTemplateButton renderTemplate={() => 'template'} />);
        const button = await find(() => container.querySelector<HTMLElement>(`.${prefix}-footer-configure-button`));
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveFocus();

        await userEvent.click(el(container, `.${prefix}-footer`));
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('在宿主的 border-box 重置下，附件卡片能容纳其内容', async () => {
        // a layered host reset like the docs site's; an unlayered one would beat every Semi rule
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { box-sizing: border-box; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());
        const files: UploadProps['defaultFileList'] = [{ uid: '1', name: 'a.png', size: '1KB', status: 'success', url: 'https://semi.design/a.png' }];
        const { container } = render(() => <AIChatInput uploadProps={{ action: '', defaultFileList: files }} />);
        const card = await find(() => container.querySelector<HTMLElement>(`.${prefix}-attachment`));
        const inner = card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom);
        for (const part of card.children) {
            expect(part.getBoundingClientRect().bottom).toBeLessThanOrEqual(inner);
        }
        expect(card.offsetWidth).toBe(240);
    });

    it('传 uploadTipProps 时 Tab 从编辑器直接落到上传按钮，再到发送按钮，上传按钮显示主题焦点环', async () => {
        const { container } = render(() => <AIChatInput uploadTipProps={{ content: 'tip' }} />);
        const editor = await find(() => container.querySelector<HTMLElement>('.ProseMirror'));
        const upload = el(container, `.${prefix}-footer-action-upload`);
        editor.focus();
        await userEvent.keyboard('{Tab}');
        expect(upload).toHaveFocus();
        expectThemeFocusRing(upload);
        await waitFor(() => expect(upload).toHaveAccessibleDescription('tip'));
        await userEvent.keyboard('{Tab}');
        expect(container.querySelector(`.${prefix}-footer-action-send`)).toHaveFocus();
    });

    it('uploadProps.disabled 时默认上传按钮带 aria-disabled，仍可经 Tab 到达', async () => {
        const { container } = render(() => <AIChatInput uploadProps={{ action: '', disabled: true }} />);
        const editor = await find(() => container.querySelector<HTMLElement>('.ProseMirror'));
        const upload = el(container, `.${prefix}-footer-action-upload`);
        editor.focus();
        await userEvent.keyboard('{Tab}');
        expect(upload).toHaveFocus();
        expect(upload).toHaveAttribute('aria-disabled', 'true');
    });

    it('鼠标点击 Configure.Select 后焦点留在 Select 上，点击空白处才聚焦编辑器', async () => {
        const { container } = render(() => <AIChatInput renderConfigureArea={() => <AIChatInput.Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />} />);
        const select = await find(() => container.querySelector<HTMLElement>('.semi-select'));
        await userEvent.click(select);
        // the refocus runs in a requestAnimationFrame
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        expect(select.contains(document.activeElement)).toBe(true);

        await userEvent.click(el(container, `.${prefix}-footer`));
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('焦点在模板按钮上按 Escape 关闭模板面板，焦点留在按钮上', async () => {
        const { container } = render(() => <AIChatInput showTemplateButton renderTemplate={() => <i>template</i>} />);
        const button = await find(() => container.querySelector<HTMLElement>(`.${prefix}-footer-configure-button`));
        await userEvent.click(button);
        await waitFor(() => expect(document.querySelector(`.${prefix}-template`)).not.toBeNull());
        button.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector(`.${prefix}-template`)).toBeNull());
        expect(button).toHaveFocus();
    });

    it('引用项主体按钮没有原生按钮外观，Enter 与 Space 触发 onReferenceClick，Tab 再到删除按钮', async () => {
        const clicks: string[] = [];
        const { container } = render(() => <AIChatInput references={[{ id: 'r1', type: 'text', content: 'quoted text' }]} onReferenceClick={(reference) => clicks.push(reference.id)} />);
        const content = await find(() => container.querySelector<HTMLElement>(`.${prefix}-reference-content`));
        const style = getComputedStyle(content);
        expect([style.borderTopWidth, style.paddingInlineStart, style.backgroundColor]).toEqual(['0px', '0px', 'rgba(0, 0, 0, 0)']);
        await tabTo(content);
        expectThemeFocusRing(content);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(clicks).toEqual(['r1', 'r1']);
        await userEvent.keyboard('{Tab}');
        expect(container.querySelector(`.${prefix}-reference-delete`)).toHaveFocus();
    });

    it('输入槽在占位显示时按占位宽度留出最小宽度', async () => {
        const { container } = render(() => <AIChatInput defaultContent={'<p><input-slot placeholder="a long placeholder"></input-slot></p>'} />);
        const slot = await find(() => container.querySelector<HTMLElement>('.input-slot'));
        const placeholder = el(slot, '.input-slot-placeholder');
        await waitFor(() => expect(parseFloat(slot.style.minWidth)).toBe(placeholder.offsetWidth));
        expect(placeholder.offsetWidth).toBeGreaterThan(0);
    });
});
