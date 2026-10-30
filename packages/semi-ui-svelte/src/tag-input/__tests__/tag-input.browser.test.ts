import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { disableFieldSizing, dragTo, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { TagInputProps } from '../interface';
import TagInputBrowser from './tag-input-browser.svelte';
import TagInputCase from './tag-input-case.svelte';

type Browser = Parameters<typeof TagInputBrowser>[1]['store'];
type Case = NonNullable<Parameters<typeof TagInputCase>[1]>['store'];

const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
const getHandles = () => document.querySelectorAll(`.${tagInputCls}-drag-handler`);
const getRoot = () => document.querySelector(`.${tagInputCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('textbox');
const getRest = () => document.querySelector(`.${tagInputCls}-wrapper-n`);
const getClear = () => screen.getByRole('button', { name: zh_CN.TagInput.clear });
const getButton = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name });
const sortableTexts = () => [...document.querySelectorAll(`.${tagInputCls}-sortable-item`)].map((tag) => tag.textContent?.trim());

function mountBrowser(kind: Browser['kind'], initial: Partial<Browser> = {}) {
    const store = createStore<Browser>({ kind, value: ['abc', 'def', 'ghi'], accept: true, changes: [], props: {}, ...initial });
    render(TagInputBrowser, { props: { store } });
    return store;
}

function mountCase(props: TagInputProps, extra: Partial<Case> = {}) {
    const store = createStore<Case>({ props, slots: {}, handle: {}, ...extra });
    render(TagInputCase, { props: { store } });
    return store;
}

describe('Svelte TagInput（浏览器）拖拽排序', () => {
    it('修复 #1149：被拖拽的标签绘制在所在 Popover 之上', async () => {
        mountBrowser('popover');
        await userEvent.click(getButton('TagInput In Popover'));
        await waitFor(() => expect(getInput().getBoundingClientRect().top).toBeGreaterThan(0));
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));

        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0].focus();
        await userEvent.keyboard(' ');

        const overlay = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(`.${tagInputCls}-drag-item-move`);
            expect(node).toHaveAttribute('data-dnd-dragging', 'true');
            expect(node).toHaveTextContent('抖音');
            return node as HTMLElement;
        });
        // The Popover content is in the top layer; dnd-kit makes the overlay click-through with an inline !important
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        const rect = overlay.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(overlay.contains(hit)).toBe(true);
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('拖动标签排序后触发 onChange', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        mountCase({ value: ['abc', 'def', 'ghi'], draggable: true, onChange });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));

        await dragTo(getHandles()[0], screen.getByText('ghi'));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['def', 'ghi', 'abc']));
        expect(sortableTexts()).toEqual(['def', 'ghi', 'abc']);
    });

    it('键盘拖动重复标签时只移动被拾取的那一个', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        mountCase({ value: ['a', 'b', 'a'], draggable: true, onChange });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[2].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowLeft}');
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['a', 'a', 'b']));
    });

    it('重复标签拖到末尾后，被拖动的项保留自己的节点', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        mountCase({ value: ['a', 'b', 'a'], draggable: true, onChange });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        const sortableItems = () => document.querySelectorAll(`.${tagInputCls}-sortable-item`);
        const dragged = sortableItems()[0];
        await dragTo(getHandles()[0], screen.getAllByText('a')[1]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['b', 'a', 'a']));
        expect(sortableItems()[2]).toBe(dragged);
    });

    it('函数绑定的 setter 拒绝排序时，标签顺序回到原序', async () => {
        const store = mountBrowser('reject', { accept: false });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowRight}');
        await userEvent.keyboard(' ');
        await waitFor(() => expect(store.changes).toContainEqual(['def', 'abc', 'ghi']));
        await waitFor(() => expect(sortableTexts()).toEqual(['abc', 'def', 'ghi']));
        expect(store.value).toEqual(['abc', 'def', 'ghi']);
    });

    it('函数绑定的 setter 接受排序时，新顺序写回绑定值', async () => {
        const store = mountBrowser('reject');
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        await dragTo(getHandles()[0], screen.getByText('ghi'));
        await waitFor(() => expect(store.value).toEqual(['def', 'ghi', 'abc']));
        expect(sortableTexts()).toEqual(['def', 'ghi', 'abc']);
    });
});

describe('Svelte TagInput（浏览器）tag 与 +N', () => {
    it('tag snippet 的 onClose 移除对应标签', async () => {
        mountCase({ value: ['semi'] }, { tag: 'button' });
        await userEvent.click(screen.getByRole('button', { name: '0:semi' }));
        await waitFor(() => expect(screen.queryByRole('button', { name: '0:semi' })).toBeNull());
    });

    it('expandRestTagsOnClick 为 false 时 +N 指示器可聚焦并显示主题焦点环', async () => {
        mountCase({ value: ['抖音', '火山', '西瓜视频'], expandRestTagsOnClick: false, maxTagCount: 1 });
        const plusN = getRest() as Element;
        await tabTo(plusN);
        expectThemeFocusRing(plusN);
    });

    it('清空按钮在悬停或焦点在内部时显示，无值时仍保留空间', async () => {
        mountCase({ style: 'width: 300px', value: ['abc'], showClear: true }, { after: true });
        const clear = () => document.querySelector(`.${tagInputCls}-clearBtn`);
        expect(clear()).not.toBeVisible();
        await userEvent.hover(getInput());
        expect(clear()).toBeVisible();
        await userEvent.unhover(getInput());
        expect(clear()).not.toBeVisible();

        await tabTo(getInput());
        const button = getClear();
        expect(button).toBeVisible();
        await tab();
        expect(button).toHaveFocus();
        expectThemeFocusRing(button);
        const { width } = button.getBoundingClientRect();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(clear()).toBeNull());
        expect(getInput()).toHaveFocus();
        const placeholder = document.querySelector(`.${tagInputCls}-clearBtn-placeholder`) as Element;
        expect(placeholder.getBoundingClientRect().width).toBe(width);
    });

    it('Tooltip 的 child snippet 把 tabindex 交给输入框，Tab 一次即可进入', async () => {
        mountBrowser('tooltip');
        expect(getRoot()).not.toHaveAttribute('tabindex');
        await tabTo(getInput());
        expect(getInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
    });
});

describe('Svelte TagInput（浏览器）输入框宽度跟随文字', () => {
    const getField = () => document.querySelector(`.${tagInputCls}-wrapper-input`) as Element;
    const getTag = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tag`) as Element;
    const rowEnd = () => {
        const row = document.querySelector(`.${tagInputCls}-wrapper`) as Element;
        const style = getComputedStyle(row);
        return row.getBoundingClientRect().right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
    };
    const expectNoHorizontalScroll = () => {
        const input = getInput();
        expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
    };

    it('空输入框与标签同行，占满剩余宽度', () => {
        mountCase({ value: ['abc'], style: 'width: 300px' });
        const field = getField().getBoundingClientRect();
        expect(field.left).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().right);
        expect(Math.abs(field.right - rowEnd())).toBeLessThanOrEqual(1);
    });

    it('文字超出本行剩余宽度时输入框整体换到下一行，不在原行内横向滚动', async () => {
        mountCase({ value: ['a long tag value here'], style: 'width: 300px' });
        expect(getField().getBoundingClientRect().top).toBeLessThan(getTag().getBoundingClientRect().bottom);
        await userEvent.type(getInput(), 'semidesign'.repeat(3));
        expect(getField().getBoundingClientRect().top).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().bottom);
        expect(Math.abs(getField().getBoundingClientRect().right - rowEnd())).toBeLessThanOrEqual(1);
        expectNoHorizontalScroll();
    });

    it('size 变大后输入框按新字号容纳已输入的文字', async () => {
        const store = mountCase({ value: ['abc'], size: 'small', style: 'width: 300px' });
        await userEvent.type(getInput(), 'semi design');
        expectNoHorizontalScroll();
        const smallHeight = getField().getBoundingClientRect().height;
        if (store.props) store.props.size = 'large';
        flushSync();
        await waitFor(() => expect(getField().getBoundingClientRect().height).toBeGreaterThan(smallHeight));
        expect(getInput()).toHaveValue('semi design');
        expectNoHorizontalScroll();
    });

    it('不支持 field-sizing 时输入框宽度随内容增长', async () => {
        disableFieldSizing();
        mountCase({ style: 'width: 400px' });
        const input = getInput();
        const widthOf = async (text: string) => {
            await userEvent.fill(input, text);
            return parseFloat(input.style.width);
        };

        const short = await widthOf('ab');
        expect(short).toBeGreaterThan(0);
        expect(await widthOf('abcdefghijklmnop')).toBeGreaterThan(short);
    });

    it('不支持 field-sizing 时文字放不进当前行，输入框换到下一行', async () => {
        disableFieldSizing();
        mountCase({ value: ['tag'], style: 'width: 300px' });
        expect(getInput().getBoundingClientRect().top).toBeLessThan(getTag().getBoundingClientRect().bottom);
        await userEvent.fill(getInput(), 'W'.repeat(40));
        expect(getInput().getBoundingClientRect().top).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().bottom);
    });
});

