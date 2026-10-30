import { createSignal } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/solid';
import ScrollList, { ScrollItem } from '..';

const prefix = `${BASE_CLASS_PREFIX}-scrolllist`;
const list = Array.from({ length: 20 }, (_, index) => ({ value: index }));

function Demo() {
    const [selectedIndex, setSelectedIndex] = createSignal(1);
    return (
        <ScrollList header="hello world">
            <ScrollItem aria-label="1" list={list} mode="normal" selectedIndex={selectedIndex()} onSelect={({ value }) => setSelectedIndex(value)} />
        </ScrollList>
    );
}

// The option the column centres: the one whose box is closest to the middle of its scroll container
function centredText(outer: Element) {
    const middle = outer.getBoundingClientRect().top + outer.getBoundingClientRect().height / 2;
    const options = Array.from(outer.querySelectorAll('li')).filter((li) => li.getAttribute('aria-hidden') !== 'true');
    const nearest = options.reduce(
        (best, li) => {
            const rect = li.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - middle);
            return distance < best.distance ? { li, distance } : best;
        },
        { li: options[0], distance: Infinity }
    );
    return nearest.li.textContent;
}

describe('scrollList', () => {
    it('normal 与 wheel 列不显示滚动条', () => {
        const { container } = render(() => (
            <ScrollList header="hello world">
                <ScrollItem aria-label="normal" list={list} mode="normal" selectedIndex={1} />
                <ScrollItem aria-label="wheel" list={list} mode="wheel" selectedIndex={1} />
            </ScrollList>
        ));
        const scrollers = container.querySelectorAll<HTMLElement>(`.${prefix}-item, .${prefix}-item-wheel .${prefix}-list-outer`);
        expect(scrollers).toHaveLength(2);
        // headless Chromium draws overlay scrollbars that take no width, so the computed property is what can be checked
        for (const scroller of scrollers) {
            expect(getComputedStyle(scroller).scrollbarWidth).toBe('none');
        }
    });

    it('暗色模式下阴影跟随 --semi-shadow-elevated', () => {
        document.body.setAttribute('theme-mode', 'dark');
        onTestFinished(() => document.body.removeAttribute('theme-mode'));
        const { container } = render(() => <Demo />);
        // the dark token has an inset ring, the light literal does not
        expect(getComputedStyle(container.querySelector(`.${prefix}`) as HTMLElement).boxShadow).toContain('inset');
    });

    it('点击后滚动到指定位置', async () => {
        const { container } = render(() => <Demo />);
        const selected = () => container.querySelector(`.${prefix}-item-sel`);
        expect(selected()).toMatchTextContent(/^1$/);

        await userEvent.click(within(screen.getByRole('listbox')).getByText(/^5$/));
        await waitFor(() => expect(selected()).toMatchTextContent(/^5$/));
    });

    it.each([false, true])('wheel 列在 motion=%s 时挂载后，选中项带选中高亮类', async (motion) => {
        const { container } = render(() => (
            <ScrollList header="wheel">
                <ScrollItem aria-label="wheel" list={list} mode="wheel" motion={motion} selectedIndex={5} onSelect={() => {}} />
            </ScrollList>
        ));
        await waitFor(() => {
            const highlighted = container.querySelectorAll(`.${prefix}-item-selected`);
            expect(highlighted.length).toBeGreaterThan(0);
            expect(highlighted[0]).toMatchTextContent(/^5$/);
        });
    });

    it.each([
        ['wheel', false, 'list-outer'],
        ['wheel', true, 'list-outer'],
        ['normal', false, 'item'],
    ])('%s 列（循环：%s）的 listbox 获得键盘焦点时，列周围显示主题焦点环', async (mode, cycled, columnClass) => {
        const { container } = render(() => (
            <ScrollList header="column">
                <ScrollItem cycled={cycled} list={list} mode={mode} selectedIndex={1} onSelect={() => {}} />
            </ScrollList>
        ));
        const listbox = screen.getAllByRole('listbox')[0];
        await tabTo(listbox);
        expectThemeFocusRing(container.querySelector(`.${prefix}-${columnClass}`) as HTMLElement);
    });

    describe('wheel 模式的受控 onSelect', () => {
        // absence checks have no condition to wait on: the scroll that follows a selection settles within ~200ms
        const settle = () => sleep(600);

        function Wheel(props: { cycled: boolean; initial: number; onSelect: (v: number) => void }) {
            const [selectedIndex, setSelectedIndex] = createSignal(props.initial);
            return (
                <ScrollList header="wheel">
                    <ScrollItem
                        aria-label="wheel"
                        cycled={props.cycled}
                        list={list}
                        selectedIndex={selectedIndex()}
                        onSelect={({ value }) => {
                            props.onSelect(value);
                            setSelectedIndex(value);
                        }}
                    />
                </ScrollList>
            );
        }

        it.each([false, true])('挂载时不为初始 selectedIndex 通知 onSelect（循环：%s）', async (cycled) => {
            const onSelect = vi.fn<(v: number) => void>();
            render(() => <Wheel cycled={cycled} initial={5} onSelect={onSelect} />);
            await settle();
            expect(onSelect).not.toHaveBeenCalled();
        });

        it.each([false, true])('方向键选中只通知一次（循环：%s）', async (cycled) => {
            const onSelect = vi.fn<(v: number) => void>();
            render(() => <Wheel cycled={cycled} initial={5} onSelect={onSelect} />);
            // the scroll that positions the column at mount ends before the key is pressed
            await settle();
            await tabTo(screen.getByRole('listbox'));
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            expect(onSelect.mock.calls).toEqual([[6]]);
        });

        it('父组件修改 selectedIndex 不触发 onSelect', async () => {
            const onSelect = vi.fn<(v: number) => void>();
            const [selectedIndex, setSelectedIndex] = createSignal(3);
            render(() => <ScrollItem aria-label="wheel" list={list} selectedIndex={selectedIndex()} onSelect={({ value }) => onSelect(value)} />);
            await settle();
            setSelectedIndex(8);
            await settle();
            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    it.each([false, true])('wheel 列挂载后把选中项滚到选择器处，父组件修改 selectedIndex 后跟随（循环：%s）', async (cycled) => {
        const [selectedIndex, setSelectedIndex] = createSignal(5);
        const { container } = render(() => (
            <ScrollList header="wheel">
                <ScrollItem aria-label="wheel" cycled={cycled} list={list} selectedIndex={selectedIndex()} />
            </ScrollList>
        ));
        const outer = container.querySelector(`.${prefix}-list-outer`) as HTMLElement;
        await waitFor(() => expect(centredText(outer)).toBe('5'));
        setSelectedIndex(12);
        await waitFor(() => expect(centredText(outer)).toBe('12'));
        setSelectedIndex(1);
        await waitFor(() => expect(centredText(outer)).toBe('1'));
    });

    it('循环 wheel 列在两端各渲染副本，副本对辅助技术隐藏', async () => {
        const { container } = render(() => <ScrollItem aria-label="wheel" cycled list={list} selectedIndex={0} />);
        await waitFor(() => expect(container.querySelectorAll('li').length).toBeGreaterThan(list.length));
        expect(screen.getAllByRole('option')).toHaveLength(list.length);
        expect(container.querySelectorAll('li[aria-hidden="true"]').length).toBe(container.querySelectorAll('li').length - list.length);
    });

    it('聚焦列上按 ArrowDown 选中下一个值，并将其滚动到中间', async () => {
        render(() => <Demo />);
        const listbox = screen.getByRole('listbox');
        await tabTo(listbox);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        const active = () => document.getElementById(listbox.getAttribute('aria-activedescendant') as string);
        await waitFor(() => expect(active()).toMatchTextContent(/^3$/));
        expect(listbox).toHaveFocus();
    });
});
