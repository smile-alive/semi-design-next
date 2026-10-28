import { waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { JsonViewer as Core } from '@fibrae/semi-json-viewer-core';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import JsonViewer from '..';
import RealCustomRender from './fixtures/real-custom-render.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-json-viewer`;

const baseStr = `{
	"min_position": 1,
	"has_more_items": true,
	"items_html": "Bike",
	"new_latent_count": 0,
	"data": {
		"length": 22,
		"text": "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	},
	"numericalArray": [23, 29, 28, 26, 23],
	"StringArray": ["Oxygen", "Oxygen", "Oxygen", "Carbon"],
	"multipleTypesArray": 3,
	"objArray": [
		{},
		{
			"class": "upper",
			"name": "Mark",
			"age": 7
		},
		{
			"class": "upper",
			"name": "Tom",
			"age": 1
		},
		{
			"class": "lower",
			"name": "Jerry",
			"age": 5
		},
		{
			"class": "lower",
			"name": "Alice",
			"age": 3
		}
	]
}`;

const renderViewer = () =>
    render(JsonViewer, {
        props: {
            modelValue: baseStr,
            height: 400,
            options: { lineHeight: 20, autoWrap: true, formatOptions: { tabSize: 4 } },
            width: 700,
        },
    });

const element = (selector: string) => {
    const found = document.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
};
const lines = () => [...element('.lines-content').children] as HTMLElement[];
const tokenCount = (index: number) => (lines()[index].firstElementChild as HTMLElement).children.length;
const lineNumber = (n: number) => element(`.${prefixCls}-line-number[data-line-number="${n}"]`);
const completeContainer = () => element(`.${prefixCls}-complete-container`);
const suggestionCount = () => element(`.${prefixCls}-complete-suggestions-container`).children.length;
const searchResultCount = () => document.querySelectorAll(`.${prefixCls}-search-result`).length;
const trigger = () => element(`.${prefixCls}-search-bar-trigger`);
const searchInput = () => element(`.${prefixCls}-search-bar input`);
const scroller = () => element('.json-viewer-container');

// Clicking a line puts the caret at its end, so the arrows count columns from the start of the following line
async function typeTextAtPosition(line: number, column: number, text: string) {
    const arrows = '{ArrowRight}'.repeat(column);
    if (line === 1) {
        await userEvent.click(lines()[0]);
        await userEvent.keyboard(`{ArrowLeft}${arrows}${text}`);
    } else {
        await userEvent.click(lines()[line - 2]);
        await userEvent.keyboard(`${arrows}${text}`);
    }
}

const undo = (times: number) => userEvent.keyboard('{Control>}z{/Control}'.repeat(times));
const redo = (times: number) => userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}'.repeat(times));

async function toggleFold(n: number) {
    await userEvent.hover(element('.line-scroll-container'));
    await waitFor(() => expect(lineNumber(n).children).toHaveLength(2));
    await userEvent.click(lineNumber(n).children[1]);
}

const nextFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('JsonViewer', () => {
    it('滚动到底部', async () => {
        renderViewer();
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        expect(lines().at(-1)).not.toHaveAttribute('data-line-number', '36');
        scroller().scrollTop = scroller().scrollHeight;
        await waitFor(() => expect(lines().at(-1)).toHaveAttribute('data-line-number', '36'));
    });

    it('滚动到顶部', async () => {
        renderViewer();
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        scroller().scrollTop = scroller().scrollHeight;
        await waitFor(() => expect(lines()[0]).not.toHaveAttribute('data-line-number', '1'));
        scroller().scrollTop = 0;
        await waitFor(() => expect(lines()[0]).toHaveAttribute('data-line-number', '1'));
    });

    it('折叠', async () => {
        renderViewer();
        await toggleFold(1);
        await waitFor(() => expect(lines()).toHaveLength(2));
        expect(lines().at(-1)).toHaveAttribute('data-line-number', '36');

        await toggleFold(1);
        await waitFor(() => expect(lines().length).toBeGreaterThan(2));
        const expandedLength = lines().length;

        await toggleFold(13);
        await waitFor(() => expect(lines()).toHaveLength(15));

        await toggleFold(13);
        await waitFor(() => expect(lines()).toHaveLength(expandedLength));
    });

    it('编辑', async () => {
        renderViewer();
        await typeTextAtPosition(1, 1, '{Enter}');
        await waitFor(() => expect(lines()[1].children).toHaveLength(1));
        await typeTextAtPosition(2, 2, '"');
        await typeTextAtPosition(2, 3, 'key');
        await typeTextAtPosition(2, 7, ':');
        await typeTextAtPosition(2, 8, '1');
        await typeTextAtPosition(2, 9, ',');
        await waitFor(() => expect(tokenCount(1)).toBe(5));

        await undo(1);
        await waitFor(() => expect(tokenCount(1)).toBe(4));
        await redo(1);
        await waitFor(() => expect(tokenCount(1)).toBe(5));
        await undo(8);
        await waitFor(() => expect(tokenCount(1)).toBe(6));

        await typeTextAtPosition(2, 1, '{Backspace}');
        await waitFor(() => expect(tokenCount(0)).toBe(7));
        await undo(1);
        await waitFor(() => expect(tokenCount(0)).toBe(1));
        expect(tokenCount(1)).toBe(6);

        await typeTextAtPosition(14, 4, '{Enter}');
        await waitFor(() => expect(tokenCount(14)).toBe(1));
        await typeTextAtPosition(15, 4, 'c');
        await waitFor(() => expect(suggestionCount()).toBe(2));
        await userEvent.keyboard('{Enter}');
        await expect.poll(completeContainer).toHaveStyle({ display: 'none' });
        expect(tokenCount(14)).toBe(2);
        await typeTextAtPosition(15, 11, ':');
        await expect.poll(completeContainer).toHaveStyle({ display: 'block' });
        expect(suggestionCount()).toBe(2);
        await userEvent.keyboard('{Enter}');
        await expect.poll(completeContainer).toHaveStyle({ display: 'none' });
        await typeTextAtPosition(15, 19, ',{Enter}');
        await waitFor(() => expect(tokenCount(14)).toBe(5));
        await typeTextAtPosition(16, 4, 'a');
        await waitFor(() => expect(suggestionCount()).toBe(2));
        await typeTextAtPosition(16, 5, '{ArrowRight}');
        await expect.poll(completeContainer).toHaveStyle({ display: 'none' });
        await typeTextAtPosition(16, 5, 'g');
        await waitFor(() => expect(suggestionCount()).toBe(2));
        await userEvent.keyboard('{Enter}');
        await expect.poll(completeContainer).toHaveStyle({ display: 'none' });
        await typeTextAtPosition(16, 9, ':');
        await userEvent.keyboard('{Enter}');
        await expect.poll(completeContainer).toHaveStyle({ display: 'none' });
        await waitFor(() => expect(tokenCount(15)).toBe(4));

        await userEvent.click(trigger());
        const wholeWord = page.getByRole('button', { name: zh_CN.JsonViewer.wholeWord });
        const regExp = page.getByRole('button', { name: zh_CN.JsonViewer.regex });
        await userEvent.type(searchInput(), 'a');
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        await userEvent.click(wholeWord);
        await waitFor(() => expect(searchResultCount()).toBe(0));
        await userEvent.click(wholeWord);
        await userEvent.clear(searchInput());
        await waitFor(() => expect(searchResultCount()).toBe(0));
        await userEvent.type(searchInput(), '\\d+');
        await userEvent.click(regExp);
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        await userEvent.click(regExp);
        await userEvent.clear(searchInput());

        await userEvent.type(searchInput(), 'a');
        const [replaceInput, replaceButton, replaceAllButton] = element(`.${prefixCls}-replace-bar`).children;
        await userEvent.type(replaceInput.querySelector('input') as HTMLInputElement, 'x');
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        const length = searchResultCount();
        await userEvent.click(replaceButton);
        await waitFor(() => expect(searchResultCount()).toBe(length - 1));
        await userEvent.click(replaceAllButton);
        await waitFor(() => expect(searchResultCount()).toBe(0));
    });

    it('剪切在写入剪贴板成功后才删除内容', async () => {
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        try {
            renderViewer();
            await waitFor(() => expect(lines().length).toBeGreaterThan(1));
            await userEvent.click(lines()[1]);
            expect(lines()[1]).toMatchTextContent('min_position');
            await userEvent.keyboard('{Control>}x{/Control}');
            expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"min_position": 1,'));
            await waitFor(() => expect(lines()[1]).not.toMatchTextContent('min_position'));
        } finally {
            writeText.mockRestore();
        }
    });

    it('写入剪贴板失败时剪切不删除内容，并抛出错误', async () => {
        const error = new Error('clipboard denied');
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(error);
        const reasons: unknown[] = [];
        // a listener of our own also keeps the test runner from reporting the expected rejection as a failure
        const onRejection = (event: PromiseRejectionEvent) => reasons.push(event.reason);
        window.addEventListener('unhandledrejection', onRejection);
        try {
            renderViewer();
            await waitFor(() => expect(lines().length).toBeGreaterThan(1));
            await userEvent.click(lines()[1]);
            await userEvent.keyboard('{Control>}x{/Control}');
            expect(writeText).toHaveBeenCalledTimes(1);
            await nextFrames();
            expect(lines()[1]).toMatchTextContent('min_position');
            await waitFor(() => expect(reasons).toEqual([error]));
        } finally {
            window.removeEventListener('unhandledrejection', onRejection);
            writeText.mockRestore();
        }
    });

    it('autoWrap 挂载后，观察器的首次回调不会触发多余的重新测量', async () => {
        const resetMeasuredHeights = vi.spyOn(Core.prototype, 'resetMeasuredHeights');
        // a themed horizontal padding makes the content box narrower than the border box the initial measurement reads
        const padding = document.head.appendChild(document.createElement('style'));
        padding.textContent = `.${prefixCls} { padding-inline: 20px; }`;
        render(JsonViewer, { props: { modelValue: baseStr, height: 400, options: { autoWrap: true }, width: 700 } });
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        await nextFrames();
        try {
            expect(resetMeasuredHeights).not.toHaveBeenCalled();
        } finally {
            resetMeasuredHeights.mockRestore();
            padding.remove();
        }
    });

    it('只读内容是有名称的区域，键盘可以聚焦并滚动', async () => {
        render(JsonViewer, { props: { modelValue: baseStr, height: 200, options: { readOnly: true }, width: 700 } });
        const region = page.getByRole('region', { name: zh_CN.JsonViewer.content }).element();
        await tabTo(region);
        expectThemeFocusRing(region);
        expect(scroller().scrollTop).toBe(0);
        // not ArrowDown: Playwright's WebKit scrolls on Page keys only, not even a focused scroller on arrows
        await userEvent.keyboard('{PageDown}');
        await waitFor(() => expect(scroller().scrollTop).toBeGreaterThan(0));
    });

    it('可编辑内容是有名称的多行文本框，聚焦时只显示光标，没有焦点环', async () => {
        renderViewer();
        const textbox = page.getByRole('textbox', { name: zh_CN.JsonViewer.content }).element();
        expect(textbox).toHaveAttribute('aria-multiline', 'true');
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        await userEvent.click(lines()[0]);
        expect(textbox).toHaveFocus();
        expect(getComputedStyle(textbox).outlineStyle).toBe('none');
    });

    it('搜索栏的选项和关闭按钮都在搜索栏内', async () => {
        renderViewer();
        await userEvent.click(trigger());
        const container = element(`.${prefixCls}-search-bar-container`);
        const close = page.getByRole('button', { name: zh_CN.JsonViewer.close }).element();
        const style = getComputedStyle(container);
        const innerRight = container.getBoundingClientRect().right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
        expect(close.getBoundingClientRect().right).toBeLessThanOrEqual(innerRight);
        for (const item of document.querySelectorAll(`.${prefixCls}-search-options-item`)) {
            expect((item.querySelector('button') as HTMLElement).getBoundingClientRect().width).toBe(32);
        }
    });

    it('打开搜索栏时焦点移入搜索框，Esc 关闭后焦点回到触发按钮', async () => {
        renderViewer();
        await userEvent.click(trigger());
        // Vitest's role engine has no mapping for the native <search> element, so query the element itself
        await waitFor(() => expect(document.querySelector('search')).toHaveAttribute('aria-label', zh_CN.JsonViewer.search));
        await waitFor(() => expect(searchInput()).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger()).toHaveFocus());
    });

    it('Esc 在搜索栏的每个控件上都关闭搜索栏，且不再向外冒泡', async () => {
        renderViewer();
        const outer = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', outer);
        try {
            const names = [zh_CN.JsonViewer.caseSensitive, zh_CN.JsonViewer.nextMatch, zh_CN.JsonViewer.previousMatch, zh_CN.JsonViewer.replaceAll];
            for (const name of names) {
                await userEvent.click(trigger());
                await waitFor(() => expect(searchInput()).toHaveFocus());
                const control = page.getByRole('button', { name, exact: true });
                await userEvent.click(control);
                // Safari does not focus a button on click
                (control.element() as HTMLElement).focus();
                await userEvent.keyboard('{Escape}');
                await waitFor(() => expect(document.querySelector('search')).toBeNull());
            }
            await userEvent.click(trigger());
            await userEvent.click(page.getByRole('textbox', { name: zh_CN.JsonViewer.replace }));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(document.querySelector('search')).toBeNull());
            expect(outer.mock.calls.filter(([event]) => event.key === 'Escape')).toHaveLength(0);
        } finally {
            document.removeEventListener('keydown', outer);
        }
    });

    it('没有匹配项时点击替换不抛错，内容不变', async () => {
        renderViewer();
        await waitFor(() => expect(lines().length).toBeGreaterThan(1));
        const before = lines()[1].textContent;
        const errors: unknown[] = [];
        const onError = (event: ErrorEvent) => errors.push(event.error);
        window.addEventListener('error', onError);
        try {
            await userEvent.click(trigger());
            await userEvent.type(searchInput(), 'no-such-text');
            await userEvent.click(page.getByRole('button', { name: zh_CN.JsonViewer.replace, exact: true }));
            await nextFrames();
            expect(errors).toEqual([]);
            expect(lines()[1].textContent).toBe(before);
        } finally {
            window.removeEventListener('error', onError);
        }
    });

    it('替换文本为空时点击替换会删除当前匹配', async () => {
        renderViewer();
        await userEvent.click(trigger());
        await userEvent.type(searchInput(), 'a');
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        const length = searchResultCount();
        await userEvent.click(page.getByRole('button', { name: zh_CN.JsonViewer.replace, exact: true }));
        await waitFor(() => expect(searchResultCount()).toBe(length - 1));
    });

    it('关闭搜索栏后清除搜索高亮', async () => {
        renderViewer();
        await userEvent.click(trigger());
        await userEvent.type(searchInput(), 'a');
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger()).toHaveFocus());
        expect(searchResultCount()).toBe(0);
    });

    it('补全浮层是 listbox，建议项是 option', async () => {
        renderViewer();
        await typeTextAtPosition(14, 4, '{Enter}');
        await waitFor(() => expect(tokenCount(14)).toBe(1));
        await typeTextAtPosition(15, 4, 'c');
        await waitFor(() => expect(suggestionCount()).toBe(2));
        expect(page.getByRole('listbox').element()).toBeInTheDocument();
        expect(page.getByRole('option').elements()).toHaveLength(2);
    });

    it('触摸拖动搜索按钮后，下一次点击仍能打开搜索栏', async () => {
        renderViewer();
        const button = trigger();
        const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
        const { left, top } = button.getBoundingClientRect();
        pointer(button, 'pointerdown', { pointerId: 9, pointerType: 'touch', clientX: left + 5, clientY: top + 5 });
        pointer(document, 'pointermove', { pointerId: 9, pointerType: 'touch', clientX: left - 40, clientY: top + 20 });
        pointer(document, 'pointerup', { pointerId: 9, pointerType: 'touch' });
        await nextFrames();
        await userEvent.click(trigger());
        await waitFor(() => expect(searchInput()).toHaveFocus());
    });

    it('真实滚动时，没有自定义节点的空到空不再发出 customRender 通知', async () => {
        const spyLayout = vi.spyOn(Core.prototype, 'layout');
        try {
            render(RealCustomRender, { props: { value: baseStr } });
            await waitFor(() => expect(lines().length).toBeGreaterThan(0));
            const emit = vi.spyOn((spyLayout.mock.contexts[0] as Core).emitter, 'emit');
            const notified = () => emit.mock.calls.filter(([event]) => event === 'customRender').length;
            for (const top of [20, 40, 60]) {
                scroller().scrollTop = top;
                await nextFrames();
            }
            expect(notified()).toBe(0);
            scroller().scrollTop = scroller().scrollHeight;
            await waitFor(() => expect(document.querySelectorAll('.age-token').length).toBeGreaterThan(0));
            expect(notified()).toBeGreaterThan(0);
        } finally {
            spyLayout.mockRestore();
        }
    });

    it('#customRender 内的 Popover、Rating 显示在 token 位置，滚动后新 token 同样渲染且不留残留', async () => {
        render(RealCustomRender, { props: { value: baseStr } });
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        expect(document.querySelector('.name-token')).toBeNull();

        scroller().scrollTop = scroller().scrollHeight;
        await waitFor(() => expect(document.querySelectorAll('.age-token').length).toBeGreaterThan(0));
        const content = element('.lines-content');
        for (const token of document.querySelectorAll('.age-token, .name-token')) {
            expect(content.contains(token)).toBe(true);
        }

        scroller().scrollTop = 0;
        await waitFor(() => expect(lines()[0]).toHaveAttribute('data-line-number', '1'));
        await waitFor(() => expect(document.querySelector('.age-token')).toBeNull());

        scroller().scrollTop = 16 * 20;
        await waitFor(() => expect(document.querySelector('.name-token')).not.toBeNull());
        expect(element('.name-token')).toHaveTextContent('"Mark"');
        await userEvent.click(element('.name-token'));
        await expect.element(page.getByText('Mark details')).toBeVisible();
    });

    it('ShadowRoot 内搜索栏的选项开关触发搜索后，焦点仍在该开关上', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(JsonViewer, {
            container: mount,
            props: { modelValue: baseStr, height: 400, options: { lineHeight: 20, autoWrap: true, formatOptions: { tabSize: 4 } }, width: 700 },
        });
        try {
            await userEvent.click(shadow.querySelector(`.${prefixCls}-search-bar-trigger`) as Element);
            await userEvent.type(shadow.querySelector(`.${prefixCls}-search-bar input`) as Element, 'a');
            const wholeWord = (shadow.querySelector(`.${BASE_CLASS_PREFIX}-icon-whole_word`) as Element).closest('button') as HTMLButtonElement;
            wholeWord.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(wholeWord).toHaveAttribute('aria-pressed', 'true'));
            expect(shadow.activeElement).toBe(wholeWord);
        } finally {
            view.unmount();
            host.remove();
        }
    });
});
