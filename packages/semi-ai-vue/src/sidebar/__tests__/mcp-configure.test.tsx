/** @jsxImportSource vue */
import { nextTick, type VNode } from 'vue';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-vue/_utils/semi-global';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import { render } from '@test/utils/vue';
import MCPConfigure, { type MCPConfigureEmits, type MCPConfigureItemSlotProps, type MCPConfigureOption } from '../mcp-configure';
import MCPModel from './fixtures/mcp-model.vue';

type Emit<K extends keyof MCPConfigureEmits> = (...args: MCPConfigureEmits[K]) => void;
const text = zh_CN.Sidebar;

const options: MCPConfigureOption[] = [
    { label: 'GitHub', value: 'github', desc: 'Code hosting', icon: 'https://semi.design/github.png', active: true },
    { label: 'Figma', value: 'figma', desc: 'Design tool', configure: true },
    { label: 'Preset', value: 'preset', desc: 'Built in', active: true, disabled: true },
];
const customOptions: MCPConfigureOption[] = [
    { label: 'Mine', value: 'mine', desc: 'My server' },
    { label: 'Other', value: 'other', desc: 'Another one', active: true },
];

const labels = (container: Element) => [...container.querySelectorAll('.semi-sidebar-mcp-configure-content-item-content-label')].map((n) => n.textContent);
const items = (container: Element) => [...container.querySelectorAll('.semi-sidebar-mcp-configure-content-item')];
const search = (container: Element) => container.querySelector('.semi-sidebar-mcp-configure-content-search input') as HTMLInputElement;
const switchToCustom = () => fireEvent.click(screen.getByRole('radio', { name: text.newMcpAdd }));
const iconButton = (scope: Element | undefined, icon: string) => scope?.querySelector(`.semi-icon-${icon}`)?.closest('button') as HTMLButtonElement;

