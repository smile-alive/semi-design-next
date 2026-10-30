import { createRawSnippet, tick } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import { MCPConfigure } from '../index';
import type { MCPConfigureOption, MCPConfigureProps } from '../mcp-configure/interface';
import BindHost, { type BindHostStore } from './bind-host.svelte';
import LocaleHost from './locale-host.svelte';

const prefix = 'semi-sidebar-mcp-configure-content';
const text = zh_CN.Sidebar;
const innerOptions: MCPConfigureOption[] = [
    { label: '搜索', value: 'search', desc: '联网搜索', active: true },
    { label: '地图', value: 'map', desc: '地点查询', configure: true },
    { label: '预设', value: 'preset', desc: '不可关闭', active: true, disabled: true },
];
const customOptions: MCPConfigureOption[] = [{ label: '我的', value: 'mine', desc: '自建服务', icon: 'https://example.com/icon.png' }];
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const labels = () => [...document.querySelectorAll(`.${prefix}-item-content-label`)].map((node) => node.textContent);
const search = () => screen.getByRole('textbox') as HTMLInputElement;
const switchToCustom = () => fireEvent.click(screen.getByText(text.newMcpAdd, { selector: 'label *, label' }));

function setup(props: MCPConfigureProps = {}) {
    return render(MCPConfigure, { props: { visible: true, motion: false, options: innerOptions, customOptions, ...props } });
}

function bound(initial: Partial<BindHostStore> = {}) {
    const store = createStore<BindHostStore>({ kind: 'mcp', visible: true, options: structuredClone(innerOptions), customOptions: structuredClone(customOptions), log: [], ...initial });
    render(BindHost, { props: { store } });
    return store;
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    document.body.innerHTML = '';
    vi.useRealTimers();
});