describe('Svelte TagInput（浏览器）激活状态跟随键盘焦点', () => {
    it('Tab 进入后根元素带 -focus 类，Tab 离开后移除', async () => {
        mountBrowser('focus');
        await tabTo(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await tab();
        expect(getButton('after')).toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('draggable 时 Tab 落在标签上，句柄出现后焦点仍在该标签上，TagInput 保持激活', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        mountBrowser('focus', { props: { draggable: true, onBlur } });
        const firstTag = () => screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', '抖音') });
        getButton('before').focus();
        await tab();
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        expect(firstTag()).toHaveFocus();
        expect(firstTag().parentElement).toHaveClass(`${tagInputCls}-drag-item`);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(onBlur).not.toHaveBeenCalled();
        await tab();
        expect(document.activeElement?.contains(getHandles()[1])).toBe(true);
    });

    it('draggable 时 Tab 进入后出现拖拽句柄并可聚焦，Tab 离开后消失', async () => {
        mountBrowser('focus', { props: { draggable: true } });
        getButton('after').focus();
        await tab({ shift: true });
        expect(getInput()).toHaveFocus();
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        await tab({ shift: true });
        await tab({ shift: true });
        expect(document.activeElement).toHaveAccessibleName(zh_CN.TagInput.dragSort);
        expect(document.activeElement?.contains(getHandles()[2])).toBe(true);
        expectThemeFocusRing(document.activeElement as Element);
        await tab();
        await tab();
        await tab();
        expect(getButton('after')).toHaveFocus();
        await waitFor(() => expect(getHandles()).toHaveLength(0));
    });

    it('maxTagCount 的 +N 在 Tab 进入时展开，点击后 Tab 离开时恢复折叠', async () => {
        mountBrowser('focus', { props: { maxTagCount: 1 } });
        expect(getRest()).not.toBeNull();
        await tabTo(getInput());
        expect(getRest()).toBeNull();
        await tab();
        expect(getRest()).not.toBeNull();

        await userEvent.click(getInput());
        expect(getRest()).toBeNull();
        await tab();
        expect(getButton('after')).toHaveFocus();
        expect(getRest()).not.toBeNull();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });
});

describe('Svelte TagInput（浏览器）输入框与清空按钮之间的焦点移动', () => {
    const mountWithSpies = (props: TagInputProps = {}) => {
        const spies = {
            onFocus: vi.fn<(event: FocusEvent) => void>(),
            onBlur: vi.fn<(event: FocusEvent) => void>(),
            onChange: vi.fn<(value: string[]) => void>(),
        };
        const store = mountCase({ value: ['abc'], addOnBlur: true, showClear: true, ...spies, ...props }, { after: true });
        return { ...spies, store };
    };
    const typeAndTabToClear = async () => {
        await tabTo(getInput());
        await userEvent.keyboard('new');
        await tab();
        expect(getClear()).toHaveFocus();
    };

    it('Tab 到清空按钮再回来不触发 blur 和第二次 focus，也不添加标签', async () => {
        const { onFocus, onBlur, onChange } = mountWithSpies();
        await typeAndTabToClear();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await tab({ shift: true });
        expect(getInput()).toHaveFocus();
        expect(getInput()).toHaveValue('new');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('从清空按钮 Tab 离开 TagInput 时添加已输入的文本，并只触发一次 blur', async () => {
        const { onBlur, onChange } = mountWithSpies();
        await typeAndTabToClear();
        await tab();
        expect(getButton('after')).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith(['abc', 'new']);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('从输入框 Tab 离开 TagInput 时仍触发 blur', async () => {
        const { onBlur } = mountWithSpies({ showClear: false });
        await tabTo(getInput());
        await tab();
        expect(getButton('after')).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('获得焦点的标签被移除时，焦点交给输入框，且不触发 blur', async () => {
        const { onFocus, onBlur, onChange } = mountWithSpies({ addOnBlur: false });
        await tabTo(getInput());
        await tab({ shift: true });
        expect(document.activeElement).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
        expect(getInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('用键盘清空时不触发 blur，也不触发第二次 focus', async () => {
        const { onFocus, onBlur, onChange } = mountWithSpies();
        await typeAndTabToClear();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull());
        expect(getInput()).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith([]);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清空按钮获得焦点时，受控值在别处被清空，焦点交给输入框', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const store = mountCase({ value: ['abc'], showClear: true, onBlur }, { after: true });
        await tabTo(getInput());
        await tab();
        expect(getClear()).toHaveFocus();
        if (store.props) store.props.value = [];
        flushSync();
        await waitFor(() => expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull());
        expect(getInput()).toHaveFocus();
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('实例的 blur 在焦点位于清空按钮时同样移出焦点并触发一次 blur', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const store = mountCase({ value: ['abc'], showClear: true, onBlur });
        await tabTo(getInput());
        await tab();
        expect(getClear()).toHaveFocus();
        store.handle?.current?.blur();
        await waitFor(() => expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`));
        expect(document.querySelector(`.${tagInputCls}-clearBtn`)).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});
