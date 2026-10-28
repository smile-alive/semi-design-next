/** @jsxImportSource vue */
import { nextTick, shallowRef } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { dragTo, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import TagInput, { type TagInputHandle, type TagInputTagSlotProps } from '..';
import Button from '../../button';
import Popover from '../../popover';

const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
const getHandles = () => document.querySelectorAll(`.${tagInputCls}-drag-handler`);
const getRoot = () => document.querySelector(`.${tagInputCls}`) as HTMLElement;
const getInput = () => screen.getByRole<HTMLInputElement>('textbox');
const afterButton = () => <Button>{() => 'after'}</Button>;

describe('TagInput（浏览器）', () => {
    it('修复 #1149：被拖拽的标签绘制在所在 Popover 之上', async () => {
        render(Popover, {
            props: { position: 'bottomLeft', trigger: 'click' },
            slots: {
                default: () => <Button>{() => 'TagInput In Popover'}</Button>,
                content: () => (
                    <div style={{ padding: '20px', width: '300px' }}>
                        <TagInput defaultValue={['抖音', '火山', '西瓜视频']} draggable />
                    </div>
                ),
            },
        });
        await userEvent.click(screen.getByRole('button', { name: 'TagInput In Popover' }));
        await waitFor(() => expect(getInput().getBoundingClientRect().top).toBeGreaterThan(0));
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));

        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0].focus();
        await userEvent.keyboard(' ');

        const overlay = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(`.${tagInputCls}-drag-item-move`);
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

    it('拖动标签排序后触发 change', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        render(TagInput, { props: { defaultValue: ['abc', 'def', 'ghi'], draggable: true, onChange } });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));

        await dragTo(getHandles()[0], screen.getByText('ghi'));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['def', 'ghi', 'abc']));
        expect([...document.querySelectorAll(`.${tagInputCls}-sortable-item`)].map((tag) => tag.textContent)).toEqual(['def', 'ghi', 'abc']);
    });

    it('键盘拖动重复标签时只移动被拾取的那一个', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        render(TagInput, { props: { defaultValue: ['a', 'b', 'a'], draggable: true, onChange } });
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
        render(TagInput, { props: { defaultValue: ['a', 'b', 'a'], draggable: true, onChange } });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        const sortableItems = () => document.querySelectorAll(`.${tagInputCls}-sortable-item`);
        const dragged = sortableItems()[0];
        await dragTo(getHandles()[0], screen.getAllByText('a')[1]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['b', 'a', 'a']));
        expect(sortableItems()[2]).toBe(dragged);
    });

    it('受控 modelValue 下父组件不接受排序时，标签顺序回到原序', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        render(TagInput, { props: { modelValue: ['abc', 'def', 'ghi'], draggable: true, onChange } });
        await userEvent.click(getInput());
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowRight}');
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['def', 'abc', 'ghi']));
        await waitFor(() => expect([...document.querySelectorAll(`.${tagInputCls}-sortable-item`)].map((tag) => tag.textContent)).toEqual(['abc', 'def', 'ghi']));
    });
});

