import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { clickOutside } from '@test/utils/browser';
import AutoComplete from '..';

const getPopover = () => document.querySelector(`.${BASE_CLASS_PREFIX}-popover`);
const getPopupWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
const getClearBtn = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement;

function Demo() {
    const [data, setData] = createSignal<string[]>([]);
    return <AutoComplete style={{ width: '300px' }} placeholder="fe" data={data()} showClear prefix={<IconSearch />} onSearch={(value) => setData(value ? ['gmail.com', '163.com', 'qq.com'].map((d) => `${value}@${d}`) : [])} />;
}

describe('AutoComplete', () => {
    it('加载态面板由内边距和 Spin 撑开，Spin 不溢出面板', async () => {
        // the enter animation scales the panel, which skews rects measured mid-animation
        render(() => <AutoComplete style={{ width: '300px' }} data={[]} loading motion={false} />);
        await userEvent.click(screen.getByRole('combobox'));
        const wrapper = await waitFor(() => {
            const el = document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper`);
            expect(el).not.toBeNull();
            return el as HTMLElement;
        });
        const spin = wrapper.querySelector(`.${BASE_CLASS_PREFIX}-spin`) as HTMLElement;
        const { top, bottom } = wrapper.getBoundingClientRect();
        const style = getComputedStyle(wrapper);
        expect(spin.getBoundingClientRect().bottom).toBeLessThanOrEqual(bottom - parseFloat(style.paddingBottom));
        expect(spin.getBoundingClientRect().top).toBeGreaterThanOrEqual(top + parseFloat(style.paddingTop));
    });

    it('按键', async () => {
        render(() => <Demo />);
        const input = screen.getByRole('combobox');
        await userEvent.tab();
        expect(input).toHaveFocus();

        await userEvent.type(input, '123');
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(input).toHaveValue('123');

        await userEvent.keyboard('{Enter}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowUp}{Escape}');
        expect(input).toHaveValue('123');

        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => expect(input).toHaveValue('123@gmail.com'));

        await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}');
        await waitFor(() => expect(input).toHaveValue('123@qq.com'));

        await userEvent.hover(input);
        await userEvent.click(getClearBtn());
        await clickOutside();
        expect(input).toHaveValue('');
    });

    it('鼠标悬停选项', async () => {
        render(() => <Demo />);
        const input = screen.getByRole('combobox');
        await userEvent.type(input, '123');
        await userEvent.hover(await screen.findByText('123@163.com'));
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await waitFor(() => expect(input).toHaveValue('123@qq.com'));
    });

    it('鼠标点击清除按钮不先打开再关闭列表', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        render(() => <AutoComplete style={{ width: '300px' }} defaultValue="semi" data={['semi', 'design']} motion={false} showClear onDropdownVisibleChange={onDropdownVisibleChange} />);
        const input = screen.getByRole('combobox');
        await userEvent.hover(input);
        await userEvent.click(getClearBtn());
        expect(input).toHaveValue('');
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        expect(getPopover()).not.toBeNull();
    });

    it('点击外部关闭列表', async () => {
        render(() => <Demo />);
        await userEvent.type(screen.getByRole('combobox'), '123');
        expect(await screen.findByText('123@163.com')).toBeInTheDocument();
        await clickOutside();
        await waitFor(() => expect(getPopupWrapper()).toBeNull());
    });

    it('下拉宽度不小于触发器宽度', async () => {
        render(() => <Demo />);
        await userEvent.type(screen.getByRole('combobox'), '1');
        await screen.findByText('1@163.com');
        const trigger = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-autocomplete`) as HTMLElement;
        // offsetWidth ignores the enter animation's scale transform
        expect((getPopupWrapper() as HTMLElement).offsetWidth).toBeGreaterThanOrEqual(trigger.offsetWidth);
    });

    it('鼠标点选候选项后焦点留在输入框，不触发 onBlur', async () => {
        const onBlur = vi.fn<() => void>();
        render(() => <AutoComplete data={['a', 'b']} motion={false} onBlur={onBlur} />);
        const input = screen.getByRole('combobox');
        await userEvent.click(input);
        await userEvent.click(await screen.findByRole('option', { name: 'b' }));
        expect(input).toHaveValue('b');
        expect(input).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });
});