describe('MCPConfigure', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('渲染在容器中，包含语言包标题、模式切换和激活数量', () => {
        const { container } = render(MCPConfigure, { props: { customOptions, options, visible: true } });
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent(text.mcpConfigure);
        expect(screen.getByText(text.mcpServers)).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-mcp-configure-content-header-count')).toHaveTextContent(`${text.activeMCPNumber} 3/5`);
        expect(search(container)).toHaveAttribute('placeholder', text.searchPlaceholder);
    });

    it('类型：选项的 value 必填，它是 statusChange 匹配选项的标识', () => {
        expectTypeOf<{ label: string }>().not.toExtend<MCPConfigureOption>();
    });

    it('模式切换是以 MCP 配置命名的单选组', () => {
        render(MCPConfigure, { props: { options, visible: true } });
        const group = screen.getByRole('radiogroup', { name: text.mcpConfigure });
        expect(within(group).getByRole('radio', { name: text.mcpServers })).toBeChecked();
    });

    it('模式切换与标题随语言包切换', () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <MCPConfigure options={options} visible /> },
        });
        expect(ja_JP.Sidebar.mcpServers).not.toBe(text.mcpServers);
        expect(screen.getByRole('radio', { name: ja_JP.Sidebar.mcpServers })).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: ja_JP.Sidebar.mcpConfigure })).toBeInTheDocument();
    });

    it('title 和 placeholder 属性替换语言包文案', () => {
        const { container } = render(MCPConfigure, {
            props: { title: 'Servers', placeholder: 'Find', options, visible: true },
        });
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Servers');
        expect(search(container)).toHaveAttribute('placeholder', 'Find');
    });

    it('列出内层选项，包含图标、描述和按钮', () => {
        const { container } = render(MCPConfigure, { props: { options, visible: true } });
        expect(labels(container)).toEqual(['GitHub', 'Figma', 'Preset']);
        const [github, figma, preset] = items(container);
        const sign = github.querySelector('img.semi-sidebar-mcp-configure-content-item-sign');
        expect(sign).toHaveAttribute('src', 'https://semi.design/github.png');
        expect(sign).toHaveAttribute('alt', '');
        expect(github).toHaveTextContent('Code hosting');
        expect(github.querySelector('.semi-sidebar-mcp-configure-content-item-button-configure')).toBeNull();
        expect(figma.querySelector('.semi-sidebar-mcp-configure-content-item-button-configure')).toBeInTheDocument();
        expect(github.querySelector('.semi-icon-minus')).toBeInTheDocument();
        expect(figma.querySelector('.semi-icon-plus')).toBeInTheDocument();
        expect(iconButton(preset, 'minus')).toHaveAttribute('aria-disabled', 'true');
    });

    it('禁用项的状态按钮保持可聚焦，聚焦后 Tooltip 描述禁用原因，点击不改变状态', async () => {
        const onStatusChange = vi.fn<Emit<'statusChange'>>();
        const { container } = render(MCPConfigure, { props: { options, visible: true, onStatusChange } });
        const button = iconButton(items(container)[2], 'minus');
        expect(button).not.toBeDisabled();
        button.focus();
        expect(button).toHaveFocus();
        expect(button).toHaveAccessibleName(text.disable);
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent(text.defaultMcpInfo);
        await waitFor(() => expect(button).toHaveAttribute('aria-describedby', tooltip.id));
        expect(button).toHaveAccessibleDescription(text.defaultMcpInfo);
        await fireEvent.click(button);
        expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('从语言包读取纯图标按钮的名称', () => {
        const { container } = render(MCPConfigure, { props: { options, visible: true } });
        const [github, figma] = items(container).map((item) => within(item as HTMLElement));
        expect(github.getByRole('button', { name: text.disable })).toBeInTheDocument();
        expect(figma.getByRole('button', { name: text.enable })).toBeInTheDocument();
        expect(figma.getByRole('button', { name: text.configure })).toBeInTheDocument();
    });

    it('状态按钮报告已切换的选项，以及它们是否为自定义选项', async () => {
        const onStatusChange = vi.fn<Emit<'statusChange'>>();
        const onOptions = vi.fn<Emit<'update:options'>>();
        const onCustomOptions = vi.fn<Emit<'update:customOptions'>>();
        const { container } = render(MCPConfigure, {
            props: {
                customOptions,
                options,
                visible: true,
                onStatusChange,
                'onUpdate:options': onOptions,
                'onUpdate:customOptions': onCustomOptions,
            },
        });
        await fireEvent.click(iconButton(items(container)[1], 'plus'));
        const inner = [options[0], { ...options[1], active: true }, options[2]];
        expect(onStatusChange).toHaveBeenLastCalledWith(inner, false);
        expect(onOptions).toHaveBeenLastCalledWith(inner);
        expect(onCustomOptions).not.toHaveBeenCalled();

        await switchToCustom();
        await fireEvent.click(iconButton(items(container)[1], 'minus'));
        const custom = [customOptions[0], { ...customOptions[1], active: false }];
        expect(onStatusChange).toHaveBeenLastCalledWith(custom, true);
        expect(onCustomOptions).toHaveBeenLastCalledWith(custom);
    });

    it('v-model:options 跟随状态按钮，激活数量随之更新', async () => {
        const { container } = render(MCPModel);
        await fireEvent.click(iconButton(items(container)[1], 'plus'));
        expect(iconButton(items(container)[1], 'minus')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-mcp-configure-content-header-count')).toHaveTextContent('2/2');
    });

    it('单向绑定时不改动传入的选项', async () => {
        const own = options.map((option) => ({ ...option }));
        const { container } = render(MCPConfigure, { props: { options: own, visible: true } });
        await fireEvent.click(iconButton(items(container)[1], 'plus'));
        expect(own[1].active).toBeUndefined();
        expect(iconButton(items(container)[1], 'plus')).toBeInTheDocument();
    });

    it('配置按钮和编辑按钮报告对应选项', async () => {
        const onConfigureClick = vi.fn<Emit<'configureClick'>>();
        const onEditClick = vi.fn<Emit<'editClick'>>();
        const { container } = render(MCPConfigure, {
            props: { customOptions, options, visible: true, onConfigureClick, onEditClick },
        });
        await fireEvent.click(iconButton(container, 'setting'));
        expect(onConfigureClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), options[1]);

        await switchToCustom();
        expect(labels(container)).toEqual(['Mine', 'Other']);
        await fireEvent.click(iconButton(items(container)[0], 'edit'));
        expect(onEditClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), customOptions[0]);
    });

    it('自定义模式下没有自定义选项时显示空状态，其按钮发出 addClick', async () => {
        const onAddClick = vi.fn<Emit<'addClick'>>();
        const { container } = render(MCPConfigure, { props: { options, visible: true, onAddClick } });
        await switchToCustom();
        expect(screen.getByText(text.emptyCustomMcpInfo)).toBeInTheDocument();
        expect(items(container)).toEqual([]);
        await fireEvent.click(container.querySelector('.semi-sidebar-mcp-configure-content-custom-empty button') as Element);
        expect(onAddClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('自定义模式下有自定义选项时显示搜索框和添加按钮', async () => {
        const onAddClick = vi.fn<Emit<'addClick'>>();
        const { container } = render(MCPConfigure, { props: { customOptions, options, visible: true, onAddClick } });
        await switchToCustom();
        const bar = container.querySelector('.semi-sidebar-mcp-configure-content-search-container');
        expect(bar?.querySelector('input')).toBeInTheDocument();
        await fireEvent.click(bar?.querySelector('button') as Element);
        expect(onAddClick).toHaveBeenCalledTimes(1);
    });

    it('内层模式的搜索框不包额外元素', () => {
        const { container } = render(MCPConfigure, { props: { options, visible: true } });
        const header = container.querySelector('.semi-sidebar-mcp-configure-content-header');
        expect(header?.nextElementSibling).toHaveClass('semi-sidebar-mcp-configure-content-search');
    });

    it('搜索按 label 和 description 过滤，不区分大小写，节流 300ms', async () => {
        vi.useFakeTimers();
        const { container } = render(MCPConfigure, { props: { options, visible: true } });
        await fireEvent.update(search(container), 'g');
        expect(search(container)).toHaveValue('g');
        expect(labels(container)).toEqual(['GitHub', 'Figma']);

        await fireEvent.update(search(container), 'DESIGN');
        expect(labels(container)).toEqual(['GitHub', 'Figma']);
        vi.advanceTimersByTime(300);
        await nextTick();
        expect(labels(container)).toEqual(['Figma']);

        vi.advanceTimersByTime(300);
        await fireEvent.update(search(container), '');
        expect(labels(container)).toEqual(['GitHub', 'Figma', 'Preset']);
    });

    it('search 报告输入内容，以及是否搜索自定义列表', async () => {
        const onSearch = vi.fn<Emit<'search'>>();
        const { container } = render(MCPConfigure, { props: { customOptions, options, visible: true, onSearch } });
        await fireEvent.update(search(container), 'git');
        expect(onSearch).toHaveBeenLastCalledWith('git', false);
        await switchToCustom();
        await fireEvent.update(search(container), 'mi');
        expect(onSearch).toHaveBeenLastCalledWith('mi', true);
    });

    it('切换模式保留搜索文本，并过滤另一个列表', async () => {
        vi.useFakeTimers();
        const { container } = render(MCPConfigure, { props: { customOptions, options, visible: true } });
        await fireEvent.update(search(container), 'other');
        vi.advanceTimersByTime(300);
        await switchToCustom();
        vi.advanceTimersByTime(300);
        await nextTick();
        expect(search(container)).toHaveValue('other');
        expect(labels(container)).toEqual(['Other']);
    });

    it('搜索后立即切换模式，列表随模式同步更新而不等节流窗口', async () => {
        vi.useFakeTimers();
        const { container } = render(MCPConfigure, { props: { customOptions, options, visible: true } });
        await fireEvent.update(search(container), 'o');
        // a second keystroke inside the window leaves a trailing search pending
        await fireEvent.update(search(container), 'other');
        await switchToCustom();
        expect(labels(container)).toEqual(['Other']);
        vi.advanceTimersByTime(300);
        await nextTick();
        expect(labels(container)).toEqual(['Other']);
    });

    it('自定义过滤函数接收转为小写的输入和选项', async () => {
        vi.useFakeTimers();
        const filter = vi.fn<(value: string, option: MCPConfigureOption) => boolean>((value, option) => Boolean(option.value?.startsWith(value)));
        const { container } = render(MCPConfigure, { props: { filter, options, visible: true } });
        await fireEvent.update(search(container), 'FI');
        expect(filter).toHaveBeenCalledWith('fi', options[0]);
        expect(labels(container)).toEqual(['Figma']);
    });

    it('filter 属性变化后，列表按新的过滤函数重新计算', async () => {
        vi.useFakeTimers();
        const byValue = (value: string, option: MCPConfigureOption) => option.value.startsWith(value);
        const byLabelEnd = (value: string, option: MCPConfigureOption) => String(option.label).toLowerCase().endsWith(value);
        const { container, ...view } = render(MCPConfigure, { props: { filter: byValue, options, visible: true } });
        await fireEvent.update(search(container), 'f');
        expect(labels(container)).toEqual(['Figma']);
        await view.rerender({ filter: byLabelEnd });
        expect(labels(container)).toEqual([]);
    });

    it('全局 Input 默认值不给搜索框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(MCPConfigure, { props: { options, visible: true } });
        await fireEvent.update(search(container), 'git');
        expect(search(container).closest('.semi-input-wrapper')?.querySelector('.semi-input-clearbtn')).toBeNull();
    });

    it('未传 filter 时读取全局默认的过滤函数', async () => {
        const filter = vi.fn<(value: string, option: MCPConfigureOption) => boolean>((_value, option) => option.value === 'preset');
        semiGlobal.config.overrideDefaultProps = { MCPConfigure: { filter } };
        const { container } = render(MCPConfigure, { props: { options, visible: true } });
        await fireEvent.update(search(container), 'x');
        expect(labels(container)).toEqual(['Preset']);
    });

    it('新增选项立即按当前搜索内容过滤', async () => {
        vi.useFakeTimers();
        const { container, ...view } = render(MCPConfigure, { props: { options, visible: true } });
        await fireEvent.update(search(container), 'tool');
        expect(labels(container)).toEqual(['Figma']);
        await view.rerender({ options: [...options, { label: 'Tooling', value: 'tooling' }] });
        expect(labels(container)).toEqual(['Figma', 'Tooling']);
    });

    it('自定义模式下新增的自定义选项立即显示', async () => {
        const { container, ...view } = render(MCPConfigure, { props: { customOptions, options, visible: true } });
        await switchToCustom();
        await view.rerender({ customOptions: [...customOptions, { label: 'Third', value: 'third' }] });
        expect(labels(container)).toEqual(['Mine', 'Other', 'Third']);
    });

    it('#item 替换内置项，并能获取当前模式', async () => {
        const item = vi.fn<(props: MCPConfigureItemSlotProps) => VNode>(({ item, custom }) => <div class="my-item">{`${item.label}:${custom}`}</div>);
        const { container } = render(MCPConfigure, {
            props: { customOptions, options, visible: true },
            slots: { item },
        });
        expect([...container.querySelectorAll('.my-item')].map((n) => n.textContent)).toEqual(['GitHub:false', 'Figma:false', 'Preset:false']);
        expect(item).toHaveBeenCalledWith({ item: options[1], index: 1, custom: false });
        await switchToCustom();
        expect([...container.querySelectorAll('.my-item')].map((n) => n.textContent)).toEqual(['Mine:true', 'Other:true']);
        expect(items(container)).toEqual([]);
    });

    it('#icon 与 #desc 替换图标和描述，参数带当前模式', () => {
        const { container } = render(MCPConfigure, {
            props: { options, visible: true },
            slots: {
                icon: ({ index }: MCPConfigureItemSlotProps) => <i class="my-icon">{`${index}`}</i>,
                desc: ({ item, custom }: MCPConfigureItemSlotProps) => <b>{`${item.value}:${custom}`}</b>,
            },
        });
        const [github] = items(container);
        expect(github.querySelector('img')).toBeNull();
        expect(github.querySelector('.semi-sidebar-mcp-configure-content-item-sign .my-icon')).toHaveTextContent('0');
        expect(github.querySelector('.semi-sidebar-mcp-configure-content-item-content-desc')).toHaveTextContent('github:false');
    });

    it('容器属性透传：class、cancel 和 resizable', async () => {
        const onCancel = vi.fn<Emit<'cancel'>>();
        const { container } = render(MCPConfigure, {
            props: { options, resizable: false, visible: true, onCancel },
            attrs: { class: 'custom' },
        });
        expect(container.querySelector('.semi-sidebar-container')).toHaveClass('custom');
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
    });

    it('#header 替换容器头部，内容为空时回退默认头部', () => {
        const { container } = render(MCPConfigure, {
            props: { options, visible: true },
            slots: { header: () => <div class="mcp-header">h</div> },
        });
        expect(container.querySelector('.mcp-header')).toBeInTheDocument();
        const empty = render(MCPConfigure, { props: { options, visible: true }, slots: { header: () => [] } });
        expect(empty.container.querySelector('.semi-sidebar-container-header')).toBeInTheDocument();
    });
});