describe('tag', () => {
    it('#tag 插槽的 onClose 移除对应标签', async () => {
        render(TagInput, {
            props: { defaultValue: ['semi'] },
            slots: {
                tag: ({ value, onClose }: TagInputTagSlotProps) => (
                    <div>
                        <span>{`${value}@byte.com`}</span>
                        <button type="button" onClick={onClose}>
                            remove
                        </button>
                    </div>
                ),
            },
        });
        expect(screen.getByText('semi@byte.com')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'remove' }));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'remove' })).toBeNull());
        expect(screen.queryByText('semi@byte.com')).toBeNull();
    });

    it('expandRestTagsOnClick 为 false 时 +N 指示器可聚焦并显示主题焦点环', async () => {
        const { container } = render(TagInput, {
            props: { defaultValue: ['抖音', '火山', '西瓜视频'], expandRestTagsOnClick: false, maxTagCount: 1 },
        });
        const plusN = container.querySelector(`.${tagInputCls}-wrapper-n`) as Element;
        await tabTo(plusN);
        expectThemeFocusRing(plusN);
    });

    it('清空按钮在悬停或焦点在内部时显示，无值时仍保留空间', async () => {
        render(() => [<TagInput style={{ width: '300px' }} defaultValue={['abc']} showClear />, afterButton()]);
        const clear = () => document.querySelector(`.${tagInputCls}-clearBtn`);
        expect(clear()).not.toBeVisible();
        await userEvent.hover(getInput());
        expect(clear()).toBeVisible();
        await userEvent.unhover(getInput());
        expect(clear()).not.toBeVisible();

        await tabTo(getInput());
        const button = screen.getByRole('button', { name: zh_CN.TagInput.clear });
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

    it('悬停时换悬停背景；聚焦或禁用时悬停不改变样式', async () => {
        // the background transition would leave getComputedStyle mid-way
        const noTransition = { transition: 'none' };
        const probe = document.createElement('div');
        document.body.append(probe);
        probe.style.backgroundColor = 'var(--semi-color-fill-1)';
        const hoverBg = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const look = (el: Element) => {
            const { backgroundColor, borderColor } = getComputedStyle(el);
            return { backgroundColor, borderColor };
        };
        render(() => [<TagInput style={noTransition} defaultValue={['abc']} />, afterButton(), <TagInput style={noTransition} defaultValue={['abc']} disabled />]);
        const [root, disabledRoot] = document.querySelectorAll(`.${tagInputCls}`);
        const idle = look(root);
        expect(idle.backgroundColor).not.toBe(hoverBg);
        await userEvent.hover(root);
        expect(look(root).backgroundColor).toBe(hoverBg);
        await userEvent.unhover(root);
        expect(look(root)).toEqual(idle);

        await tabTo(root.querySelector('input') as Element);
        const focused = look(root);
        await userEvent.hover(root);
        expect(look(root)).toEqual(focused);
        await userEvent.unhover(root);

        const disabled = look(disabledRoot);
        await userEvent.hover(disabledRoot);
        expect(look(disabledRoot)).toEqual(disabled);
    });
});

describe('TagInput 输入框宽度跟随文字', () => {
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
        render(TagInput, { props: { defaultValue: ['abc'] }, attrs: { style: { width: '300px' } } });
        const field = getField().getBoundingClientRect();
        expect(field.left).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().right);
        expect(Math.abs(field.right - rowEnd())).toBeLessThanOrEqual(1);
    });

    it('文字超出本行剩余宽度时输入框整体换到下一行，不在原行内横向滚动', async () => {
        render(TagInput, { props: { defaultValue: ['a long tag value here'] }, attrs: { style: { width: '300px' } } });
        expect(getField().getBoundingClientRect().top).toBeLessThan(getTag().getBoundingClientRect().bottom);
        await userEvent.type(getInput(), 'semidesign'.repeat(3));
        expect(getField().getBoundingClientRect().top).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().bottom);
        expect(Math.abs(getField().getBoundingClientRect().right - rowEnd())).toBeLessThanOrEqual(1);
        expectNoHorizontalScroll();
    });

    it('size 变大后输入框按新字号容纳已输入的文字', async () => {
        const view = render(TagInput, {
            props: { defaultValue: ['abc'], size: 'small' },
            attrs: { style: { width: '300px' } },
        });
        await userEvent.type(getInput(), 'semi design');
        expectNoHorizontalScroll();
        const smallHeight = getField().getBoundingClientRect().height;
        await view.rerender({ defaultValue: ['abc'], size: 'large' });
        expect(getField().getBoundingClientRect().height).toBeGreaterThan(smallHeight);
        expect(getInput()).toHaveValue('semi design');
        expectNoHorizontalScroll();
    });
});

describe('TagInput 激活状态跟随键盘焦点', () => {
    const renderWithAfter = (props: Record<string, unknown> = {}) => render(() => [<Button>{() => 'before'}</Button>, <TagInput defaultValue={['抖音', '火山', '西瓜视频']} {...props} />, afterButton()]);
    const getRest = () => document.querySelector(`.${tagInputCls}-wrapper-n`);

    it('Tab 进入后根元素带 -focus 类，Tab 离开后移除', async () => {
        renderWithAfter();
        await tabTo(getInput());
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('draggable 时 Tab 落在标签上，句柄出现后焦点仍在该标签上，TagInput 保持激活', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        renderWithAfter({ draggable: true, onBlur });
        const firstTag = () => screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', '抖音') });
        screen.getByRole<HTMLButtonElement>('button', { name: 'before' }).focus();
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
        renderWithAfter({ draggable: true });
        screen.getByRole<HTMLButtonElement>('button', { name: 'after' }).focus();
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
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getHandles()).toHaveLength(0);
    });

    it('maxTagCount 的 +N 在 Tab 进入时展开，点击后 Tab 离开时恢复折叠', async () => {
        renderWithAfter({ maxTagCount: 1 });
        expect(getRest()).not.toBeNull();
        await tabTo(getInput());
        expect(getRest()).toBeNull();
        await tab();
        expect(getRest()).not.toBeNull();

        await userEvent.click(getInput());
        expect(getRest()).toBeNull();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getRest()).not.toBeNull();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });
});

