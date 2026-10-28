import React, { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { Item } from '@fibrae/semi-foundation/scroll-list/item-foundation';
import { Button } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { sleep } from '@test/utils/react';
import ScrollList, { type ScrollItemHandle, type ScrollItemProps } from '../index';
import ScrollItem from '../scroll-item';

const DEFAULTS = {
    AMPM_INDEX: 1,
    HOUR_INDEX: 1,
    MINUTE_INDEX: 1,
};

const ampms = [
    {
        value: 'AM',
        transform: () => '上午',
    },
    {
        value: 'PM',
        transform: () => `下午`,
    },
];
const hours = Array.from({ length: 12 }, (_itm, index) => {
    return {
        value: index + 1,
    };
});
const minutes = Array.from({ length: 60 }, (_itm, index) => {
    return {
        value: index,
        disabled: index % 2 === 1 ? true : false,
    };
});

interface DemoProps {
    minuteOnSelect?: (item: Item) => void;
    hourOnSelect?: (item: Item) => void;
    ampmOnSelect?: (item: Item) => void;
    mode?: string;
    motion?: boolean;
    selectedAmpmIndex?: number;
    selectedHourIndex?: number;
    selectedMinuteIndex?: number;
}

class Demo extends React.PureComponent<DemoProps> {
    constructor(props: DemoProps) {
        super(props);
    }

    override render() {
        const { minuteOnSelect, hourOnSelect, ampmOnSelect, mode = 'wheel', motion = true, selectedAmpmIndex = DEFAULTS.AMPM_INDEX, selectedHourIndex = DEFAULTS.HOUR_INDEX, selectedMinuteIndex = DEFAULTS.MINUTE_INDEX } = this.props;

        const commonProps = {
            mode,
            cycled: false,
            motion,
        };

        return (
            <ScrollList
                footer={
                    <Button type="primary" size="small">
                        Ok
                    </Button>
                }
                header="滚动列表"
            >
                <ScrollItem {...commonProps} type={1} list={ampms} selectedIndex={selectedAmpmIndex} onSelect={ampmOnSelect} />
                <ScrollItem {...commonProps} type={2} list={hours} selectedIndex={selectedHourIndex} onSelect={hourOnSelect} />
                <ScrollItem {...commonProps} type={3} list={minutes} selectedIndex={selectedMinuteIndex} onSelect={minuteOnSelect} />
            </ScrollList>
        );
    }
}

const getItemTexts = (list: Element) =>
    within(list as HTMLElement)
        .getAllByRole('option', { hidden: true })
        .map((option) => option.textContent);

describe(`ScrollList`, () => {
    beforeEach(() => {
        // ScrollItem debounces selection and animates scrolling with Date-based timers, which need a running clock
        vi.useRealTimers();
    });

    it(`wheel 模式外观`, async () => {
        const listSelector = `.${BASE_CLASS_PREFIX}-scrolllist-list-outer`;

        const ampmOnSelect = vi.fn<(item: Item) => void>();
        const hourOnSelect = vi.fn<(item: Item) => void>();
        const minuteOnSelect = vi.fn<(item: Item) => void>();

        const props = { minuteOnSelect, hourOnSelect, ampmOnSelect, selectedAmpmIndex: DEFAULTS.AMPM_INDEX };
        const { container, rerender } = render(<Demo {...props} />);

        const all = container.querySelectorAll<HTMLElement>(listSelector);

        expect(all).toHaveLength(3);
        expect(screen.getByText('滚动列表')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ok' })).toBeInTheDocument();

        const [ampmList, hourList, minuteList] = all;

        const minuteItems = within(minuteList).getAllByRole('option');
        const firstDisabledMinuteIndex = minutes.findIndex((minute) => minute.disabled);
        const nextEnabledMinuteIndex = minutes.findIndex((minute, index) => index > 1 && !minute.disabled);

        expect(minuteItems[firstDisabledMinuteIndex]).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(minuteItems[firstDisabledMinuteIndex]);
        // selection is debounced, so give a pending (wrong) select the chance to fire before asserting it did not
        await sleep(100);
        expect(minuteOnSelect).not.toHaveBeenCalled();

        await userEvent.click(minuteItems[nextEnabledMinuteIndex]);
        await waitFor(() => expect(minuteOnSelect).toHaveBeenCalledTimes(1));
        expect(minuteOnSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: nextEnabledMinuteIndex, type: 3, index: nextEnabledMinuteIndex }));

        // scroll minute list: without layout every item is at the selector, so the first enabled item is nearest
        fireEvent.scroll(minuteList);
        await waitFor(() => expect(minuteOnSelect).toHaveBeenCalledTimes(2));
        expect(minuteOnSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 0, index: 0 }));

        // set selected index manually: the selected item shows its transformed text
        expect(getItemTexts(ampmList)).toEqual(['AM', '下午']);
        rerender(<Demo {...props} selectedAmpmIndex={0} />);
        expect(getItemTexts(ampmList)).toEqual(['上午', 'PM']);
        await userEvent.click(within(ampmList).getByText('PM'));
        await waitFor(() => expect(ampmOnSelect).toHaveBeenCalled());
        expect(ampmOnSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'PM', type: 1, index: 1 }));

        fireEvent.scroll(hourList);
        await waitFor(() => expect(hourOnSelect).toHaveBeenCalled());
        expect(hourOnSelect).toHaveBeenLastCalledWith(expect.objectContaining({ value: 1, type: 2, index: 0 }));
    });

    it(`normal 模式外观`, async () => {
        const ampmOnSelect = vi.fn<(item: Item) => void>();
        const minuteOnSelect = vi.fn<(item: Item) => void>();

        const props = {
            minuteOnSelect,
            ampmOnSelect,
            mode: 'normal',
            selectedAmpmIndex: DEFAULTS.AMPM_INDEX,
        };
        const { container, rerender } = render(<Demo {...props} />);

        const all = container.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item`);

        expect(all).toHaveLength(3);
        const ampmList = all[0];
        const minuteList = all[2];

        const nextEnabledMinuteIndex = minutes.findIndex((minute, index) => index > DEFAULTS.MINUTE_INDEX && !minute.disabled);
        const minuteItemDoms = within(minuteList).getAllByRole('option');
        await userEvent.click(minuteItemDoms[nextEnabledMinuteIndex]);
        expect(minuteOnSelect).toHaveBeenCalledTimes(1);
        expect(minuteOnSelect).toHaveBeenCalledWith(expect.objectContaining({ value: nextEnabledMinuteIndex, type: 3, index: nextEnabledMinuteIndex }));

        await userEvent.click(minuteItemDoms[DEFAULTS.MINUTE_INDEX]);
        expect(minuteOnSelect).toHaveBeenCalledTimes(1);

        const selectedCls = `${BASE_CLASS_PREFIX}-scrolllist-item-sel`;
        const getSelectedAmpmIndex = () =>
            within(ampmList)
                .getAllByRole('option')
                .findIndex((el) => el.classList.contains(selectedCls));

        expect(getSelectedAmpmIndex()).toBe(DEFAULTS.AMPM_INDEX);
        rerender(<Demo {...props} selectedAmpmIndex={0} />);
        expect(getSelectedAmpmIndex()).toBe(0);
        expect(getItemTexts(ampmList)).toEqual(['上午', 'PM']);
    });
});

const prefix = `${BASE_CLASS_PREFIX}-scrolllist`;
const numbers = (length: number) => Array.from({ length }, (_, index) => ({ value: index }));

// jsdom has no layout: items sit 36px apart in their list and every other element is 180px tall
const mockItemLayout = () => {
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function () {
        return this.tagName === 'LI' ? Array.prototype.indexOf.call(this.parentNode.children, this) * 36 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
        return this.tagName === 'LI' ? 36 : 180;
    });
};

describe('ScrollList 行为', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('使用 x-semi-prop 名称渲染头部与底部插槽，并渲染主体高度', () => {
        const { container } = render(
            <ScrollList bodyHeight={200} footer="foot" header="title" x-semi-header-alias="panelHeader">
                <span>child</span>
            </ScrollList>
        );
        const root = container.firstElementChild;
        expect(root).toHaveClass(prefix);
        expect(screen.getByText('title')).toHaveAttribute('x-semi-prop', 'panelHeader');
        expect(screen.getByText('title')).toHaveClass(`${prefix}-header-title`);
        expect(screen.getByText('foot')).toHaveAttribute('x-semi-prop', 'footer');
        expect(screen.getByText('foot')).toHaveClass(`${prefix}-footer`);
        expect(container.querySelector(`.${prefix}-line`)).toBeInTheDocument();
        const body = screen.getByText('child').parentElement;
        expect(body).toHaveClass(`${prefix}-body`);
        expect(body).toHaveAttribute('x-semi-prop', 'children');
        expect(body).toHaveStyle({ height: '200px' });
        expect(root).not.toHaveAttribute('x-semi-header-alias');
    });

    it('传入 aria-label 时根元素是有名称的 group，没有名称时不加 role', () => {
        const { container, rerender } = render(<ScrollList aria-label="time">child</ScrollList>);
        expect(screen.getByRole('group', { name: 'time' })).toBe(container.firstElementChild);
        rerender(<ScrollList>child</ScrollList>);
        expect(container.firstElementChild).not.toHaveAttribute('role');
    });

    it('header 与 footer 为数字 0 时照常渲染，false 与 null 不渲染', () => {
        const { container, rerender } = render(<ScrollList footer={0} header={0} />);
        expect(container.querySelector(`.${prefix}-header-title`)).toHaveTextContent('0');
        expect(container.querySelector(`.${prefix}-footer`)).toHaveTextContent('0');
        rerender(<ScrollList footer={null} header={false} />);
        expect(container.querySelector(`.${prefix}-header`)).toBeNull();
        expect(container.querySelector(`.${prefix}-footer`)).toBeNull();
    });

    it('未传入时不渲染头部与底部', () => {
        const { container } = render(<ScrollList>child</ScrollList>);
        expect(container.querySelector(`.${prefix}-header`)).toBeNull();
        expect(container.querySelector(`.${prefix}-footer`)).toBeNull();
    });

    it('data-* 属性、className 与 style 透传到根元素', () => {
        const { container } = render(
            <ScrollList className="custom" style={{ color: 'red' }} data-testid="list">
                child
            </ScrollList>
        );
        const root = screen.getByTestId('list');
        expect(root).toBe(container.firstElementChild);
        expect(root).toHaveClass('custom', prefix);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('自定义 className 只作用于根元素', () => {
        const { container } = render(
            <ScrollList className="custom" footer="foot" header="title">
                child
            </ScrollList>
        );
        expect(container.querySelectorAll('.custom')).toHaveLength(1);
        expect(container.querySelector(`.${prefix}-body`)).toHaveClass(`${prefix}-body`);
    });

    it('ref 指向根元素', () => {
        const ref = React.createRef<HTMLDivElement>();
        const { container } = render(<ScrollList ref={ref}>child</ScrollList>);
        expect(ref.current).toBe(container.firstElementChild);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ScrollList: { bodyHeight: 120 }, ScrollItem: { mode: 'normal' } };
        const { container } = render(
            <ScrollList>
                <ScrollItem list={numbers(3)} />
            </ScrollList>
        );
        expect(container.querySelector(`.${prefix}-body`)).toHaveStyle({ height: '120px' });
        expect(container.querySelector(`.${prefix}-item`)).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-item-wheel`)).toBeNull();
    });
});