describe('Svelte MCPConfigure', () => {
    it('渲染默认标题、模式切换、已启用计数与列表', () => {
        setup();
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent(text.mcpConfigure);
        expect(screen.getByRole('radiogroup', { name: text.mcpConfigure })).toBeInTheDocument();
        expect($(`.${prefix}-header-count`)).toHaveTextContent(`${text.activeMCPNumber} 2/4`);
        expect(labels()).toEqual(['搜索', '地图', '预设']);
        expect(document.body).toHaveTextContent('联网搜索');
    });

    it('点击启用或停用按钮，调用 onStatusChange 并更新绑定的 options', async () => {
        const store = bound();
        await fireEvent.click(screen.getAllByRole('button', { name: text.enable })[0]);
        expect(store.log).toEqual(['status false']);
        expect(store.options?.find((option) => option.value === 'map')?.active).toBe(true);
        expect(screen.queryByRole('button', { name: text.enable })).toBeNull();
        await fireEvent.click(screen.getAllByRole('button', { name: text.disable })[0]);
        expect(store.options?.find((option) => option.value === 'search')?.active).toBe(false);
    });

    it('未绑定 options 时也会就地切换状态', async () => {
        const onStatusChange = vi.fn<NonNullable<MCPConfigureProps['onStatusChange']>>();
        setup({ onStatusChange });
        await fireEvent.click(screen.getByRole('button', { name: text.enable }));
        expect(onStatusChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ value: 'map', active: true })]), false);
        expect($(`.${prefix}-header-count`)).toHaveTextContent('3/4');
    });

    it('预设项的按钮是 aria-disabled 而不是 disabled，点击无效且仍可聚焦', async () => {
        const onStatusChange = vi.fn<NonNullable<MCPConfigureProps['onStatusChange']>>();
        setup({ onStatusChange });
        const preset = [...document.querySelectorAll<HTMLElement>(`.${prefix}-item`)][2].querySelector('button[aria-disabled="true"]') as HTMLButtonElement;
        expect(preset).not.toBeNull();
        expect(preset).not.toBeDisabled();
        preset.focus();
        expect(document.activeElement).toBe(preset);
        await fireEvent.click(preset);
        expect(onStatusChange).not.toHaveBeenCalled();
        expect(await screen.findByText(text.defaultMcpInfo)).toBeInTheDocument();
    });

    it('configure 与 edit 按钮触发各自的回调', async () => {
        const onConfigureClick = vi.fn<NonNullable<MCPConfigureProps['onConfigureClick']>>();
        const onEditClick = vi.fn<NonNullable<MCPConfigureProps['onEditClick']>>();
        setup({ onConfigureClick, onEditClick });
        await fireEvent.click(screen.getByRole('button', { name: text.configure }));
        expect(onConfigureClick).toHaveBeenCalledWith(expect.any(MouseEvent), expect.objectContaining({ value: 'map' }));
        await switchToCustom();
        await fireEvent.click(screen.getByRole('button', { name: text.edit }));
        expect(onEditClick).toHaveBeenCalledWith(expect.any(MouseEvent), expect.objectContaining({ value: 'mine' }));
    });

    it('切到自定义模式只列出自定义项，并显示 icon 图片', async () => {
        setup();
        await switchToCustom();
        expect(labels()).toEqual(['我的']);
        expect($(`.${prefix}-item-sign`)).toHaveAttribute('src', 'https://example.com/icon.png');
        expect(screen.getByRole('button', { name: text.newMcpAdd })).toBeInTheDocument();
    });

    it('自定义列表为空时显示空状态与添加按钮，点击触发 onAddClick', async () => {
        const onAddClick = vi.fn<NonNullable<MCPConfigureProps['onAddClick']>>();
        setup({ customOptions: [], onAddClick });
        await switchToCustom();
        expect($(`.${prefix}-custom-empty`)).toHaveTextContent(text.emptyCustomMcpInfo);
        await fireEvent.click(screen.getByRole('button', { name: text.newMcpAdd }));
        expect(onAddClick).toHaveBeenCalledTimes(1);
    });

    it('搜索按标签或描述过滤，并触发 onSearch', async () => {
        const onSearch = vi.fn<NonNullable<MCPConfigureProps['onSearch']>>();
        setup({ onSearch });
        await fireEvent.input(search(), { target: { value: '地' } });
        expect(onSearch).toHaveBeenCalledWith('地', false);
        await waitFor(() => expect(labels()).toEqual(['地图']));
        await fireEvent.input(search(), { target: { value: '联网' } });
        await waitFor(() => expect(labels()).toEqual(['搜索']));
    });

    it('自定义 filter 取代默认过滤', async () => {
        setup({ filter: (_value, option) => option.value === 'preset' });
        await fireEvent.input(search(), { target: { value: 'x' } });
        await waitFor(() => expect(labels()).toEqual(['预设']));
    });

    it('placeholder 覆盖搜索框的默认占位', () => {
        setup({ placeholder: '找一找' });
        expect(search()).toHaveAttribute('placeholder', '找一找');
    });

    it('icon、desc 与 item snippet', () => {
        setup({
            icon: createRawSnippet<[{ item: MCPConfigureOption }]>((args) => ({ render: () => `<i class="ic">${args().item.value}</i>` })),
            desc: createRawSnippet<[{ item: MCPConfigureOption }]>((args) => ({ render: () => `<u class="ds">${args().item.label}</u>` })),
        });
        expect(document.querySelectorAll('.ic')).toHaveLength(3);
        expect($('.ds')).toHaveTextContent('搜索');
        document.body.innerHTML = '';
        setup({ item: createRawSnippet<[{ item: MCPConfigureOption; custom: boolean }]>((args) => ({ render: () => `<p class="row">${args().item.value}:${args().custom}</p>` })) });
        expect([...document.querySelectorAll('.row')].map((node) => node.textContent)).toEqual(['search:false', 'map:false', 'preset:false']);
        expect($(`.${prefix}-item`)).toBeNull();
    });

    it('全局默认值生效', () => {
        semiGlobal.config.overrideDefaultProps = { MCPConfigure: { title: '全局 MCP' } };
        setup();
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent('全局 MCP');
    });

    it('默认标题随语言包变化', () => {
        render(LocaleHost, { props: { locale: ja_JP, kind: 'mcp' } });
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent(ja_JP.Sidebar.mcpConfigure);
    });
});