describe('TagInput 输入框与其清空按钮之间的焦点移动保持在内部', () => {
    const renderWithSpies = (props: Record<string, unknown> = {}) => {
        const spies = {
            onFocus: vi.fn<(event: FocusEvent) => void>(),
            onBlur: vi.fn<(event: FocusEvent) => void>(),
            onChange: vi.fn<(value: string[]) => void>(),
        };
        const result = render(() => [<TagInput defaultValue={['abc']} addOnBlur showClear {...spies} {...props} />, afterButton()]);
        return { ...spies, ...result };
    };
    const getClear = () => screen.getByRole('button', { name: zh_CN.TagInput.clear });
    const typeAndTabToClear = async () => {
        await tabTo(getInput());
        await userEvent.keyboard('new');
        await tab();
        expect(getClear()).toHaveFocus();
    };

    it('Tab 到清空按钮再回来不触发 blur 和第二次 focus，也不添加标签', async () => {
        const { onFocus, onBlur, onChange } = renderWithSpies();
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
        const { onBlur, onChange } = renderWithSpies();
        await typeAndTabToClear();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith(['abc', 'new']);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('从输入框 Tab 离开 TagInput 时仍触发 blur', async () => {
        const { onBlur } = renderWithSpies({ showClear: false });
        await tabTo(getInput());
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('获得焦点的标签被移除时，焦点交给输入框，且不触发 blur', async () => {
        const { onFocus, onBlur, onChange } = renderWithSpies({ addOnBlur: false });
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
        const { onFocus, onBlur, onChange } = renderWithSpies();
        await typeAndTabToClear();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull());
        expect(getInput()).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith([]);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清空按钮获得焦点时，受控值在别处被清空，焦点交给输入框', async () => {
        const value = shallowRef<string[]>(['abc']);
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(() => (
            <>
                <TagInput modelValue={value.value} showClear onBlur={onBlur} />
                {afterButton()}
            </>
        ));
        await tabTo(getInput());
        await tab();
        expect(getClear()).toHaveFocus();
        value.value = [];
        await nextTick();
        await waitFor(() => expect(screen.queryByRole('button', { name: zh_CN.TagInput.clear })).toBeNull());
        expect(getInput()).toHaveFocus();
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('ref 的 blur 在焦点位于清空按钮时同样移出焦点并触发一次 blur', async () => {
        const refFn = vi.fn<(handle: unknown) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(() => <TagInput defaultValue={['abc']} showClear onBlur={onBlur} ref={refFn} />);
        await tabTo(getInput());
        await tab();
        expect(getClear()).toHaveFocus();
        (refFn.mock.calls[0][0] as TagInputHandle).blur();
        await waitFor(() => expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`));
        expect(document.querySelector(`.${tagInputCls}-clearBtn`)).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('ShadowRoot 内受控值被清空、聚焦的清空按钮随之移除时，焦点回到输入框', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const view = render(TagInput, { props: { modelValue: ['abc'], showClear: true }, container });
        const input = shadow.querySelector('input') as HTMLInputElement;
        input.focus();
        await tab();
        expect(shadow.activeElement).toBe(shadow.querySelector(`.${tagInputCls}-clearBtn`));
        await view.rerender({ modelValue: [] });
        await waitFor(() => expect(shadow.querySelector(`.${tagInputCls}-clearBtn`)).toBeNull());
        expect(shadow.activeElement).toBe(input);
    });

    it('ShadowRoot 内 ref 的 blur 移出输入框的焦点', () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const refFn = vi.fn<(handle: unknown) => void>();
        render(() => <TagInput defaultValue={['abc']} ref={refFn} />, { container });
        shadow.querySelector('input')?.focus();
        (refFn.mock.calls[0][0] as TagInputHandle).blur();
        expect(shadow.activeElement).toBeNull();
    });
});
