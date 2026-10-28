import { useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { JsonViewer as Core } from '@fibrae/semi-json-viewer-core';
import { JsonViewer } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

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

const renderViewer = () => render(<JsonViewer value={baseStr} height={400} options={{ lineHeight: 20, autoWrap: true, formatOptions: { tabSize: 4 } }} width={700} />);

const lines = () => [...document.querySelector('.lines-content').children];
const tokenCount = (index) => lines()[index].firstElementChild.children.length;
const lineNumber = (n) => document.querySelector(`.${prefixCls}-line-number[data-line-number="${n}"]`);
const completeContainer = () => document.querySelector(`.${prefixCls}-complete-container`);
const suggestionCount = () => document.querySelector(`.${prefixCls}-complete-suggestions-container`).children.length;
const searchResultCount = () => document.querySelectorAll(`.${prefixCls}-search-result`).length;

// Clicking a line puts the caret at its end, so the arrows count columns from the start of the following line
async function typeTextAtPosition(line, column, text) {
    const arrows = '{ArrowRight}'.repeat(column);
    if (line === 1) {
        await userEvent.click(lines()[0]);
        await userEvent.keyboard(`{ArrowLeft}${arrows}${text}`);
    } else {
        await userEvent.click(lines()[line - 2]);
        await userEvent.keyboard(`${arrows}${text}`);
    }
}

const undo = (times) => userEvent.keyboard('{Control>}z{/Control}'.repeat(times));
const redo = (times) => userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}'.repeat(times));

async function toggleFold(n) {
    await userEvent.hover(document.querySelector('.line-scroll-container'));
    await waitFor(() => expect(lineNumber(n).children).toHaveLength(2));
    await userEvent.click(lineNumber(n).children[1]);
}