const vOptions: MCPConfigureOption[] = [
    { label: 'GitHub', value: 'github', desc: 'Code hosting', icon: 'https://semi.design/github.png', active: true },
    { label: 'Figma', value: 'figma', desc: 'Design tool', configure: true },
    { label: 'Preset', value: 'preset', desc: 'Built in', active: true, disabled: true },
];
const vCustom: MCPConfigureOption[] = [
    { label: 'Mine', value: 'mine', desc: 'My server' },
    { label: 'Other', value: 'other', desc: 'Another one', active: true },
];
const items = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-item`)];
const iconButton = (scope: Element | undefined, icon: string) => scope?.querySelector(`.semi-icon-${icon}`)?.closest('button') as HTMLButtonElement;
const type = (value: string) => fireEvent.input(search(), { target: { value } });
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe('Svelte MCPConfigure 列表与状态', () => {
    it('渲染计数与搜索框占位', () => {
        setup({ options: vOptions, customOptions: vCustom });
        expect($(`.${prefix}-header-count`)).toHaveTextContent(`${text.activeMCPNumber} 3/5`);
        expect(search()).toHaveAttribute('placeholder', text.searchPlaceholder);
    });

    it('模式切换是以 MCP 配置命名的单选组，默认选中内置列表', () => {
        setup({ options: vOptions });
        expect(within(screen.getByRole('radiogroup', { name: text.mcpConfigure })).getByRole('radio', { name: text.mcpServers })).toBeChecked();
    });

    it('模式切换随语言包切换', () => {
        render(LocaleHost, { props: { locale: ja_JP, kind: 'mcp' } });
        expect(ja_JP.Sidebar.mcpServers).not.toBe(text.mcpServers);
        expect(screen.getByRole('radio', { name: ja_JP.Sidebar.mcpServers })).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: ja_JP.Sidebar.mcpConfigure })).toBeInTheDocument();
    });

    it('title 与 placeholder 属性替换语言包文案', () => {
        setup({ title: 'Servers', placeholder: 'Find', options: vOptions });
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent('Servers');
        expect(search()).toHaveAttribute('placeholder', 'Find');
    });

    it('列出内层选项，包含图标、描述和按钮', () => {
        setup({ options: vOptions });
        expect(labels()).toEqual(['GitHub', 'Figma', 'Preset']);
        const [github, figma, preset] = items();
        const sign = github.querySelector(`img.${prefix}-item-sign`);
        expect(sign).toHaveAttribute('src', 'https://semi.design/github.png');
        expect(sign).toHaveAttribute('alt', '');
        expect(github).toHaveTextContent('Code hosting');
        expect(github.querySelector(`.${prefix}-item-button-configure`)).toBeNull();
        expect(figma.querySelector(`.${prefix}-item-button-configure`)).toBeInTheDocument();
        expect(github.querySelector('.semi-icon-minus')).toBeInTheDocument();
        expect(figma.querySelector('.semi-icon-plus')).toBeInTheDocument();
        expect(iconButton(preset, 'minus')).toHaveAttribute('aria-disabled', 'true');
    });

    it('禁用项的状态按钮保持可聚焦，聚焦后 Tooltip 描述禁用原因，点击不改变状态', async () => {
        const onStatusChange = vi.fn<NonNullable<MCPConfigureProps['onStatusChange']>>();
        setup({ options: vOptions, onStatusChange });
        const button = iconButton(items()[2], 'minus');
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
        setup({ options: vOptions });
        const [github, figma] = items().map((item) => within(item));
        expect(github.getByRole('button', { name: text.disable })).toBeInTheDocument();
        expect(figma.getByRole('button', { name: text.enable })).toBeInTheDocument();
        expect(figma.getByRole('button', { name: text.configure })).toBeInTheDocument();
    });

    it('状态按钮报告已切换的选项，以及它们是否为自定义选项', async () => {
        const onStatusChange = vi.fn<NonNullable<MCPConfigureProps['onStatusChange']>>();
        setup({ options: vOptions, customOptions: vCustom, onStatusChange });
        await fireEvent.click(iconButton(items()[1], 'plus'));
        expect(onStatusChange).toHaveBeenLastCalledWith([vOptions[0], { ...vOptions[1], active: true }, vOptions[2]], false);
        await switchToCustom();
        await fireEvent.click(iconButton(items()[1], 'minus'));
        expect(onStatusChange).toHaveBeenLastCalledWith([vCustom[0], { ...vCustom[1], active: false }], true);
    });

    it('bind:options 与 bind:customOptions 跟随状态按钮', async () => {
        const store = bound({ options: plain(vOptions), customOptions: plain(vCustom) });
        await fireEvent.click(iconButton(items()[1], 'plus'));
        expect(plain(store.options)).toEqual([vOptions[0], { ...vOptions[1], active: true }, vOptions[2]]);
        expect(plain(store.customOptions)).toEqual(vCustom);
        await switchToCustom();
        await fireEvent.click(iconButton(items()[1], 'minus'));
        expect(plain(store.customOptions)).toEqual([vCustom[0], { ...vCustom[1], active: false }]);
        expect(store.log).toEqual(['status false', 'status true']);
    });

    it('bind:options 后激活数量随之更新', async () => {
        bound({
            options: [
                { label: 'GitHub', value: 'github', active: true },
                { label: 'Figma', value: 'figma' },
            ],
            customOptions: undefined,
        });
        await fireEvent.click(iconButton(items()[1], 'plus'));
        expect(iconButton(items()[1], 'minus')).toBeInTheDocument();
        expect($(`.${prefix}-header-count`)).toHaveTextContent('2/2');
    });

    it('单向传入时不改动传入的选项', async () => {
        const own = vOptions.map((option) => ({ ...option }));
        setup({ options: own });
        await fireEvent.click(iconButton(items()[1], 'plus'));
        expect(own[1].active).toBeUndefined();
    });

    it('配置按钮和编辑按钮报告对应选项', async () => {
        const onConfigureClick = vi.fn<NonNullable<MCPConfigureProps['onConfigureClick']>>();
        const onEditClick = vi.fn<NonNullable<MCPConfigureProps['onEditClick']>>();
        setup({ options: vOptions, customOptions: vCustom, onConfigureClick, onEditClick });
        await fireEvent.click(iconButton(document.body, 'setting'));
        expect(onConfigureClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), vOptions[1]);
        await switchToCustom();
        expect(labels()).toEqual(['Mine', 'Other']);
        await fireEvent.click(iconButton(items()[0], 'edit'));
        expect(onEditClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), vCustom[0]);
    });

    it('自定义模式下没有自定义选项时显示空状态，其按钮触发 onAddClick', async () => {
        const onAddClick = vi.fn<NonNullable<MCPConfigureProps['onAddClick']>>();
        setup({ options: vOptions, customOptions: undefined, onAddClick });
        await switchToCustom();
        expect(screen.getByText(text.emptyCustomMcpInfo)).toBeInTheDocument();
        expect(items()).toEqual([]);
        await fireEvent.click($(`.${prefix}-custom-empty button`) as Element);
        expect(onAddClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('自定义模式下有自定义选项时显示搜索框和添加按钮', async () => {
        const onAddClick = vi.fn<NonNullable<MCPConfigureProps['onAddClick']>>();
        setup({ options: vOptions, customOptions: vCustom, onAddClick });
        await switchToCustom();
        const bar = $(`.${prefix}-search-container`);
        expect(bar?.querySelector('input')).toBeInTheDocument();
        await fireEvent.click(bar?.querySelector('button') as Element);
        expect(onAddClick).toHaveBeenCalledTimes(1);
    });

    it('内层模式的搜索框紧跟头部，不包额外元素', () => {
        setup({ options: vOptions });
        expect($(`.${prefix}-header`)?.nextElementSibling).toHaveClass(`${prefix}-search`);
    });

    it('容器属性透传：class、onCancel 与 resizable', async () => {
        const onCancel = vi.fn<NonNullable<MCPConfigureProps['onCancel']>>();
        setup({ options: vOptions, resizable: false, class: 'custom', onCancel });
        expect($('.semi-sidebar-container')).toHaveClass('custom');
        await fireEvent.click(screen.getByRole('button', { name: text.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect($('.semi-resizable-resizable')).toBeNull();
    });

    it('item snippet 替换内置项，并能获取当前模式', async () => {
        const item = createRawSnippet<[{ item: MCPConfigureOption; custom: boolean; index: number }]>((args) => ({ render: () => `<div class="my-item">${args().item.label}:${args().custom}:${args().index}</div>` }));
        setup({ options: vOptions, customOptions: vCustom, item });
        expect([...document.querySelectorAll('.my-item')].map((node) => node.textContent)).toEqual(['GitHub:false:0', 'Figma:false:1', 'Preset:false:2']);
        await switchToCustom();
        expect([...document.querySelectorAll('.my-item')].map((node) => node.textContent)).toEqual(['Mine:true:0', 'Other:true:1']);
        expect(items()).toEqual([]);
    });

    it('icon 与 desc snippet 替换图标和描述，参数带当前模式', () => {
        setup({
            options: vOptions,
            icon: createRawSnippet<[{ index: number }]>((args) => ({ render: () => `<i class="my-icon">${args().index}</i>` })),
            desc: createRawSnippet<[{ item: MCPConfigureOption; custom: boolean }]>((args) => ({ render: () => `<b>${args().item.value}:${args().custom}</b>` })),
        });
        const [github] = items();
        expect(github.querySelector('img')).toBeNull();
        expect(github.querySelector(`.${prefix}-item-sign .my-icon`)).toHaveTextContent('0');
        expect(github.querySelector(`.${prefix}-item-content-desc`)).toHaveTextContent('github:false');
    });

    it('类型：选项的 value 必填', () => {
        expectTypeOf<{ label: string }>().not.toExtend<MCPConfigureOption>();
    });
});

describe('Svelte MCPConfigure 搜索', () => {
    it('按 label 和 description 过滤，不区分大小写，节流 300ms', async () => {
        vi.useFakeTimers();
        setup({ options: vOptions });
        await type('g');
        expect(search()).toHaveValue('g');
        expect(labels()).toEqual(['GitHub', 'Figma']);

        await type('DESIGN');
        expect(labels()).toEqual(['GitHub', 'Figma']);
        vi.advanceTimersByTime(300);
        await tick();
        expect(labels()).toEqual(['Figma']);

        vi.advanceTimersByTime(300);
        await type('');
        expect(labels()).toEqual(['GitHub', 'Figma', 'Preset']);
    });

    it('onSearch 报告输入内容，以及是否搜索自定义列表', async () => {
        const onSearch = vi.fn<NonNullable<MCPConfigureProps['onSearch']>>();
        setup({ options: vOptions, customOptions: vCustom, onSearch });
        await type('git');
        expect(onSearch).toHaveBeenLastCalledWith('git', false);
        await switchToCustom();
        await type('mi');
        expect(onSearch).toHaveBeenLastCalledWith('mi', true);
    });

    it('切换模式保留搜索文本，并过滤另一个列表', async () => {
        vi.useFakeTimers();
        setup({ options: vOptions, customOptions: vCustom });
        await type('other');
        vi.advanceTimersByTime(300);
        await switchToCustom();
        vi.advanceTimersByTime(300);
        await tick();
        expect(search()).toHaveValue('other');
        expect(labels()).toEqual(['Other']);
    });

    it('搜索后立即切换模式，列表随模式同步更新而不等节流窗口', async () => {
        vi.useFakeTimers();
        setup({ options: vOptions, customOptions: vCustom });
        await type('o');
        // a second keystroke inside the window leaves a trailing search pending
        await type('other');
        await switchToCustom();
        expect(labels()).toEqual(['Other']);
        vi.advanceTimersByTime(300);
        await tick();
        expect(labels()).toEqual(['Other']);
    });

    it('自定义过滤函数接收转为小写的输入和选项', async () => {
        vi.useFakeTimers();
        const filter = vi.fn<NonNullable<MCPConfigureProps['filter']>>((value, option) => Boolean(option.value?.startsWith(value)));
        setup({ options: vOptions, filter });
        await type('FI');
        expect(filter).toHaveBeenCalledWith('fi', vOptions[0]);
        expect(labels()).toEqual(['Figma']);
    });

    it('filter 变化后，列表按新的过滤函数重新计算', async () => {
        vi.useFakeTimers();
        const byValue = (value: string, option: MCPConfigureOption) => option.value.startsWith(value);
        const byLabelEnd = (value: string, option: MCPConfigureOption) => String(option.label).toLowerCase().endsWith(value);
        const view = setup({ options: vOptions, filter: byValue });
        await type('f');
        expect(labels()).toEqual(['Figma']);
        await view.rerender({ filter: byLabelEnd });
        expect(labels()).toEqual([]);
    });

    it('全局 Input 默认值不给搜索框加清除按钮', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        setup({ options: vOptions });
        await type('git');
        expect(search().closest('.semi-input-wrapper')?.querySelector('.semi-input-clearbtn')).toBeNull();
    });

    it('未传 filter 时读取全局默认的过滤函数', async () => {
        const filter = vi.fn<NonNullable<MCPConfigureProps['filter']>>((_value, option) => option.value === 'preset');
        semiGlobal.config.overrideDefaultProps = { MCPConfigure: { filter } };
        setup({ options: vOptions });
        await type('x');
        expect(labels()).toEqual(['Preset']);
    });

    it('新增选项立即按当前搜索内容过滤', async () => {
        vi.useFakeTimers();
        const view = setup({ options: vOptions });
        await type('tool');
        expect(labels()).toEqual(['Figma']);
        await view.rerender({ options: [...vOptions, { label: 'Tooling', value: 'tooling' }] });
        expect(labels()).toEqual(['Figma', 'Tooling']);
    });

    it('自定义模式下新增的自定义选项立即显示', async () => {
        const view = setup({ options: vOptions, customOptions: vCustom });
        await switchToCustom();
        await view.rerender({ customOptions: [...vCustom, { label: 'Third', value: 'third' }] });
        expect(labels()).toEqual(['Mine', 'Other', 'Third']);
    });
});
