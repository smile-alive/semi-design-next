/** @jsxImportSource vue */
import { shallowRef } from 'vue';
import { waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import type { Attachment } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import AIChatInput from '../index';

const prefix = 'semi-aiChatInput';

const find = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
    waitFor(() => {
        const found = root.querySelector<T>(selector);
        expect(found).not.toBeNull();
        return found as T;
    });

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
    const [light, dark] = [luminance(foreground, [22, 22, 26]), luminance(background, [22, 22, 26])].toSorted((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

const attachmentsOf = (count: number): Attachment[] =>
    Array.from({ length: count }, (_, index) => ({
        uid: String(index),
        name: `a${index}.png`,
        size: '1KB',
        status: 'success',
        url: 'https://semi.design/a.png',
    }));

describe('AIChatInput', () => {
    it('#uploadButton 渲染的按钮不被 footer-action 后代规则清掉内边距和边框', async () => {
        const { container } = render(() => (
            <AIChatInput>
                {{
                    uploadButton: () => <button type="button">custom</button>,
                }}
            </AIChatInput>
        ));
        const custom = await find(`.${prefix}-footer-action button:not([aria-label])`, container);
        const style = getComputedStyle(custom);
        expect([style.paddingInlineStart, style.borderTopWidth]).toEqual(['6px', '2px']);
    });

    it('暗色模式下附件删除按钮和滚动按钮的图标与底色保持足够对比度', async () => {
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        const { container } = render(() => (
            <div style={{ width: '400px' }}>
                <AIChatInput uploadProps={{ defaultFileList: attachmentsOf(6) }} />
            </div>
        ));
        const remove = await find(`.${prefix}-attachment-delete`, container);
        const scroll = await find(`.${prefix}-scroll-button-right`, container);
        const removeStyle = getComputedStyle(remove);
        const scrollStyle = getComputedStyle(scroll);
        const scrollIcon = getComputedStyle(scroll.querySelector('svg') as SVGElement);
        expect(contrast(removeStyle.color, removeStyle.backgroundColor)).toBeGreaterThan(3);
        expect(contrast(scrollIcon.color, scrollStyle.backgroundColor)).toBeGreaterThan(3);
    });

    it('方向键移到长列表末项时，skill 与建议面板滚动到该项', async () => {
        const items = Array.from({ length: 30 }, (_, index) => ({ label: `skill ${index}`, value: `s${index}` }));
        const suggestions = shallowRef<string[]>();
        const { container } = render(() => <AIChatInput skillHotKey="/" skills={items} suggestions={suggestions.value} />);
        const editor = await find('.ProseMirror', container);
        const expectActiveVisible = async (panelSelector: string) => {
            const panel = await find(panelSelector);
            await userEvent.keyboard('{ArrowUp}');
            await waitFor(() => expect(panel.lastElementChild).toHaveAttribute('aria-selected', 'true'));
            expect(panel.scrollTop).toBeGreaterThan(0);
            const panelRect = panel.getBoundingClientRect();
            const itemRect = (panel.lastElementChild as Element).getBoundingClientRect();
            expect(itemRect.top).toBeGreaterThanOrEqual(panelRect.top);
            expect(itemRect.bottom).toBeLessThanOrEqual(panelRect.bottom + 1);
        };

        await userEvent.click(editor);
        await userEvent.keyboard('/');
        await expectActiveVisible(`.${prefix}-skill`);

        await userEvent.keyboard('{Escape}{Backspace}');
        suggestions.value = items.map((item) => item.label);
        await expectActiveVisible(`.${prefix}-suggestion`);
    });

    it('建议面板与输入框同宽，打开期间输入框变宽时跟随', async () => {
        const host = document.createElement('div');
        host.style.width = '400px';
        document.body.append(host);
        onTestFinished(() => host.remove());
        const suggestions = shallowRef<string[]>();
        const { container } = render(() => <AIChatInput suggestions={suggestions.value} />, { container: host });
        await find('.ProseMirror', container);
        suggestions.value = ['first', 'second'];
        const trigger = await find(`.${prefix}`, container);
        const panel = () => document.querySelector(`.${prefix}-suggestion`)?.closest<HTMLElement>('[popover]') ?? null;
        await waitFor(() => expect(panel()).not.toBeNull());
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
        const editor = await find('.ProseMirror', container);
        // focused without a click: the unstyled panel lands under the pointer, and scrolling it would hover an item
        editor.focus();
        await userEvent.keyboard('/');
        const panel = await find(`.${prefix}-skill`, shadow);
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(panel.lastElementChild).toHaveAttribute('aria-selected', 'true'));
        expect(panel.scrollTop).toBeGreaterThan(0);
    });

    it('发送按钮显示主题焦点环', async () => {
        const { container } = render(() => <AIChatInput />);
        const send = await find(`.${prefix}-footer-action > .${prefix}-footer-action-button`, container);
        await tabTo(send);
        expectThemeFocusRing(send);
    });

    it('传 uploadTipProps 时 Tab 从编辑器直接落到上传按钮，再到发送按钮，上传按钮显示主题焦点环', async () => {
        const { container } = render(() => <AIChatInput uploadTipProps={{ position: 'top' }}>{{ uploadTip: () => 'tip' }}</AIChatInput>);
        const editor = await find('.ProseMirror', container);
        const upload = await find(`.${prefix}-footer-action-upload`, container);
        editor.focus();
        await userEvent.keyboard('{Tab}');
        expect(upload).toHaveFocus();
        expectThemeFocusRing(upload);
        await waitFor(() => expect(upload).toHaveAccessibleDescription('tip'));
        await userEvent.keyboard('{Tab}');
        expect(container.querySelector(`.${prefix}-footer-action-send`)).toHaveFocus();
    });

    it('uploadProps.disabled 时默认上传按钮带 aria-disabled，仍可经 Tab 到达', async () => {
        const { container } = render(() => <AIChatInput uploadProps={{ disabled: true }} />);
        const editor = await find('.ProseMirror', container);
        const upload = await find(`.${prefix}-footer-action-upload`, container);
        editor.focus();
        await userEvent.keyboard('{Tab}');
        expect(upload).toHaveFocus();
        expect(upload).toHaveAttribute('aria-disabled', 'true');
    });

    it('引用项主体按钮没有原生按钮外观，Enter 与 Space 触发 referenceClick，Tab 再到删除按钮', async () => {
        const clicks: string[] = [];
        const { container } = render(() => <AIChatInput references={[{ id: 'r1', type: 'text', content: 'quoted text' }]} onReferenceClick={(reference: { id: string }) => clicks.push(reference.id)} />);
        const content = await find(`.${prefix}-reference-content`, container);
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

    it('渲染在 shadow root 内时，删除引用项后焦点从删除按钮移到编辑器', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const root = document.createElement('div');
        shadow.append(root);
        const references = shallowRef([
            { id: 'r1', type: 'text', content: 'first' },
            { id: 'r2', type: 'text', content: 'second' },
        ]);
        const { container } = render(() => <AIChatInput references={references.value} onReferenceDelete={() => (references.value = references.value.slice(1))} />, { container: root });
        await find('.ProseMirror', container);
        const remove = await find<HTMLElement>(`.${prefix}-reference-delete`, container);
        remove.focus();
        expect(shadow.activeElement).toBe(remove);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(shadow.activeElement).toBe(container.querySelector('.ProseMirror')));
    });

    it('键盘激活底部按钮后焦点留在按钮上，鼠标点击空白处仍聚焦编辑器', async () => {
        const { container } = render(() => <AIChatInput showTemplateButton>{{ template: () => 'template' }}</AIChatInput>);
        const button = await find(`.${prefix}-footer-configure-button`, container);
        await tabTo(button);
        await userEvent.keyboard('{Enter}');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveFocus();

        await userEvent.click(await find(`.${prefix}-footer`, container));
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('在宿主的 border-box 重置下，附件卡片能容纳其内容', async () => {
        // a layered host reset like the docs site's; an unlayered one would beat every Semi rule
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { box-sizing: border-box; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());
        const { container } = render(() => <AIChatInput uploadProps={{ defaultFileList: attachmentsOf(1) }} />);
        const card = await find(`.${prefix}-attachment`, container);
        const inner = card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom);
        for (const part of card.children) {
            expect(part.getBoundingClientRect().bottom).toBeLessThanOrEqual(inner);
        }
        expect(card.offsetWidth).toBe(240);
    });

    it('两个 select-slot 的 listbox id 不同', async () => {
        const options = JSON.stringify(['a', 'b']).replaceAll('"', '&quot;');
        const { container } = render(() => <AIChatInput defaultContent={`<p><select-slot value="a" options="${options}"></select-slot> and <select-slot value="b" options="${options}"></select-slot></p>`} />);
        // every node view is its own Vue app; without the editor's id prefix both useId calls would yield the same id
        const comboboxes = await waitFor(() => {
            const found = [...container.querySelectorAll('.node-selectSlot [role="combobox"]')];
            expect(found).toHaveLength(2);
            return found;
        });
        const [first, second] = comboboxes.map((combobox) => combobox.getAttribute('aria-controls'));
        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
        expect(first).not.toBe(second);
    });

    it('鼠标点击 Configure.Select 后焦点留在 Select 上，点击空白处才聚焦编辑器', async () => {
        const { container } = render(() => (
            <AIChatInput>
                {{
                    configureArea: () => <AIChatInput.Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />,
                }}
            </AIChatInput>
        ));
        const select = await find('.semi-select', container);
        await userEvent.click(select);
        // the refocus runs in a requestAnimationFrame
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        expect(select.contains(document.activeElement)).toBe(true);

        await userEvent.click(await find(`.${prefix}-footer`, container));
        await waitFor(() => expect(container.querySelector('.ProseMirror')).toHaveFocus());
    });

    it('焦点在模板按钮上按 Escape 关闭模板面板，焦点留在按钮上', async () => {
        const { container } = render(() => (
            <AIChatInput showTemplateButton>
                {{
                    template: () => <i>template</i>,
                }}
            </AIChatInput>
        ));
        const button = await find(`.${prefix}-footer-configure-button`, container);
        await userEvent.click(button);
        await find(`.${prefix}-template`);
        button.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector(`.${prefix}-template`)).toBeNull());
        expect(button).toHaveFocus();
    });

    it('input-slot 的占位文字落在槽位框内，槽位与周围文字同行', async () => {
        const { container } = render(() => <AIChatInput defaultContent={'<p>before <input-slot placeholder="your topic"></input-slot> after</p>'} />);
        const slot = await find('.node-inputSlot .input-slot', container);
        const placeholder = await find('.input-slot-placeholder', slot);
        await waitFor(() => expect(placeholder).toBeVisible());
        const slotRect = slot.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        expect(placeholderRect.left).toBeGreaterThanOrEqual(slotRect.left);
        await waitFor(() => expect(slot.getBoundingClientRect().right).toBeGreaterThanOrEqual(placeholderRect.right));
        const paragraph = slot.closest('p') as HTMLElement;
        const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
        expect(paragraph.getBoundingClientRect().height).toBeLessThan(slotRect.height + lineHeight);
    });
});
