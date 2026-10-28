import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { MCPConfigureContentProps, MCPOption } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { MCPConfigure } from '@fibrae/semi-ai-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';

const options = [
    { label: 'GitHub', value: 'github', desc: 'Code hosting', icon: 'https://semi.design/github.png', active: true },
    { label: 'Figma', value: 'figma', desc: 'Design tool', configure: true },
    { label: 'Preset', value: 'preset', desc: 'Built in', active: true, disabled: true },
];
const customOptions = [
    { label: 'Mine', value: 'mine', desc: 'My server' },
    { label: 'Other', value: 'other', desc: 'Another one', active: true },
];

const labels = (container) => [...container.querySelectorAll('.semi-sidebar-mcp-configure-content-item-content-label')].map((n) => n.textContent);
const items = (container) => [...container.querySelectorAll('.semi-sidebar-mcp-configure-content-item')];
const search = (container) => container.querySelector('.semi-sidebar-mcp-configure-content-search input');
const switchToCustom = () => fireEvent.click(screen.getByText('自定义 MCP', { selector: '.semi-radio *' }));

describe('MCPConfigure', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('渲染在容器中，包含语言包标题、模式切换和激活数量', () => {
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible />);
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('MCP 配置');
        expect(screen.getByText(zh_CN.Sidebar.mcpServers)).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-mcp-configure-content-header-count')).toHaveTextContent('已激活 MCP 数: 3/5');
        expect(search(container)).toHaveAttribute('placeholder', '请输入');
    });

    it('全局 Input 默认值不给搜索框加清除按钮与前后缀，保留搜索图标', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true, prefix: 'x', suffix: 'y', addonBefore: 'b', addonAfter: 'a' } };
        try {
            const { container } = render(<MCPConfigure options={options} visible />);
            fireEvent.change(search(container), { target: { value: 'git' } });
            const wrapper = search(container).closest('.semi-input-wrapper');
            expect(wrapper.querySelector('.semi-input-clearbtn, .semi-input-suffix, .semi-input-prepend, .semi-input-append')).toBeNull();
            expect(wrapper.querySelector('.semi-input-prefix .semi-icon-search')).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('模式切换的内置 MCP 标签随语言包切换', () => {
        render(
            <LocaleProvider locale={ja_JP}>
                <MCPConfigure options={options} visible />
            </LocaleProvider>
        );
        expect(screen.getByText(ja_JP.Sidebar.mcpServers, { selector: '.semi-radio *' })).toBeInTheDocument();
    });

    it('title 和 placeholder 属性替换语言包文案', () => {
        const { container } = render(<MCPConfigure title="Servers" placeholder="Find" options={options} visible />);
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Servers');
        expect(search(container)).toHaveAttribute('placeholder', 'Find');
    });

    it('列出内层选项，包含图标、描述和按钮', () => {
        const { container } = render(<MCPConfigure options={options} visible />);
        expect(labels(container)).toEqual(['GitHub', 'Figma', 'Preset']);
        const [github, figma, preset] = items(container);
        expect(github.querySelector('img.semi-sidebar-mcp-configure-content-item-sign')).toHaveAttribute('src', 'https://semi.design/github.png');
        expect(github).toHaveTextContent('Code hosting');
        expect(github.querySelector('.semi-sidebar-mcp-configure-content-item-button-configure')).toBeNull();
        expect(figma.querySelector('.semi-sidebar-mcp-configure-content-item-button-configure')).toBeInTheDocument();
        expect(github.querySelector('.semi-icon-minus')).toBeInTheDocument();
        expect(figma.querySelector('.semi-icon-plus')).toBeInTheDocument();
        expect(preset.querySelector('.semi-icon-minus').closest('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('模式切换以语言包的 MCP 配置命名', () => {
        render(<MCPConfigure options={options} visible />);
        expect(screen.getByRole('radiogroup', { name: zh_CN.Sidebar.mcpConfigure })).toBeInTheDocument();
    });

    it('字符串图标为装饰性图片', () => {
        const { container } = render(<MCPConfigure options={options} visible />);
        expect(container.querySelector('img.semi-sidebar-mcp-configure-content-item-sign')).toHaveAttribute('alt', '');
    });

    it('禁用项的状态按钮保持可聚焦，点击不改变状态', () => {
        const onStatusChange = vi.fn<NonNullable<MCPConfigureContentProps['onStatusChange']>>();
        const { container } = render(<MCPConfigure options={options} visible onStatusChange={onStatusChange} />);
        const button = items(container)[2].querySelector('.semi-icon-minus').closest('button');
        expect(button).not.toBeDisabled();
        button.focus();
        expect(button).toHaveFocus();
        expect(button).toHaveAccessibleName(zh_CN.Sidebar.disable);
        fireEvent.click(button);
        expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('类型：选项的 value 必填，它是 onStatusChange 匹配选项的标识', () => {
        expectTypeOf<{ label: string }>().not.toExtend<MCPOption>();
    });

    it('从语言包读取纯图标按钮的名称', () => {
        const { container } = render(<MCPConfigure options={options} visible />);
        const [github, figma] = items(container).map((item) => within(item));
        const { Sidebar: text } = zh_CN;
        expect(github.getByRole('button', { name: text.disable })).toBeInTheDocument();
        expect(figma.getByRole('button', { name: text.enable })).toBeInTheDocument();
        expect(figma.getByRole('button', { name: text.configure })).toBeInTheDocument();
    });

    it('状态按钮报告已切换的选项，以及它们是否为自定义选项', () => {
        const onStatusChange = vi.fn<NonNullable<MCPConfigureContentProps['onStatusChange']>>();
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible onStatusChange={onStatusChange} />);
        fireEvent.click(items(container)[1].querySelector('.semi-icon-plus').closest('button'));
        expect(onStatusChange).toHaveBeenLastCalledWith([options[0], { ...options[1], active: true }, options[2]], false);

        switchToCustom();
        fireEvent.click(items(container)[1].querySelector('.semi-icon-minus').closest('button'));
        expect(onStatusChange).toHaveBeenLastCalledWith([customOptions[0], { ...customOptions[1], active: false }], true);
    });

    it('配置按钮和编辑按钮报告对应选项', () => {
        const onConfigureClick = vi.fn<NonNullable<MCPConfigureContentProps['onConfigureClick']>>();
        const onEditClick = vi.fn<NonNullable<MCPConfigureContentProps['onEditClick']>>();
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible onConfigureClick={onConfigureClick} onEditClick={onEditClick} />);
        fireEvent.click(container.querySelector('.semi-icon-setting').closest('button'));
        expect(onConfigureClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), options[1]);

        switchToCustom();
        expect(labels(container)).toEqual(['Mine', 'Other']);
        fireEvent.click(items(container)[0].querySelector('.semi-icon-edit').closest('button'));
        expect(onEditClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), customOptions[0]);
    });

    it('自定义模式下没有自定义选项时显示空状态，其按钮调用 onAddClick', () => {
        const onAddClick = vi.fn<NonNullable<MCPConfigureContentProps['onAddClick']>>();
        const { container } = render(<MCPConfigure options={options} visible onAddClick={onAddClick} />);
        switchToCustom();
        expect(screen.getByText('暂无自定义 MCP')).toBeInTheDocument();
        expect(items(container)).toEqual([]);
        fireEvent.click(container.querySelector('.semi-sidebar-mcp-configure-content-custom-empty button'));
        expect(onAddClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('自定义模式下有自定义选项时显示搜索框和添加按钮', () => {
        const onAddClick = vi.fn<NonNullable<MCPConfigureContentProps['onAddClick']>>();
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible onAddClick={onAddClick} />);
        switchToCustom();
        const bar = container.querySelector('.semi-sidebar-mcp-configure-content-search-container');
        expect(bar.querySelector('input')).toBeInTheDocument();
        fireEvent.click(bar.querySelector('button'));
        expect(onAddClick).toHaveBeenCalledTimes(1);
    });

    it('搜索按 label 和 description 过滤，不区分大小写，节流 300ms', () => {
        vi.useFakeTimers();
        const { container } = render(<MCPConfigure options={options} visible />);
        fireEvent.change(search(container), { target: { value: 'g' } });
        expect(search(container)).toHaveValue('g');
        expect(labels(container)).toEqual(['GitHub', 'Figma']);

        fireEvent.change(search(container), { target: { value: 'DESIGN' } });
        expect(labels(container)).toEqual(['GitHub', 'Figma']);
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(labels(container)).toEqual(['Figma']);

        act(() => {
            vi.advanceTimersByTime(300);
        });
        fireEvent.change(search(container), { target: { value: '' } });
        expect(labels(container)).toEqual(['GitHub', 'Figma', 'Preset']);
    });

    it('onSearch 报告输入内容，以及是否搜索自定义列表', () => {
        const onSearch = vi.fn<NonNullable<MCPConfigureContentProps['onSearch']>>();
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible onSearch={onSearch} />);
        fireEvent.change(search(container), { target: { value: 'git' } });
        expect(onSearch).toHaveBeenLastCalledWith('git', false);
        switchToCustom();
        fireEvent.change(search(container), { target: { value: 'mi' } });
        expect(onSearch).toHaveBeenLastCalledWith('mi', true);
    });

    it('切换模式保留搜索文本，并过滤另一个列表', () => {
        vi.useFakeTimers();
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible />);
        fireEvent.change(search(container), { target: { value: 'other' } });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        switchToCustom();
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(search(container)).toHaveValue('other');
        expect(labels(container)).toEqual(['Other']);
    });

    it('搜索后立即切换模式，列表随模式同步更新而不等节流窗口', () => {
        vi.useFakeTimers();
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible />);
        fireEvent.change(search(container), { target: { value: 'o' } });
        // a second keystroke inside the window leaves a trailing search pending
        fireEvent.change(search(container), { target: { value: 'other' } });
        switchToCustom();
        expect(labels(container)).toEqual(['Other']);
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(labels(container)).toEqual(['Other']);
    });

    it('自定义过滤函数接收转为小写的输入和选项', () => {
        vi.useFakeTimers();
        const filter = vi.fn<NonNullable<MCPConfigureContentProps['filter']>>((value, option) => option.value.startsWith(value));
        const { container } = render(<MCPConfigure filter={filter} options={options} visible />);
        fireEvent.change(search(container), { target: { value: 'FI' } });
        expect(filter).toHaveBeenCalledWith('fi', options[0]);
        expect(labels(container)).toEqual(['Figma']);
    });

    it('filter 属性变化后，列表按新的过滤函数重新计算', () => {
        vi.useFakeTimers();
        const byValue: NonNullable<MCPConfigureContentProps['filter']> = (value, option) => option.value.startsWith(value);
        const byLabelEnd: NonNullable<MCPConfigureContentProps['filter']> = (value, option) => String(option.label).toLowerCase().endsWith(value);
        const { container, rerender } = render(<MCPConfigure filter={byValue} options={options} visible />);
        fireEvent.change(search(container), { target: { value: 'f' } });
        expect(labels(container)).toEqual(['Figma']);
        rerender(<MCPConfigure filter={byLabelEnd} options={options} visible />);
        expect(labels(container)).toEqual([]);
    });

    it('新增选项立即按当前搜索内容过滤', () => {
        vi.useFakeTimers();
        const { container, rerender } = render(<MCPConfigure options={options} visible />);
        fireEvent.change(search(container), { target: { value: 'tool' } });
        expect(labels(container)).toEqual(['Figma']);
        const next = [...options, { label: 'Tooling', value: 'tooling' }];
        rerender(<MCPConfigure options={next} visible />);
        expect(labels(container)).toEqual(['Figma', 'Tooling']);
    });

    it('自定义模式下新增的自定义选项立即显示', () => {
        const { container, rerender } = render(<MCPConfigure customOptions={customOptions} options={options} visible />);
        switchToCustom();
        const next = [...customOptions, { label: 'Third', value: 'third' }];
        rerender(<MCPConfigure customOptions={next} options={options} visible />);
        expect(labels(container)).toEqual(['Mine', 'Other', 'Third']);
    });

    it('renderItem 替换内置项，并能获取当前模式', () => {
        const renderItem = vi.fn<NonNullable<MCPConfigureContentProps['renderItem']>>(({ option, custom }) => <div key={option.value} className="my-item">{`${option.label}:${custom}`}</div>);
        const { container } = render(<MCPConfigure customOptions={customOptions} options={options} visible renderItem={renderItem} />);
        expect([...container.querySelectorAll('.my-item')].map((n) => n.textContent)).toEqual(['GitHub:false', 'Figma:false', 'Preset:false']);
        switchToCustom();
        expect([...container.querySelectorAll('.my-item')].map((n) => n.textContent)).toEqual(['Mine:true', 'Other:true']);
        expect(items(container)).toEqual([]);
    });

    it('容器属性透传：className、onCancel 和 resizable', () => {
        const onCancel = vi.fn<() => void>();
        const { container } = render(<MCPConfigure className="custom" options={options} resizable={false} visible onCancel={onCancel} />);
        expect(container.querySelector('.semi-sidebar-container')).toHaveClass('custom');
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
    });

    it('StrictMode 下渲染', () => {
        const { container } = render(
            <StrictMode>
                <MCPConfigure options={options} visible />
            </StrictMode>
        );
        expect(labels(container)).toEqual(['GitHub', 'Figma', 'Preset']);
    });
});
