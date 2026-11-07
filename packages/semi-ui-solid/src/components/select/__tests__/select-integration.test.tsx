import { render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Select from '..';
import Popover from '../../popover';
import Tag from '../../tag';
import Tooltip from '../../tooltip';

const prefixCls = `${BASE_CLASS_PREFIX}-select`;
const popoverSelector = `.${BASE_CLASS_PREFIX}-popover`;
const tooltipShownSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`;

const options = () => [<Select.Option value="abc">抖音</Select.Option>, <Select.Option value="hotsoon">火山</Select.Option>, <Select.Option value="xigua">西瓜视频</Select.Option>];

describe('Select 与 Tooltip、Popover 的集成', () => {
    it('disabled Select 是特殊触发器：外包 span 带 wrapperClassName 并作为停靠点', async () => {
        render(() => (
            <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                {(t) => (
                    <Select disabled motion={false} placeholder="请选择业务线" style={{ width: '120px' }} {...t()}>
                        {options()}
                    </Select>
                )}
            </Tooltip>
        ));
        const root = document.querySelector(`.${prefixCls}`) as HTMLElement;
        const span = document.querySelector('.probe') as HTMLElement;
        expect(span).toContainElement(root);
        expect(span).toHaveAttribute('tabindex', '0');
        expect(span.style.cursor).toBe('not-allowed');
        expect(root.style.pointerEvents).toBe('none');
        await userEvent.click(span);
        await waitFor(() => expect(document.querySelector(tooltipShownSelector)).not.toBeNull());
    });

    it('未禁用的 Select 不被包裹', () => {
        render(() => (
            <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                {(t) => (
                    <Select motion={false} {...t()}>
                        {options()}
                    </Select>
                )}
            </Tooltip>
        ));
        expect(document.querySelector('.probe')).toBeNull();
    });

    it('修复 FixNestedPopover #818：在 click Popover 内的 Select 中选择选项后，Popover 保持打开', async () => {
        render(() => (
            <Popover
                showArrow
                motion={false}
                trigger="click"
                content={
                    <Select defaultValue="abc" motion={false} style={{ width: '120px' }}>
                        {options()}
                    </Select>
                }
            >
                {(t) => <Tag {...t()}>点击此处</Tag>}
            </Popover>
        ));
        await userEvent.click(screen.getByText('点击此处'));
        const popover = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(popoverSelector);
            expect(node).not.toBeNull();
            return node as HTMLElement;
        });
        await userEvent.click(within(popover).getByRole('combobox'));
        await userEvent.click(await screen.findByRole('option', { name: '西瓜视频' }));
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
        expect(document.querySelector(popoverSelector)).toBe(popover);
        expect(within(popover).getByRole('combobox')).toHaveTextContent('西瓜视频');
    });

    it('下拉弹层算作外层 click Tooltip 的内部：在其中选择选项不关闭 Tooltip', async () => {
        render(() => (
            <Tooltip
                motion={false}
                trigger="click"
                content={
                    <Select motion={false} style={{ width: '120px' }}>
                        {options()}
                    </Select>
                }
            >
                {(t) => <Tag {...t()}>open</Tag>}
            </Tooltip>
        ));
        await userEvent.click(screen.getByText('open'));
        const tip = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(tooltipShownSelector);
            expect(node).not.toBeNull();
            return node as HTMLElement;
        });
        await userEvent.click(within(tip).getByRole('combobox'));
        const option = await screen.findByRole('option', { name: '火山' });
        expect(tip).not.toContainElement(option);
        await userEvent.click(option);
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
        expect(document.querySelector(tooltipShownSelector)).toBe(tip);
        expect(within(tip).getByRole('combobox')).toHaveTextContent('火山');
    });

    it('以 Select 作为 click Popover 的触发器时，点击下拉选项不算点击 Popover 外部', async () => {
        render(() => (
            <Popover motion={false} trigger="click" content={<p>card</p>}>
                {(t) => (
                    <Select motion={false} style={{ width: '120px' }} {...t()}>
                        {options()}
                    </Select>
                )}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getByText('card')).toBeInTheDocument());
        await userEvent.click(await screen.findByRole('option', { name: '抖音' }));
        await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('抖音'));
        expect(screen.getByText('card')).toBeInTheDocument();
    });
});
