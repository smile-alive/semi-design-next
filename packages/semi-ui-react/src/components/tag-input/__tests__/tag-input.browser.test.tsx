import { createRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Button, Popover, TagInput, type TagInputHandle } from '@fibrae/semi-ui-react';
import { dragTo, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';

const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
const getHandles = () => document.querySelectorAll(`.${tagInputCls}-drag-handler`);

describe('TagInput（浏览器）', () => {
    it('修复 #1149：被拖拽的标签绘制在所在 Popover 之上', async () => {
        render(
            <Popover
                aria-label="Details"
                content={
                    <div style={{ padding: 20, width: 300 }}>
                        <TagInput defaultValue={['抖音', '火山', '西瓜视频']} draggable />
                    </div>
                }
                position="bottomLeft"
                trigger="click"
            >
                <Button>TagInput In Popover</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'TagInput In Popover' }));
        // Tooltip first renders the popup offscreen to measure it, then moves it next to the trigger
        await waitFor(() => expect(screen.getByRole('textbox').getBoundingClientRect().top).toBeGreaterThan(0));
        await userEvent.click(screen.getByRole('textbox'));
        await waitFor(() => expect(getHandles()).toHaveLength(3));

        // the keyboard pick-up holds the drag open, so the overlay can be inspected mid-drag
        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0].focus();
        await userEvent.keyboard(' ');

        const overlay = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(`.${tagInputCls}-drag-item-move`);
            expect(node).toHaveTextContent('抖音');
            return node;
        });
        // The overlay sits over the Popover content, which is in the top layer, so it is hit-testable only from above it;
        // dnd-kit makes the overlay click-through, and an inline important declaration outranks its stylesheet
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        const rect = overlay.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(overlay.contains(hit)).toBe(true);
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('拖动标签排序后触发 onChange', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        render(<TagInput defaultValue={['abc', 'def', 'ghi']} draggable onChange={onChange} />);
        await userEvent.click(screen.getByRole('textbox'));
        await waitFor(() => expect(getHandles()).toHaveLength(3));

        await dragTo(getHandles()[0], screen.getByText('ghi'));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['def', 'ghi', 'abc']));
        expect([...document.querySelectorAll(`.${tagInputCls}-sortable-item`)].map((tag) => tag.textContent)).toEqual(['def', 'ghi', 'abc']);
    });

    it('重复标签拖到末尾后，被拖动的项保留自己的节点', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        render(<TagInput defaultValue={['a', 'b', 'a']} draggable onChange={onChange} />);
        await userEvent.click(screen.getByRole('textbox'));
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        const sortableItems = () => document.querySelectorAll(`.${tagInputCls}-sortable-item`);
        const dragged = sortableItems()[0];
        await dragTo(getHandles()[0], screen.getAllByText('a')[1]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['b', 'a', 'a']));
        expect(sortableItems()[2]).toBe(dragged);
    });

    it('键盘拾取句柄后 dnd-kit 使其失焦，TagInput 仍保持激活，拖拽可继续并放下', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        const onBlur = vi.fn<(event: unknown) => void>();
        render(<TagInput defaultValue={['abc', 'def', 'ghi']} draggable onBlur={onBlur} onChange={onChange} />);
        await userEvent.click(screen.getByRole('textbox'));
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        screen.getAllByRole('button', { name: zh_CN.TagInput.dragSort })[0].focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(document.querySelector(`.${tagInputCls}-drag-item-move`)).not.toBeNull());
        await userEvent.keyboard('{ArrowRight}');
        expect(document.querySelector(`.${tagInputCls}-drag-item-move`)).not.toBeNull();
        expect(getHandles()).toHaveLength(4);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['def', 'abc', 'ghi']));
    });

    it('受控 value 下父组件不接受排序时，标签顺序回到原序', async () => {
        const onChange = vi.fn<(value: string[]) => void>();
        render(<TagInput value={['abc', 'def', 'ghi']} draggable onChange={onChange} />);
        await userEvent.click(screen.getByRole('textbox'));
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
    it('带 renderTagItem 的 tagInput', async () => {
        function Demo() {
            const [value, setValue] = useState([{ name: 'semi', email: 'semi@byte.com' }]);
            return (
                <TagInput
                    // TagInput types its value as string[]; object values are passed through to renderTagItem as-is
                    value={value as unknown as string[]}
                    renderTagItem={(node, index, onClose) => (
                        <div key={index}>
                            <span>{(node as unknown as (typeof value)[number]).email}</span>
                            <button type="button" onClick={onClose}>
                                remove
                            </button>
                        </div>
                    )}
                    onChange={(next) =>
                        setValue(
                            (next as unknown as Array<string & { name?: string }>).map((v) => ({
                                name: v.name || v,
                                email: `${v.name || v}@byte.com`,
                            }))
                        )
                    }
                />
            );
        }
        render(<Demo />);
        expect(screen.getByText('semi@byte.com')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'remove' }));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'remove' })).toBeNull());
        expect(screen.queryByText('semi@byte.com')).toBeNull();
    });

    it('expandRestTagsOnClick 为 false 时 +N 指示器可聚焦并显示主题焦点环', async () => {
        const { container } = render(<TagInput defaultValue={['抖音', '火山', '西瓜视频']} expandRestTagsOnClick={false} maxTagCount={1} />);
        const plusN = container.querySelector(`.${tagInputCls}-wrapper-n`);
        await tabTo(plusN);
        expectThemeFocusRing(plusN);
    });

    it('清空按钮在悬停或焦点在内部时显示，无值时仍保留空间', async () => {
        render(
            <>
                <TagInput style={{ width: 300 }} defaultValue={['abc']} showClear />
                <Button>after</Button>
            </>
        );
        const clear = () => document.querySelector(`.${tagInputCls}-clearBtn`);
        expect(clear()).not.toBeVisible();
        await userEvent.hover(screen.getByRole('textbox'));
        expect(clear()).toBeVisible();
        await userEvent.unhover(screen.getByRole('textbox'));
        expect(clear()).not.toBeVisible();

        await tabTo(screen.getByRole('textbox'));
        const button = screen.getByRole('button', { name: '清空标签输入' });
        expect(button).toBeVisible();
        await tab();
        expect(button).toHaveFocus();
        expectThemeFocusRing(button);
        const { width } = button.getBoundingClientRect();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(clear()).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(document.querySelector(`.${tagInputCls}-clearBtn-placeholder`).getBoundingClientRect().width).toBe(width);
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
        render(
            <>
                <TagInput style={noTransition} defaultValue={['abc']} />
                <Button>after</Button>
                <TagInput style={noTransition} defaultValue={['abc']} disabled />
            </>
        );
        const [root, disabledRoot] = document.querySelectorAll(`.${tagInputCls}`);
        const idle = look(root);
        expect(idle.backgroundColor).not.toBe(hoverBg);
        await userEvent.hover(root);
        expect(look(root).backgroundColor).toBe(hoverBg);
        await userEvent.unhover(root);
        expect(look(root)).toEqual(idle);

        await tabTo(root.querySelector('input'));
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
    const getField = () => document.querySelector(`.${tagInputCls}-wrapper-input`);
    const getTag = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tag`);
    const rowEnd = () => {
        const row = document.querySelector(`.${tagInputCls}-wrapper`);
        const style = getComputedStyle(row);
        return row.getBoundingClientRect().right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
    };
    const expectNoHorizontalScroll = () => {
        const input = screen.getByRole<HTMLInputElement>('textbox');
        expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
    };

    it('空输入框与标签同行，占满剩余宽度', () => {
        render(<TagInput style={{ width: 300 }} defaultValue={['abc']} />);
        const field = getField().getBoundingClientRect();
        expect(field.left).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().right);
        expect(Math.abs(field.right - rowEnd())).toBeLessThanOrEqual(1);
    });

    it('文字超出本行剩余宽度时输入框整体换到下一行，不在原行内横向滚动', async () => {
        render(<TagInput style={{ width: 300 }} defaultValue={['a long tag value here']} />);
        const input = screen.getByRole('textbox');
        expect(getField().getBoundingClientRect().top).toBeLessThan(getTag().getBoundingClientRect().bottom);
        await userEvent.type(input, 'semidesign'.repeat(3));
        expect(getField().getBoundingClientRect().top).toBeGreaterThanOrEqual(getTag().getBoundingClientRect().bottom);
        expect(Math.abs(getField().getBoundingClientRect().right - rowEnd())).toBeLessThanOrEqual(1);
        expectNoHorizontalScroll();
    });

    it('size 变大后输入框按新字号容纳已输入的文字', async () => {
        const { rerender } = render(<TagInput style={{ width: 300 }} defaultValue={['abc']} size="small" />);
        await userEvent.type(screen.getByRole('textbox'), 'semi design');
        expectNoHorizontalScroll();
        const smallHeight = getField().getBoundingClientRect().height;
        rerender(<TagInput style={{ width: 300 }} defaultValue={['abc']} size="large" />);
        expect(getField().getBoundingClientRect().height).toBeGreaterThan(smallHeight);
        expect(screen.getByRole('textbox')).toHaveValue('semi design');
        expectNoHorizontalScroll();
    });
});

describe('TagInput 激活状态跟随键盘焦点', () => {
    const renderWithAfter = (props?: object) =>
        render(
            <>
                <Button>before</Button>
                <TagInput defaultValue={['抖音', '火山', '西瓜视频']} {...props} />
                <Button>after</Button>
            </>
        );
    const getRoot = () => document.querySelector(`.${tagInputCls}`);
    const getRest = () => document.querySelector(`.${tagInputCls}-wrapper-n`);

    it('Tab 进入后根元素带 -focus 类，Tab 离开后移除', async () => {
        renderWithAfter();
        await tabTo(screen.getByRole('textbox'));
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('draggable 时 Tab 落在标签上，句柄出现后焦点仍在该标签上，TagInput 保持激活', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        renderWithAfter({ draggable: true, onBlur });
        const firstTag = () => screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', '抖音') });
        screen.getByRole('button', { name: 'before' }).focus();
        await tab();
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        expect(firstTag()).toHaveFocus();
        expect(firstTag().parentElement).toHaveClass(`${tagInputCls}-drag-item`);
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        expect(onBlur).not.toHaveBeenCalled();
        await tab();
        expect(document.activeElement.contains(getHandles()[1])).toBe(true);
    });

    it('draggable 时 Tab 进入后出现拖拽句柄并可聚焦，Tab 离开后消失', async () => {
        renderWithAfter({ draggable: true });
        await tabTo(screen.getByRole('textbox'));
        await waitFor(() => expect(getHandles()).toHaveLength(3));
        await tab({ shift: true });
        expect(document.activeElement).toHaveAttribute('role', 'button');
        await tab({ shift: true });
        expect(document.activeElement.contains(getHandles()[2])).toBe(true);
        expect(document.activeElement.closest('[role="button"]')).toBeNull();
        await tab();
        await tab();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getHandles()).toHaveLength(0);
    });

    it('maxTagCount 的 +N 在 Tab 进入时展开，点击后 Tab 离开时恢复折叠', async () => {
        renderWithAfter({ maxTagCount: 1 });
        expect(getRest()).not.toBeNull();
        await tabTo(screen.getByRole('textbox'));
        expect(getRest()).toBeNull();
        await tab();
        expect(getRest()).not.toBeNull();

        await userEvent.click(screen.getByRole('textbox'));
        expect(getRest()).toBeNull();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(getRest()).not.toBeNull();
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });
});

describe('TagInput 输入框与其清空按钮之间的焦点移动保持在内部', () => {
    const renderWithSpies = (props?: object) => {
        const spies = {
            onFocus: vi.fn<() => void>(),
            onBlur: vi.fn<() => void>(),
            onChange: vi.fn<(value: string[]) => void>(),
        };
        const result = render(
            <>
                <TagInput defaultValue={['abc']} addOnBlur showClear {...spies} {...props} />
                <Button>after</Button>
            </>
        );
        return { ...spies, ...result };
    };
    const getClear = () => screen.getByRole('button', { name: '清空标签输入' });
    const getRoot = () => document.querySelector(`.${tagInputCls}`);
    const typeAndTabToClear = async () => {
        await tabTo(screen.getByRole('textbox'));
        await userEvent.keyboard('new');
        await tab();
        expect(getClear()).toHaveFocus();
    };

    it('Tab 到清空按钮再回来不触发 onBlur 和第二次 onFocus，也不添加标签', async () => {
        const { onFocus, onBlur, onChange } = renderWithSpies();
        await typeAndTabToClear();
        expect(getRoot()).toHaveClass(`${tagInputCls}-focus`);
        await tab({ shift: true });
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(screen.getByRole('textbox')).toHaveValue('new');
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('从清空按钮 Tab 离开 TagInput 时添加已输入的文本，并只触发一次 onBlur', async () => {
        const { onBlur, onChange } = renderWithSpies();
        await typeAndTabToClear();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith(['abc', 'new']);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('从输入框 Tab 离开 TagInput 时仍触发 onBlur', async () => {
        const { onBlur } = renderWithSpies({ showClear: false });
        await tabTo(screen.getByRole('textbox'));
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('获得焦点的标签被移除时，焦点交给输入框，且不触发 onBlur', async () => {
        const { onFocus, onBlur, onChange } = renderWithSpies({ addOnBlur: false });
        await tabTo(screen.getByRole('textbox'));
        await tab({ shift: true });
        expect(document.activeElement).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('用键盘清空时不触发 blur，也不触发第二次 focus', async () => {
        const { onFocus, onBlur, onChange } = renderWithSpies();
        await typeAndTabToClear();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空标签输入' })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith([]);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('清空按钮获得焦点时，受控值在别处被清空，焦点交给输入框', async () => {
        const { rerender, onBlur } = renderWithSpies({ value: ['abc'], defaultValue: undefined, addOnBlur: false });
        await tabTo(screen.getByRole('textbox'));
        await tab();
        expect(getClear()).toHaveFocus();
        rerender(
            <>
                <TagInput value={[]} showClear onBlur={onBlur} />
                <Button>after</Button>
            </>
        );
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空标签输入' })).toBeNull());
        expect(screen.getByRole('textbox')).toHaveFocus();
        await tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getRoot()).not.toHaveClass(`${tagInputCls}-focus`);
    });

    it('ShadowRoot 内受控值被清空、聚焦的清空按钮随之移除时，焦点回到输入框', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        const view = render(<TagInput value={['abc']} showClear />, { container });
        const input = shadow.querySelector('input');
        input.focus();
        await tab();
        expect(shadow.activeElement).toBe(shadow.querySelector(`.${tagInputCls}-clearBtn`));
        view.rerender(<TagInput value={[]} showClear />);
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
        const ref = createRef<TagInputHandle>();
        render(<TagInput ref={ref} defaultValue={['abc']} />, { container });
        shadow.querySelector('input').focus();
        ref.current.blur();
        expect(shadow.activeElement).toBeNull();
    });
});
