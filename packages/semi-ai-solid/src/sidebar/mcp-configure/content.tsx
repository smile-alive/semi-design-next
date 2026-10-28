import { type Accessor, type JSX, Index, Show, createMemo } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import MCPConfigureContentFoundation, { type MCPConfigureContentAdapter, type MCPConfigureContentProps, type MCPConfigureContentState, type MCPOption } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
import { getShowOptions } from '@fibrae/semi-ai-foundation/sidebar/utils';
import { cssClasses as buttonClasses } from '@fibrae/semi-foundation/button/constants';
import { IconEdit, IconMinus, IconPlus, IconSearch, IconSetting } from '@fibrae/semi-icons-solid';
import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-solid';
import useFoundation from '@fibrae/semi-ui-solid/_base/use-foundation';
import Button from '@fibrae/semi-ui-solid/button/index';
import Empty from '@fibrae/semi-ui-solid/empty/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Input from '@fibrae/semi-ui-solid/input/index';
import Radio, { RadioGroup } from '@fibrae/semi-ui-solid/radio/index';
import Tooltip from '@fibrae/semi-ui-solid/tooltip/index';

const prefixCls = cssClasses.MCP_CONFIGURE_CONTENT;
const buttonCls = buttonClasses.PREFIX;
const illustrationStyle = { width: '150px', height: '150px' };

export interface MCPSolidOption extends MCPOption {
    /** Image URL; other content goes through `renderIcon` */
    icon?: string;
    /** Plain text, which the built-in filter searches with the label; other content goes through `renderDesc` */
    desc?: string;
}

export interface MCPRenderItemProps {
    option: MCPSolidOption;
    /** Whether the custom list is shown */
    custom: boolean;
}

export interface MCPConfigureContentSolidProps extends Omit<MCPConfigureContentProps, 'className' | 'style' | 'options' | 'customOptions' | 'filter' | 'onStatusChange' | 'onAddClick' | 'onConfigureClick' | 'onEditClick' | 'renderItem'> {
    class?: string;
    style?: JSX.CSSProperties | string;
    options?: MCPSolidOption[];
    customOptions?: MCPSolidOption[];
    filter?: (inputValue: string, option: MCPSolidOption) => boolean;
    onStatusChange?: (options: MCPSolidOption[], custom: boolean) => void;
    onAddClick?: (e: MouseEvent) => void;
    onConfigureClick?: (e: MouseEvent, option: MCPSolidOption) => void;
    onEditClick?: (e: MouseEvent, option: MCPSolidOption) => void;
    renderIcon?: (props: MCPRenderItemProps) => JSX.Element;
    renderDesc?: (props: MCPRenderItemProps) => JSX.Element;
    /** Replaces the whole built-in row */
    renderItem?: (props: MCPRenderItemProps) => JSX.Element;
}

