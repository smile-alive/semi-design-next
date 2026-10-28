import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { ScrollList, ScrollItem } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/react';

const list = Array.from({ length: 20 }, (_, index) => ({ value: index }));

function Demo() {
    const [selectedIndex, setSelectedIndex] = useState(1);
    return (
        <ScrollList header="hello world">
            <ScrollItem aria-label="1" list={list} mode="normal" selectedIndex={selectedIndex} onSelect={({ value }) => setSelectedIndex(value)} />
        </ScrollList>
    );
}

describe('scrollList', () => {
    it('暗色模式下阴影跟随 --semi-shadow-elevated', () => {
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        const { container } = render(<Demo />);
        // the dark token has an inset ring, the light literal does not
        expect(getComputedStyle(container.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist`)).boxShadow).toContain('inset');
    });

    it('normal 与 wheel 列不显示滚动条', () => {
        const { container } = render(
            <ScrollList header="hello world">
                <ScrollItem aria-label="normal" list={list} mode="normal" selectedIndex={1} />
                <ScrollItem aria-label="wheel" list={list} mode="wheel" selectedIndex={1} />
            </ScrollList>
        );
        const scrollers = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item, .${BASE_CLASS_PREFIX}-scrolllist-item-wheel .${BASE_CLASS_PREFIX}-scrolllist-list-outer`);
        expect(scrollers).toHaveLength(2);
        // headless Chromium draws overlay scrollbars that take no width, so the computed property is what can be checked
        for (const scroller of scrollers) {
            expect(getComputedStyle(scroller).scrollbarWidth).toBe('none');
        }
    });

    it('点击后滚动到指定位置', async () => {
        const { container } = render(<Demo />);
        const selected = () => container.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`);
        expect(selected()).toMatchTextContent(/^1$/);

        await userEvent.click(within(screen.getByRole('listbox')).getByText(/^5$/));
        await waitFor(() => expect(selected()).toMatchTextContent(/^5$/));
    });

    it.each([false, true])('wheel 列在 motion=%s 时挂载后，选中项带选中高亮类', async (motion) => {
        const { container } = render(
            <ScrollList header="wheel">
                <ScrollItem aria-label="wheel" list={list} mode="wheel" motion={motion} selectedIndex={5} onSelect={() => {}} />
            </ScrollList>
        );
        await waitFor(() => {
            const highlighted = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-selected`);
            expect(highlighted.length).toBeGreaterThan(0);
            expect(highlighted[0]).toMatchTextContent(/^5$/);
        });
    });

    it.each([
        ['wheel', false, 'list-outer'],
        ['wheel', true, 'list-outer'],
        ['normal', false, 'item'],
    ])('%s 列（循环：%s）的 listbox 获得键盘焦点时，列周围显示主题焦点环', async (mode, cycled, columnClass) => {
        const { container } = render(
            <ScrollList header="column">
                <ScrollItem cycled={cycled} list={list} mode={mode} selectedIndex={1} onSelect={() => {}} />
            </ScrollList>
        );
        const listbox = screen.getAllByRole('listbox')[0];
        await tabTo(listbox);
        expectThemeFocusRing(container.querySelector(`.${BASE_CLASS_PREFIX}-scrolllist-${columnClass}`));
    });

    describe('wheel 模式的受控 onSelect', () => {
        const wheelList = Array.from({ length: 20 }, (_, index) => ({ value: index }));
        // absence checks have no condition to wait on: the scroll that follows a selection settles within ~200ms
        const settle = () => sleep(600);

        function Wheel({ cycled, initial, onSelect }: { cycled: boolean; initial: number; onSelect: (v: number) => void }) {
            const [selectedIndex, setSelectedIndex] = useState(initial);
            return (
                <ScrollList header="wheel">
                    <ScrollItem
                        aria-label="wheel"
                        cycled={cycled}
                        list={wheelList}
                        selectedIndex={selectedIndex}
                        onSelect={({ value }) => {
                            onSelect(value);
                            setSelectedIndex(value);
                        }}
                    />
                </ScrollList>
            );
        }

        it.each([false, true])('挂载时不为初始 selectedIndex 通知 onSelect（循环：%s）', async (cycled) => {
            const onSelect = vi.fn<(v: number) => void>();
            render(<Wheel cycled={cycled} initial={5} onSelect={onSelect} />);
            await settle();
            expect(onSelect).not.toHaveBeenCalled();
        });

        it.each([false, true])('方向键选中只通知一次（循环：%s）', async (cycled) => {
            const onSelect = vi.fn<(v: number) => void>();
            render(<Wheel cycled={cycled} initial={5} onSelect={onSelect} />);
            // the scroll that positions the column at mount ends before the key is pressed
            await settle();
            await tabTo(screen.getByRole('listbox'));
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            expect(onSelect.mock.calls).toEqual([[6]]);
        });

        it('父组件修改 selectedIndex 不触发 onSelect', async () => {
            const onSelect = vi.fn<(v: number) => void>();
            const { rerender } = render(<ScrollItem aria-label="wheel" list={wheelList} selectedIndex={3} onSelect={({ value }) => onSelect(value)} />);
            await settle();
            rerender(<ScrollItem aria-label="wheel" list={wheelList} selectedIndex={8} onSelect={({ value }) => onSelect(value)} />);
            await settle();
            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    it('聚焦列上按 ArrowDown 选中下一个值，并将其滚动到中间', async () => {
        render(<Demo />);
        const listbox = screen.getByRole('listbox');
        await tabTo(listbox);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        const active = () => document.getElementById(listbox.getAttribute('aria-activedescendant'));
        await waitFor(() => expect(active()).toMatchTextContent(/^3$/));
        expect(listbox).toHaveFocus();
    });
});