describe('JsonViewer', () => {
    it('滚动到底部', async () => {
        renderViewer();
        const container = document.querySelector('.json-viewer-container');
        // Lines are virtualized: the last one is only rendered once scrolled into view
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        expect(lines().at(-1)).not.toHaveAttribute('data-line-number', '36');
        container.scrollTop = container.scrollHeight;
        await waitFor(() => expect(lines().at(-1)).toHaveAttribute('data-line-number', '36'));
    });

    it('滚动到顶部', async () => {
        renderViewer();
        const container = document.querySelector('.json-viewer-container');
        container.scrollTop = container.scrollHeight;
        await waitFor(() => expect(lines()[0]).not.toHaveAttribute('data-line-number', '1'));
        container.scrollTop = 0;
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

        await userEvent.click(document.querySelector(`.${prefixCls}-search-bar-trigger`));
        const searchInput = document.querySelector(`.${prefixCls}-search-bar input`);
        const wholeWord = () => document.querySelector(`.${BASE_CLASS_PREFIX}-icon-whole_word`);
        const regExp = () => document.querySelector(`.${BASE_CLASS_PREFIX}-icon-reg_exp`);
        await userEvent.type(searchInput, 'a');
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        await userEvent.click(wholeWord());
        await waitFor(() => expect(searchResultCount()).toBe(0));
        await userEvent.click(wholeWord());
        await userEvent.clear(searchInput);
        await waitFor(() => expect(searchResultCount()).toBe(0));
        await userEvent.type(searchInput, '\\d+');
        await userEvent.click(regExp());
        await waitFor(() => expect(searchResultCount()).toBeGreaterThanOrEqual(1));
        await userEvent.click(regExp());
        await userEvent.clear(searchInput);

        await userEvent.type(searchInput, 'a');
        const [replaceInput, replaceButton, replaceAllButton] = document.querySelector(`.${prefixCls}-replace-bar`).children;
        await userEvent.type(replaceInput.querySelector('input'), 'x');
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
        const reasons = [];
        // a listener of our own also keeps the test runner from reporting the expected rejection as a failure
        const onRejection = (event: PromiseRejectionEvent) => reasons.push(event.reason);
        window.addEventListener('unhandledrejection', onRejection);
        try {
            renderViewer();
            await userEvent.click(lines()[1]);
            await userEvent.keyboard('{Control>}x{/Control}');
            expect(writeText).toHaveBeenCalledTimes(1);
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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
        render(<JsonViewer value={baseStr} height={400} options={{ autoWrap: true }} width={700} />);
        await waitFor(() => expect(lines().length).toBeGreaterThan(0));
        // the observer reports its initial size asynchronously, so wait past a couple of frames
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        try {
            expect(resetMeasuredHeights).not.toHaveBeenCalled();
        } finally {
            resetMeasuredHeights.mockRestore();
            padding.remove();
        }
    });

    it('只读内容是有名称的区域，键盘可以聚焦并滚动', async () => {
        render(<JsonViewer value={baseStr} height={200} options={{ readOnly: true }} width={700} />);
        const region = page.getByRole('region', { name: zh_CN.JsonViewer.content }).element();
        await tabTo(region);
        expectThemeFocusRing(region);
        const scroller = document.querySelector('.json-viewer-container');
        expect(scroller.scrollTop).toBe(0);
        // not ArrowDown: Playwright's WebKit scrolls on Page keys only, not even a focused scroller on arrows
        await userEvent.keyboard('{PageDown}');
        await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    });

    it('onChange 把内容回写到 value 时保留编辑器，焦点与连续输入不丢失', async () => {
        function Controlled() {
            const [value, setValue] = useState('{"a": 1}');
            return <JsonViewer value={value} height={400} options={{ lineHeight: 20 }} width={700} onChange={setValue} />;
        }
        render(<Controlled />);
        const textbox = page.getByRole('textbox', { name: zh_CN.JsonViewer.content }).element();
        await userEvent.click(lines()[0]);
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(lines().length).toBeGreaterThan(2));
        expect(textbox).toBeInTheDocument();
        expect(textbox).toHaveFocus();
    });

    it('可编辑内容是有名称的多行文本框，聚焦时只显示光标，没有焦点环', async () => {
        renderViewer();
        const textbox = page.getByRole('textbox', { name: zh_CN.JsonViewer.content }).element();
        expect(textbox).toHaveAttribute('aria-multiline', 'true');
        await userEvent.click(lines()[0]);
        expect(textbox).toHaveFocus();
        expect(getComputedStyle(textbox).outlineStyle).toBe('none');
    });

    it('搜索栏的选项和关闭按钮都在搜索栏内', async () => {
        renderViewer();
        await userEvent.click(document.querySelector(`.${prefixCls}-search-bar-trigger`));
        const container = document.querySelector(`.${prefixCls}-search-bar-container`);
        const close = page.getByRole('button', { name: zh_CN.JsonViewer.close }).element();
        const style = getComputedStyle(container);
        const innerRight = container.getBoundingClientRect().right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
        expect(close.getBoundingClientRect().right).toBeLessThanOrEqual(innerRight);
        for (const item of document.querySelectorAll(`.${prefixCls}-search-options-item`)) {
            expect(item.querySelector('button').getBoundingClientRect().width).toBe(32);
        }
    });

    it('打开搜索栏时焦点移入搜索框，Esc 关闭后焦点回到触发按钮', async () => {
        renderViewer();
        const trigger = () => document.querySelector(`.${prefixCls}-search-bar-trigger`);
        await userEvent.click(trigger());
        // Vitest's role engine has no mapping for the native <search> element, so query the element itself
        await waitFor(() => expect(document.querySelector('search')).toHaveAttribute('aria-label', zh_CN.JsonViewer.search));
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-search-bar input`)).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger()).toHaveFocus());
    });

    it('Esc 在搜索栏的每个控件上都关闭搜索栏，且不再向外冒泡', async () => {
        renderViewer();
        const outer = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', outer);
        const trigger = () => document.querySelector(`.${prefixCls}-search-bar-trigger`);
        const searchInput = () => document.querySelector(`.${prefixCls}-search-bar input`);
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

    it('真实滚动时，没有自定义节点的空到空不再发出 customRender 通知', async () => {
        const spyLayout = vi.spyOn(Core.prototype, 'layout');
        try {
            render(
                <JsonViewer
                    value={baseStr}
                    height={200}
                    options={{
                        readOnly: true,
                        customRenderRule: [
                            {
                                match: (value, path) => typeof value === 'number' && path.endsWith('.age'),
                                render: (value) => <span className="age-token">{String(value)}</span>,
                            },
                        ],
                    }}
                    width={700}
                />
            );
            await waitFor(() => expect(lines().length).toBeGreaterThan(0));
            const emit = vi.spyOn((spyLayout.mock.contexts[0] as Core).emitter, 'emit');
            const notified = () => emit.mock.calls.filter(([event]) => event === 'customRender').length;
            const container = document.querySelector('.json-viewer-container');
            const nextFrames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            for (const top of [20, 40, 60]) {
                container.scrollTop = top;
                await nextFrames();
            }
            expect(notified()).toBe(0);
            container.scrollTop = container.scrollHeight;
            await waitFor(() => expect(document.querySelectorAll('.age-token').length).toBeGreaterThan(0));
            expect(notified()).toBeGreaterThan(0);
        } finally {
            spyLayout.mockRestore();
        }
    });

    it('补全浮层是 listbox，建议项是 option，内容区指向当前选项', async () => {
        renderViewer();
        await typeTextAtPosition(14, 4, '{Enter}');
        await waitFor(() => expect(tokenCount(14)).toBe(1));
        await typeTextAtPosition(15, 4, 'c');
        await waitFor(() => expect(suggestionCount()).toBe(2));
        const options = page.getByRole('option').elements();
        expect(page.getByRole('listbox').element()).toBeInTheDocument();
        expect(options).toHaveLength(2);
        const textbox = page.getByRole('textbox', { name: zh_CN.JsonViewer.content }).element();
        expect(textbox).toHaveAttribute('aria-activedescendant', options[0].id);
        await userEvent.keyboard('{ArrowDown}');
        expect(textbox).toHaveAttribute('aria-activedescendant', options[1].id);
    });

    it('ShadowRoot 内搜索栏的选项开关触发搜索后，焦点仍在该开关上', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(<JsonViewer value={baseStr} height={400} options={{ lineHeight: 20, autoWrap: true, formatOptions: { tabSize: 4 } }} width={700} />, { container: mount });
        try {
            await userEvent.click(shadow.querySelector(`.${prefixCls}-search-bar-trigger`));
            await userEvent.type(shadow.querySelector(`.${prefixCls}-search-bar input`), 'a');
            const wholeWord = shadow.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-icon-whole_word`).closest('button');
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