describe('ScrollItem 行为', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('类型：不接受 children', () => {
        expectTypeOf<'children'>().not.toExtend<keyof ScrollItemProps<Item>>();
    });

    it('wheel 列的 listbox 按空格不触发原生翻页', () => {
        render(<ScrollItem aria-label="wheel" list={numbers(10)} mode="wheel" motion={false} selectedIndex={4} />);
        const listbox = screen.getByRole('listbox');
        // fireEvent returns false when the default action was prevented
        expect(fireEvent.keyDown(listbox, { key: ' ' })).toBe(false);
    });

    it('normal 模式渲染 items、选中类名、转换后的文本与禁用项', () => {
        const list = [{ value: 'a' }, { value: 'b', transform: (v) => `item-${v}` }, { value: 'c', disabled: true }];
        const { container, rerender } = render(<ScrollItem className="col" style={{ color: 'red' }} aria-label="letters" list={list} mode="normal" selectedIndex={0} transform={(v) => `common-${v}`} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(`${prefix}-item`, 'col');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByRole('listbox', { name: 'letters' })).toBeInTheDocument();
        expect(getItemTexts(root)).toEqual(['common-a', 'b', 'c']);
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveClass(`${prefix}-item-sel`);
        expect(options[2]).toHaveClass(`${prefix}-item-disabled`);
        expect(options[2]).toHaveAttribute('aria-disabled', 'true');

        rerender(<ScrollItem list={list} mode="normal" selectedIndex={1} transform={(v) => `common-${v}`} />);
        expect(getItemTexts(root)).toEqual(['a', 'item-b', 'c']);
        expect(screen.getAllByRole('option')[1]).toHaveClass(`${prefix}-item-sel`);
    });

    it('normal 模式点击调用 onSelect，传入 item、type 与 index；跳过禁用项', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        const list = [
            { value: 'a', extra: 1 },
            { value: 'b', disabled: true },
            { value: 'c', text: 'C' },
        ];
        render(<ScrollItem type="letter" list={list} mode="normal" onSelect={onSelect} />);
        const options = screen.getAllByRole('option');

        await userEvent.click(options[1]);
        expect(onSelect).not.toHaveBeenCalled();

        await userEvent.click(options[2]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ value: 'c', text: 'C', type: 'letter', index: 2 });

        await userEvent.click(options[0]);
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'a', extra: 1, type: 'letter', index: 0 });
    });

    it('wheel 模式渲染遮罩、选择器与非循环的外层列表', () => {
        const { container } = render(<ScrollItem list={numbers(3)} selectedIndex={1} />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(`${prefix}-item-wheel`);
        expect(root.querySelector(`.${prefix}-shade-pre`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-shade-post`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-selector`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-list-outer-nocycle`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefix}-item-sel`)).toBeNull();
    });

    it('wheel 模式点击在防抖后选中，并传入 item、type 与 index', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        render(<ScrollItem type="n" list={numbers(5)} onSelect={onSelect} />);
        await userEvent.click(screen.getAllByRole('option')[3]);
        expect(onSelect).not.toHaveBeenCalled();
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        expect(onSelect).toHaveBeenCalledWith({ value: 3, type: 'n', index: 3 });
    });

    it('循环 wheel 模式在需要副本填满视图时将列表渲染三次', () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            const height = this.tagName === 'LI' ? 36 : 100;
            return { top: 0, bottom: height, left: 0, right: 0, width: 0, height, x: 0, y: 0, toJSON: () => ({}) };
        });
        const list = numbers(12);
        const { container } = render(<ScrollItem cycled list={list} selectedIndex={2} />);
        expect(container.querySelector(`.${prefix}-list-outer-nocycle`)).toBeNull();
        const texts = getItemTexts(container.firstElementChild);
        expect(texts).toHaveLength(36);
        expect(texts.slice(12, 24)).toEqual(list.map(({ value }) => String(value)));

        const strict = render(
            <StrictMode>
                <ScrollItem cycled list={list} selectedIndex={2} />
            </StrictMode>
        );
        expect(getItemTexts(strict.container.firstElementChild)).toHaveLength(36);
    });

    it('挂载时以及 selectedIndex 变化后，把选中项滚动到中间', () => {
        mockItemLayout();
        const { container, rerender } = render(<ScrollItem list={numbers(10)} mode="normal" motion={false} selectedIndex={0} />);
        const wrapper = container.firstElementChild;
        // the first item has offsetTop 0, which the scroll target treats as unknown and falls back to the list middle
        expect(wrapper.scrollTop).toBe(108);

        rerender(<ScrollItem list={numbers(10)} mode="normal" motion={false} selectedIndex={4} />);
        // item 4 is at 144; centred in a 180px wrapper: 144 - (180 - 36) / 2
        expect(wrapper.scrollTop).toBe(72);
    });

    it('挂载时列表为空、数据到达后，将选中项居中', () => {
        mockItemLayout();
        const { container, rerender } = render(<ScrollItem list={[]} mode="wheel" motion={false} selectedIndex={0} />);
        const wrapper = container.querySelector(`.${prefix}-list-outer`);
        // data and the new selectedIndex arrive together
        rerender(<ScrollItem list={numbers(10)} mode="wheel" motion={false} selectedIndex={4} />);
        expect(wrapper.scrollTop).toBe(72);
        // selectedIndex changes later, and the emptied list comes back with the same selection
        rerender(<ScrollItem list={numbers(10)} mode="wheel" motion={false} selectedIndex={6} />);
        expect(wrapper.scrollTop).toBe(144);
        rerender(<ScrollItem list={[]} mode="wheel" motion={false} selectedIndex={6} />);
        rerender(<ScrollItem list={numbers(10)} mode="wheel" motion={false} selectedIndex={6} />);
        expect(wrapper.scrollTop).toBe(144);
    });

    it('normal 模式的循环列表挂载时为空、数据到达后，将选中项居中', () => {
        mockItemLayout();
        const { container, rerender } = render(<ScrollItem cycled list={[]} mode="normal" motion={false} selectedIndex={4} />);
        rerender(<ScrollItem cycled list={numbers(10)} mode="normal" motion={false} selectedIndex={4} />);
        expect(container.firstElementChild.scrollTop).toBe(72);
    });

    it('循环 wheel 列的副本对辅助技术隐藏，只有本体是选项集合且只有一个选中项', () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            const height = this.tagName === 'LI' ? 36 : 100;
            return { top: 0, bottom: height, left: 0, right: 0, width: 0, height, x: 0, y: 0, toJSON: () => ({}) };
        });
        render(<ScrollItem aria-label="n" cycled list={numbers(12)} selectedIndex={2} />);
        expect(screen.getAllByRole('option')).toHaveLength(12);
        expect(screen.getAllByRole('option', { selected: true })).toHaveLength(1);
        expect(screen.getAllByRole('option', { hidden: true })).toHaveLength(36);
    });

    it('类型：onSelect 的参数带有 index 与 type', () => {
        type Opt = { value: number; text: string };
        expectTypeOf<Parameters<NonNullable<ScrollItemProps<Opt>['onSelect']>>[0]>().toExtend<{
            value: number;
            text: string;
            index: number;
            type?: string | number;
        }>();
    });

    it('循环列表中父组件修改 selectedIndex，从当前所在副本按偏移取目标项并居中', () => {
        mockItemLayout();
        // every rect at the top: the cycled column renders one copy before and one after the list
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            const height = this.tagName === 'LI' ? 36 : 100;
            return { top: 0, bottom: height, left: 0, right: 0, width: 0, height, x: 0, y: 0, toJSON: () => ({}) };
        });
        const { container, rerender } = render(<ScrollItem cycled list={numbers(12)} motion={false} selectedIndex={2} />);
        const wrapper = container.querySelector(`.${prefix}-list-outer`);
        // item 2 of the middle copy is the 15th li: 14 * 36 - (180 - 36) / 2
        expect(wrapper.scrollTop).toBe(432);

        rerender(<ScrollItem cycled list={numbers(12)} motion={false} selectedIndex={5} />);
        expect(wrapper.scrollTop).toBe(17 * 36 - 72);
        rerender(<ScrollItem cycled list={numbers(12)} motion={false} selectedIndex={0} />);
        expect(wrapper.scrollTop).toBe(12 * 36 - 72);
    });

    it('motion 开启时，selectedIndex 变化后滚动带动画', async () => {
        mockItemLayout();
        const { container, rerender } = render(<ScrollItem list={numbers(10)} mode="normal" selectedIndex={0} />);
        const wrapper = container.firstElementChild;
        rerender(<ScrollItem list={numbers(10)} mode="normal" selectedIndex={4} />);
        await waitFor(() => expect(wrapper.scrollTop).toBe(72));
    });

    it('ref.current.scrollToIndex() 滚动回选中项', () => {
        mockItemLayout();
        const ref = React.createRef<ScrollItemHandle>();
        const { container } = render(<ScrollItem ref={ref} list={numbers(10)} mode="normal" motion={false} selectedIndex={4} />);
        const wrapper = container.firstElementChild;
        expect(wrapper.scrollTop).toBe(72);
        wrapper.scrollTop = 0;
        ref.current.scrollToIndex();
        expect(wrapper.scrollTop).toBe(72);
    });

    it('ref 只暴露 scrollToIndex', () => {
        const ref = React.createRef<ScrollItemHandle>();
        render(<ScrollItem ref={ref} list={numbers(3)} />);
        expect(Object.keys(ref.current)).toEqual(['scrollToIndex']);
    });

    it('卸载后不调用 onSelect（循环模式）', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        const { unmount } = render(<ScrollItem cycled list={numbers(5)} onSelect={onSelect} />);
        await userEvent.click(screen.getAllByRole('option')[3]);
        unmount();
        await sleep(100);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('卸载后不调用 onSelect（非循环模式）', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        const { unmount } = render(<ScrollItem list={numbers(5)} onSelect={onSelect} />);
        await userEvent.click(screen.getAllByRole('option')[3]);
        unmount();
        await sleep(100);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('卸载时停止滚动动画', async () => {
        mockItemLayout();
        const setScrollTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');
        const { rerender, unmount } = render(<ScrollItem list={numbers(10)} mode="normal" selectedIndex={0} />);
        rerender(<ScrollItem list={numbers(10)} mode="normal" selectedIndex={4} />);
        unmount();
        const calls = setScrollTop.mock.calls.length;
        await sleep(200);
        expect(setScrollTop).toHaveBeenCalledTimes(calls);
    });

    it('StrictMode 下每次点击只选中一次', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        render(
            <StrictMode>
                <ScrollItem list={numbers(5)} onSelect={onSelect} />
            </StrictMode>
        );
        await userEvent.click(screen.getAllByRole('option')[2]);
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        await sleep(100);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith({ value: 2, type: undefined, index: 2 });
    });

    it('两种模式下都能渲染空列表', () => {
        expect(() => render(<ScrollItem list={[]} />)).not.toThrow();
        expect(() => render(<ScrollItem mode="normal" />)).not.toThrow();
    });

    it('data-* 属性透传到根元素', () => {
        const { container } = render(<ScrollItem data-testid="col" list={numbers(3)} />);
        expect(screen.getByTestId('col')).toBe(container.firstElementChild);
    });

    it('aria-labelledby 与 aria-describedby 落在 listbox 上，而不是没有角色的根元素', () => {
        const { container } = render(
            <>
                <span id="hours-title">小时</span>
                <span id="hours-hint">选择小时</span>
                <ScrollItem aria-describedby="hours-hint" aria-labelledby="hours-title" list={numbers(3)} />
            </>
        );
        const listbox = screen.getByRole('listbox', { name: '小时', description: '选择小时' });
        expect(listbox.tagName).toBe('UL');
        expect(container.querySelector('div[aria-labelledby], div[aria-describedby]')).toBeNull();
    });

    it('用 aria-selected 标记选中的选项', () => {
        render(<ScrollItem list={numbers(3)} mode="normal" selectedIndex={1} />);
        expect(screen.getAllByRole('option').map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    });

    it.each(['normal', 'wheel'])('%s 模式：listbox 获得焦点，并把 active descendant 指向选中的选项', async (mode) => {
        render(<ScrollItem aria-label="hour" list={numbers(3)} mode={mode} selectedIndex={1} />);
        const listbox = screen.getByRole('listbox', { name: 'hour' });
        await userEvent.tab();
        expect(listbox).toHaveFocus();
        const active = document.getElementById(listbox.getAttribute('aria-activedescendant'));
        expect(active).toHaveTextContent('1');
        expect(active).toHaveAttribute('aria-selected', 'true');
    });

    it('方向键、Home、End 与输入字符通过 onSelect 选中，跳过禁用项', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        const list = [{ value: 'apple' }, { value: 'banana', disabled: true }, { value: 'cherry' }, { value: 'cocoa' }];
        const { rerender } = render(<ScrollItem type="fruit" list={list} mode="normal" selectedIndex={0} onSelect={onSelect} />);
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cherry', type: 'fruit', index: 2 });

        rerender(<ScrollItem type="fruit" list={list} mode="normal" selectedIndex={2} onSelect={onSelect} />);
        await userEvent.keyboard('{End}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cocoa', type: 'fruit', index: 3 });
        await userEvent.keyboard('{Home}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'apple', type: 'fruit', index: 0 });
        await userEvent.keyboard('co');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 'cocoa', type: 'fruit', index: 3 });
        onSelect.mockClear();
        rerender(<ScrollItem type="fruit" list={list} mode="normal" selectedIndex={3} onSelect={onSelect} />);
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('带 Ctrl 或 Meta 的字符键不触发搜索选中', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        const list = [{ value: 'apple' }, { value: 'cherry' }];
        render(<ScrollItem type="fruit" list={list} mode="normal" selectedIndex={0} onSelect={onSelect} />);
        screen.getByRole('listbox').focus();
        await userEvent.keyboard('{Control>}c{/Control}{Meta>}c{/Meta}');
        expect(onSelect).not.toHaveBeenCalled();
        await userEvent.keyboard('c');
        expect(onSelect).toHaveBeenCalledWith({ value: 'cherry', type: 'fruit', index: 1 });
    });

    it('循环列表用方向键首尾相接', async () => {
        const onSelect = vi.fn<(item: Item) => void>();
        render(<ScrollItem type="n" cycled list={numbers(3)} selectedIndex={2} onSelect={onSelect} />);
        screen.getAllByRole('listbox')[0].focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onSelect).toHaveBeenLastCalledWith({ value: 0, type: 'n', index: 0 });
    });
});