export default function MCPConfigureContent(props: MCPConfigureContentSolidProps) {
    const locale = useLocale('Sidebar');

    const { foundation, state } = useFoundation<MCPConfigureContentFoundation<MouseEvent>, MCPConfigureContentAdapter<MouseEvent>, MCPConfigureContentProps, MCPConfigureContentState>(
        MCPConfigureContentFoundation,
        props as MCPConfigureContentProps,
        () => ({ mode: strings.MCP_MODE.INNER, inputValue: '', query: '' }),
        () => ({
            notifyConfigureClick: (e, option) => props.onConfigureClick?.(e, option),
            notifyEditClick: (e, option) => props.onEditClick?.(e, option),
            notifyStatusChange: (options, custom) => props.onStatusChange?.(options, custom),
            notifyAddClick: (e) => props.onAddClick?.(e),
            notifySearch: (inputValue, custom) => props.onSearch?.(inputValue, custom),
        })
    );

    const showOptions = createMemo(() => getShowOptions(props, state().mode, state().query));

    const text = () => locale().locale;

    const isCustom = () => state().mode === strings.MCP_MODE.CUSTOM;

    const options = () => props.options ?? [];

    const customOptions = () => props.customOptions ?? [];

    const activatedCount = () => options().filter((option) => option.active).length + customOptions().filter((option) => option.active).length;

    // the adornments and showClear are set so global Input defaults cannot add them around the search icon
    const searchInput = () => (
        <Input class={isCustom() ? undefined : `${prefixCls}-search`} placeholder={props.placeholder ?? text().searchPlaceholder} value={state().inputValue} addonAfter={null} addonBefore={null} showClear={false} prefix={<IconSearch />} suffix={null} onChange={(value) => foundation.handleSearch(value)} />
    );

    const addButton = () => (
        <Button type="primary" theme="solid" icon={<IconPlus />} onClick={(e) => foundation.handleAddClick(e)}>
            {text().newMcpAdd}
        </Button>
    );

    const statusButton = (option: Accessor<MCPSolidOption>) => {
        const label = () => (option().active ? text().disable : text().enable);
        const theme = () => (option().active ? 'light' : 'solid');
        const icon = () => (option().active ? <IconMinus /> : <IconPlus />);
        return (
            <Show when={option().disabled} fallback={<Button type="primary" class={`${prefixCls}-item-button`} aria-label={label()} theme={theme()} icon={icon()} onClick={() => foundation.handleStatusChange(option(), !option().active)} />}>
                {/* Keeps a focusable trigger so the tooltip reason reaches the keyboard; Button's native disabled leaves the
                    Tab order. Styled as a disabled primary icon-only Button; no click handler since the status cannot change. */}
                <Tooltip content={text().defaultMcpInfo}>
                    {(getTriggerProps) => (
                        <button {...getTriggerProps({ type: 'button' })} class={clsx(buttonCls, `${buttonCls}-${theme()}`, `${buttonCls}-disabled`, `${buttonCls}-primary-disabled`, `${buttonCls}-with-icon`, `${buttonCls}-with-icon-only`, `${prefixCls}-item-button`)} aria-disabled="true" aria-label={label()}>
                            <span class={`${buttonCls}-content`}>{icon()}</span>
                        </button>
                    )}
                </Tooltip>
            </Show>
        );
    };

    // the render calls sit in JSX expressions, so they run again with the row's new option or mode
    const optionItem = (option: Accessor<MCPSolidOption>, renderArgs: Accessor<MCPRenderItemProps>) => (
        <div class={`${prefixCls}-item`}>
            <Show
                when={props.renderIcon}
                keyed
                fallback={
                    <Show when={option().icon} fallback={<div class={`${prefixCls}-item-sign`} />}>
                        {(src) => <img class={`${prefixCls}-item-sign`} alt="" src={src()} />}
                    </Show>
                }
            >
                {(render) => <div class={`${prefixCls}-item-sign`}>{render(renderArgs())}</div>}
            </Show>
            <div class={`${prefixCls}-item-content`}>
                <div class={`${prefixCls}-item-content-label`}>{option().label}</div>
                <div class={`${prefixCls}-item-content-desc`}>{props.renderDesc ? props.renderDesc(renderArgs()) : option().desc}</div>
            </div>
            <Show when={option().configure}>
                <Button class={`${prefixCls}-item-button ${prefixCls}-item-button-configure`} aria-label={text().configure} icon={<IconSetting />} onClick={(e) => foundation.onConfigureButtonClick(e, option())} />
            </Show>
            <Show when={isCustom()}>
                <Button class={`${prefixCls}-item-button ${prefixCls}-item-button-configure`} aria-label={text().edit} icon={<IconEdit />} onClick={(e) => foundation.onEditButtonClick(e, option())} />
            </Show>
            {statusButton(option)}
        </div>
    );

    return (
        <div class={clsx(prefixCls, props.class)} style={props.style}>
            <div class={`${prefixCls}-header`}>
                <RadioGroup type="button" aria-label={text().mcpConfigure} value={state().mode} onChange={(e) => foundation.handleModeChange(e.target.value)}>
                    <Radio value={strings.MCP_MODE.INNER}>{text().mcpServers}</Radio>
                    <Radio value={strings.MCP_MODE.CUSTOM}>{text().newMcpAdd}</Radio>
                </RadioGroup>
                <span class={`${prefixCls}-header-count`}>
                    {text().activeMCPNumber} {activatedCount()}/{options().length + customOptions().length}
                </span>
            </div>
            <Show when={isCustom()} fallback={searchInput()}>
                <Show
                    when={customOptions().length > 0}
                    fallback={
                        <Empty class={`${prefixCls}-custom-empty`} darkModeImage={<IllustrationNoContentDark style={illustrationStyle} />} description={text().emptyCustomMcpInfo} image={<IllustrationNoContent style={illustrationStyle} />}>
                            {addButton()}
                        </Empty>
                    }
                >
                    <div class={`${prefixCls}-search ${prefixCls}-search-container`}>
                        {searchInput()}
                        {addButton()}
                    </div>
                </Show>
            </Show>
            <div class={`${prefixCls}-item-container`}>
                {/* Rows follow positions, as React's value keys do when the owner replaces a toggled option: the focused
                    status button stays in the document */}
                <Index each={showOptions()}>
                    {(option) => {
                        // the render functions run again for a new option or mode, as on a React render
                        const renderArgs = createMemo(() => ({ custom: isCustom(), option: option() }));
                        return (
                            <Show when={props.renderItem} keyed fallback={optionItem(option, renderArgs)}>
                                {(render) => (
                                    <Show when={renderArgs()} keyed>
                                        {(args) => render(args)}
                                    </Show>
                                )}
                            </Show>
                        );
                    }}
                </Index>
            </div>
        </div>
    );
}
