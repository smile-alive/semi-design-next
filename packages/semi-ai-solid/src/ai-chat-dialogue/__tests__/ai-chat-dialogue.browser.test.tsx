import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/browser';
import type { ContentItem, Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Modal from '@fibrae/semi-ui-solid/modal/index';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import AIChatDialogue from '../index';

const prefix = `${BASE_CLASS_PREFIX}-ai-chat-dialogue`;
const roleConfig = {
    user: { name: 'User', avatar: 'https://example.com/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://example.com/assistant.png' },
};

const streamingChats = (lines: number): Message[] => [...Array.from({ length: 12 }, (_, i) => ({ id: String(i), role: i % 2 ? 'assistant' : 'user', content: `message ${i}`, status: 'completed' })), { id: 'last', role: 'assistant', status: 'in_progress', content: Array(lines).fill('line').join('\n\n') }];

const distanceToBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function find<T extends Element = HTMLElement>(query: () => T | null | undefined) {
    return waitFor(() => {
        const found = query();
        expect(found).toBeTruthy();
        return found as T;
    });
}

function renderList(chats: Message[], height: number) {
    const [list, setList] = createSignal(chats);
    const { container } = render(() => (
        <div style={{ height: `${height}px`, display: 'flex', 'flex-direction': 'column' }}>
            <AIChatDialogue chats={list()} roleConfig={roleConfig} />
        </div>
    ));
    return { container, update: setList };
}

const moreButton = (container: HTMLElement) => container.querySelector(`.${BASE_CLASS_PREFIX}-icon-more_stroked`)?.closest('button') as HTMLButtonElement;

// each chunk is followed once its markdown has rendered, so the list can trail by the latest chunk
async function streamLines(container: HTMLElement, update: (chats: Message[]) => void, first: number, last: number) {
    for (let n = first; n <= last; n++) {
        update(streamingChats(n));
        await waitFor(() => expect(container.textContent?.match(/line/g)).toHaveLength(n));
    }
}

describe('AIChatDialogue', () => {
    describe('跟随流式输出', () => {
        const findList = (container: HTMLElement) =>
            find(() => {
                const list = container.querySelector<HTMLElement>(`.${prefix}-list`);
                return list && list.scrollHeight > list.clientHeight ? list : null;
            });

        it('用户停在底部时持续跟随新内容', async () => {
            const { container, update } = renderList(streamingChats(2), 400);
            const list = await findList(container);
            await streamLines(container, update, 3, 8);
            expect(distanceToBottom(list)).toBeLessThan(100);
        });

        it('用户未通过滚轮离开底部时停止跟随，回到底部后恢复', async () => {
            const { container, update } = renderList(streamingChats(2), 400);
            const list = await findList(container);
            await waitFor(() => expect(container.textContent?.match(/line/g)).toHaveLength(2));
            list.scrollTop = list.scrollHeight;
            // scroll events fire once per frame; without the wait the two moves coalesce into one event at 0
            await nextFrame();
            list.scrollTop = 0;
            await waitFor(() => expect(container.querySelector(`.${prefix}-backBottom-button`)).not.toBeNull());
            await streamLines(container, update, 3, 6);
            expect(list.scrollTop).toBe(0);

            list.scrollTop = list.scrollHeight;
            await waitFor(() => expect(container.querySelector(`.${prefix}-backBottom-button`)).toBeNull());
            await streamLines(container, update, 7, 10);
            expect(distanceToBottom(list)).toBeLessThan(100);
        });

        it('流式输出期间焦点留在较早消息的操作按钮上', async () => {
            const { container, update } = renderList(streamingChats(2), 400);
            const copy = container.querySelector<HTMLElement>(`.${prefix}-wrapper .${prefix}-action button`) as HTMLElement;
            await tabTo(copy);
            await streamLines(container, update, 3, 6);
            expect(copy).toHaveFocus();
        });
    });

    describe('在头部插入更早的消息', () => {
        const history = (from: number, to: number): Message[] => Array.from({ length: to - from }, (_, k) => ({ id: `h${from + k}`, role: (from + k) % 2 ? 'assistant' : 'user', content: `history ${from + k}`, status: 'completed' }));
        const topOf = (container: HTMLElement, text: string) => ([...container.querySelectorAll('p')].find((node) => node.textContent === text) as HTMLElement).getBoundingClientRect().top;

        it.each([
            ['滚到顶部', () => 0],
            ['停在中间', (list: HTMLElement) => (list.scrollHeight - list.clientHeight) / 2],
        ])('%s时原有消息的位置不变', async (_, scrollTo) => {
            const chats = history(10, 20);
            const { container, update } = renderList(chats, 300);
            await waitFor(() => expect(container.textContent).toContain('history 19'));
            const list = container.querySelector<HTMLElement>(`.${prefix}-list`) as HTMLElement;
            list.scrollTop = scrollTo(list);
            await nextFrame();
            const before = topOf(container, 'history 10');

            update([...history(7, 10), ...chats]);
            await waitFor(() => expect(container.textContent).toContain('history 7'));
            await nextFrame();
            expect(topOf(container, 'history 10')).toBeCloseTo(before, 0);
        });

        it('加载更早的消息后，追加新消息仍恢复跟随并滚到底部', async () => {
            const chats = history(10, 20);
            const { container, update } = renderList(chats, 300);
            await waitFor(() => expect(container.textContent).toContain('history 19'));
            const list = container.querySelector<HTMLElement>(`.${prefix}-list`) as HTMLElement;
            list.scrollTop = 0;
            await nextFrame();
            update([...history(7, 10), ...chats]);
            await waitFor(() => expect(container.textContent).toContain('history 7'));
            expect(distanceToBottom(list)).toBeGreaterThan(100);

            update([...history(7, 10), ...chats, ...history(20, 21)]);
            await waitFor(() => expect(container.textContent).toContain('history 20'));
            expect(distanceToBottom(list)).toBeLessThan(100);
        });
    });

    it('代码块复制按钮显示主题焦点环', async () => {
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }]} roleConfig={roleConfig} />);
        const copy = await find(() => container.querySelector<HTMLElement>(`.${prefix}-code-topSlot-copy-wrapper`));
        await tabTo(copy);
        expectThemeFocusRing(copy);
    });

    it('非末条消息的操作栏可用 Tab 到达，聚焦时显示', async () => {
        const chats = [
            { id: '1', role: 'assistant', content: 'first', status: 'completed' },
            { id: '2', role: 'assistant', content: 'second', status: 'completed' },
        ];
        const { container } = render(() => <AIChatDialogue chats={chats} roleConfig={roleConfig} />);
        const action = container.querySelector<HTMLElement>(`.${prefix}-action`) as HTMLElement;
        const copy = action.querySelector<HTMLElement>('button') as HTMLElement;
        await tabTo(copy);
        expect(copy).toHaveFocus();
        expect(getComputedStyle(action).opacity).toBe('1');
    });

    it('更多按钮只有一个 Tab 停靠点，并显示主题焦点环', async () => {
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'assistant', content: 'hello', status: 'completed' }]} roleConfig={roleConfig} />);
        const more = moreButton(container);
        const stops: Element[] = [];
        while (document.activeElement !== more && stops.length < 30) {
            await userEvent.keyboard('{Tab}');
            stops.push(document.activeElement as Element);
        }
        expect(more).toHaveFocus();
        // a focusable wrapper around the button would be an extra stop drawn with the user agent ring
        expect(stops.filter((el) => el.contains(more))).toEqual([more]);
        expectThemeFocusRing(more);
        expect(more).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{Enter}');
        await expect.element(page.getByRole('menuitem')).toBeVisible();
        await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'true'));
    });

    it('更多菜单按 Escape 关闭，焦点留在更多按钮上', async () => {
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'assistant', content: 'hello', status: 'completed' }]} roleConfig={roleConfig} />);
        const more = moreButton(container);
        await tabTo(more);
        await userEvent.keyboard('{Enter}');
        await expect.element(page.getByRole('menuitem')).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.getByRole('menuitem').query()).toBeNull());
        expect(more).toHaveFocus();
    });

    it('在宿主的 border-box 重置下，文件卡片能容纳其名称和大小', () => {
        // a layered host reset like the docs site's; an unlayered one would beat every Semi rule
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { *, ::before, ::after { box-sizing: border-box; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf', size: '1KB' };
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }]} roleConfig={roleConfig} />);
        const card = container.querySelector<HTMLElement>(`.${prefix}-content-file`) as HTMLElement;
        const info = card.querySelector(`.${prefix}-content-file-info`) as HTMLElement;
        expect(info.getBoundingClientRect().bottom).toBeLessThanOrEqual(card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom));
        expect(card.offsetWidth).toBe(240);
    });

    it.each<[string, ContentItem[], string]>([
        ['the annotation', [{ type: 'message', content: [{ type: 'output_text', text: 'cited', annotations: [{ type: 'url_citation', title: 'A', url: 'https://a.example' }] }] }], `.${prefix}-annotation-wrapper`],
        ['the reasoning header', [{ type: 'reasoning', status: 'completed', summary: [{ text: 'done' }], content: [{ text: 'why' }] }], `.${prefix}-reasoning-header`],
        ['the file attachment link', [{ type: 'message', content: [{ type: 'input_file', filename: 'a.pdf', file_url: 'https://example.com/a.pdf', size: '1KB' }] }], `a.${prefix}-content-file`],
    ])('%s 显示主题焦点环', async (_, content, selector) => {
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'assistant', status: 'completed', content }]} roleConfig={roleConfig} />);
        const el = await find(() => container.querySelector<HTMLElement>(selector));
        await tabTo(el);
        expectThemeFocusRing(el);
    });

    it.each(['no-preference', 'reduce'])('鼠标点击更多菜单的删除项会弹出确认框（prefers-reduced-motion: %s）', async (motion) => {
        await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
        onTestFinished(async () => {
            Modal.destroyAll();
            await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
        });
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'assistant', content: 'hello', status: 'completed' }]} roleConfig={roleConfig} />);
        await userEvent.click(moreButton(container));
        await userEvent.click(page.getByRole('menuitem'));
        await expect.element(page.getByRole('alertdialog')).toBeVisible();
    });

    it('确认删除消息后，焦点交给消息列表而不是落到 body', async () => {
        onTestFinished(() => Modal.destroyAll());
        const [chats, setChats] = createSignal<Message[]>([
            { id: '1', role: 'assistant', content: 'first', status: 'completed' },
            { id: '2', role: 'assistant', content: 'second', status: 'completed' },
        ]);
        const { container } = render(() => <AIChatDialogue chats={chats()} roleConfig={roleConfig} onChatsChange={setChats} />);
        await userEvent.click(moreButton(container));
        await userEvent.click(page.getByRole('menuitem'));
        await userEvent.click(page.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-wrapper`)).toHaveLength(1));
        await waitFor(() => expect(container.querySelector(`.${prefix}-list`)).toHaveFocus());
    });

    it('键盘激活回到底部后，焦点交给消息列表而不是落到 body', async () => {
        const { container } = renderList(streamingChats(2), 300);
        const list = await find(() => {
            const found = container.querySelector<HTMLElement>(`.${prefix}-list`);
            return found && found.scrollHeight > found.clientHeight ? found : null;
        });
        list.scrollTop = list.scrollHeight;
        await nextFrame();
        list.scrollTop = 0;
        const back = await find(() => container.querySelector<HTMLElement>(`.${prefix}-backBottom-button`));
        back.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(container.querySelector(`.${prefix}-backBottom-button`)).toBeNull());
        expect(list).toHaveFocus();
    });

    it('步骤标题显示主题焦点环', async () => {
        const { container } = render(() => <AIChatDialogue.Step steps={[{ status: 'completed', summary: 'searched', actions: [{ summary: 'a', description: 'b' }] }]} />);
        const step = container.querySelector<HTMLElement>(`.${prefix}-step`) as HTMLElement;
        await tabTo(step);
        expectThemeFocusRing(step);
    });

    it('在提示项上按 Enter 不会按下 onHintClick 移走焦点的那个按钮', async () => {
        const onConfirm = vi.fn<() => void>();
        const confirm = () => screen.getByRole('button', { name: 'confirm' });
        render(() => (
            <>
                <AIChatDialogue chats={[]} hints={['hint one']} roleConfig={{}} onHintClick={() => confirm().focus()} />
                <button type="button" onClick={onConfirm}>
                    confirm
                </button>
            </>
        ));
        screen.getByRole('button', { name: 'hint one' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(confirm()).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('提示项显示主题焦点环', async () => {
        const { container } = render(() => <AIChatDialogue chats={[]} hints={['a hint']} roleConfig={roleConfig} onHintClick={() => {}} />);
        const hint = container.querySelector<HTMLElement>(`.${prefix}-hint-item`) as HTMLElement;
        await tabTo(hint);
        expectThemeFocusRing(hint);
    });

    const fileContent: ContentItem[] = [{ type: 'message', content: [{ type: 'input_file', filename: 'a.pdf', file_url: 'https://example.com/a.pdf' }] }];
    const renderQuote = (content: Message['content']) => {
        const { container } = render(() => <AIChatDialogue chats={[{ id: '1', role: 'user', status: 'completed', content }]} roleConfig={roleConfig} showReference />);
        return find(() => container.querySelector<HTMLElement>(`.${prefix}-content-icon-reference`));
    };

    it.each<[string, Message['content']]>([
        ['a text message', 'hello'],
        ['a file card', fileContent],
    ])('%s 的引用图标可通过 Tab 访问，聚焦时显示', async (_, content) => {
        const quote = await renderQuote(content);
        expect(quote.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        await tabTo(quote);
        expectThemeFocusRing(quote);
        const { position, marginTop, marginRight, paddingLeft } = getComputedStyle(quote);
        expect({ position, marginTop, marginRight }).toEqual({ position: 'static', marginTop: '0px', marginRight: '0px' });
        expect(parseFloat(paddingLeft)).toBeGreaterThan(0);
    });

    it('文件卡片聚焦时的引用图标位于卡片右端，与悬停时一致', async () => {
        const quote = await renderQuote(fileContent);
        await tabTo(quote);
        const card = quote.closest(`.${prefix}-content-file`) as HTMLElement;
        const cardRight = card.getBoundingClientRect().right - parseFloat(getComputedStyle(card).paddingRight);
        expect(quote.getBoundingClientRect().right).toBeCloseTo(cardRight, 0);
    });
});
