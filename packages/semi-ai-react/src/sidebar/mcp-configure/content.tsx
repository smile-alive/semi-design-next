import type React from 'react';
import { type CSSProperties, type ReactNode, Fragment } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import MCPConfigureContentFoundation, { type MCPOption, type MCPConfigureContentProps, type MCPConfigureContentState, type MCPConfigureContentAdapter } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
import { getShowOptions } from '@fibrae/semi-ai-foundation/sidebar/utils';
import { cssClasses as buttonClasses } from '@fibrae/semi-foundation/button/constants';
import { IconSearch, IconPlus, IconSetting, IconMinus, IconEdit } from '@fibrae/semi-icons-react';
import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-react';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import Button from '@fibrae/semi-ui-react/button/index';
import Empty from '@fibrae/semi-ui-react/empty/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Input from '@fibrae/semi-ui-react/input/index';
import Radio from '@fibrae/semi-ui-react/radio/index';
import RadioGroup from '@fibrae/semi-ui-react/radio/radio-group';
import Tooltip from '@fibrae/semi-ui-react/tooltip/index';

const prefixCls = cssClasses.MCP_CONFIGURE_CONTENT;
const buttonCls = buttonClasses.PREFIX;

export interface MCPReactOption extends MCPOption {
    icon?: ReactNode;
    desc?: ReactNode;
}

export interface MCPConfigureContentReactProps extends MCPConfigureContentProps {
    options?: MCPReactOption[];
    customOptions?: MCPReactOption[];
    filter?: (inputValue: string, option: MCPReactOption) => boolean;
    style?: CSSProperties;
    onStatusChange?: (options: MCPReactOption[], custom: boolean) => void;
    onAddClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onConfigureClick?: (e: React.MouseEvent<HTMLButtonElement>, option: MCPReactOption) => void;
    onEditClick?: (e: React.MouseEvent<HTMLButtonElement>, option: MCPReactOption) => void;
    renderItem?: (props: { option: MCPReactOption; custom: boolean }) => ReactNode;
}

export default function MCPConfigureContent(props: MCPConfigureContentReactProps) {
    const { options = [], customOptions = [], className, style, placeholder, renderItem } = props;

    const { locale } = useLocale('Sidebar');

    const [foundation, state] = useFoundation<MCPConfigureContentFoundation<React.MouseEvent<HTMLButtonElement>>, MCPConfigureContentAdapter<React.MouseEvent<HTMLButtonElement>>, MCPConfigureContentProps, MCPConfigureContentState>(
        MCPConfigureContentFoundation,
        props,
        () => ({ mode: strings.MCP_MODE.INNER, inputValue: '', query: '' }),
        (base) => ({
            notifyConfigureClick: (e, option) => base.getProps().onConfigureClick?.(e, option),
            notifyEditClick: (e, option) => base.getProps().onEditClick?.(e, option),
            notifyStatusChange: (options, custom) => base.getProps().onStatusChange?.(options, custom),
            notifyAddClick: (e) => base.getProps().onAddClick?.(e),
            notifySearch: (inputValue, custom) => base.getProps().onSearch?.(inputValue, custom),
        })
    );

    const { mode, inputValue } = state;
    const showOptions = getShowOptions(props, mode, state.query);
    const isCustom = mode === strings.MCP_MODE.CUSTOM;
    const activatedCount = options.filter((option) => option.active).length + customOptions.filter((option) => option.active).length;

    // the adornments and showClear are set so global Input defaults cannot add them around the search icon
    const searchInput = <Input className={isCustom ? undefined : `${prefixCls}-search`} placeholder={placeholder ?? locale.searchPlaceholder} value={inputValue} addonAfter={null} addonBefore={null} showClear={false} prefix={<IconSearch />} suffix={null} onChange={foundation.handleSearch} />;

    let search: ReactNode = searchInput;

    const addButton = (
        <Button type="primary" theme="solid" icon={<IconPlus />} onClick={foundation.handleAddClick}>
            {locale.newMcpAdd}
        </Button>
    );

    const renderStatusButton = (option: MCPOption) => {
        const label = option.active ? locale.disable : locale.enable;
        const theme = option.active ? 'light' : 'solid';
        const icon = option.active ? <IconMinus /> : <IconPlus />;
        if (!option.disabled) {
            return <Button type="primary" className={`${prefixCls}-item-button`} aria-label={label} theme={theme} icon={icon} onClick={() => foundation.handleStatusChange(option, !option.active)} />;
        }
        // Keeps a focusable trigger so the tooltip reason reaches the keyboard; Button's native disabled leaves the Tab
        // order. Styled as a disabled primary icon-only Button; no click handler since the status cannot change.
        return (
            <Tooltip content={locale.defaultMcpInfo}>
                <button type="button" className={clsx(buttonCls, `${buttonCls}-${theme}`, `${buttonCls}-disabled`, `${buttonCls}-primary-disabled`, `${buttonCls}-with-icon`, `${buttonCls}-with-icon-only`, `${prefixCls}-item-button`)} aria-disabled="true" aria-label={label}>
                    <span className={`${buttonCls}-content`}>{icon}</span>
                </button>
            </Tooltip>
        );
    };

    if (isCustom) {
        search =
            customOptions.length === 0 ? (
                <Empty className={`${prefixCls}-custom-empty`} darkModeImage={<IllustrationNoContentDark style={{ width: 150, height: 150 }} />} description={locale.emptyCustomMcpInfo} image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}>
                    {addButton}
                </Empty>
            ) : (
                <div className={`${prefixCls}-search ${prefixCls}-search-container`}>
                    {searchInput}
                    {addButton}
                </div>
            );
    }

    return (
        <div className={clsx(prefixCls, className)} style={style}>
            <div className={`${prefixCls}-header`}>
                <RadioGroup type="button" aria-label={locale.mcpConfigure} value={mode} onChange={(e) => foundation.handleModeChange(e.target.value)}>
                    <Radio value={strings.MCP_MODE.INNER}>{locale.mcpServers}</Radio>
                    <Radio value={strings.MCP_MODE.CUSTOM}>{locale.newMcpAdd}</Radio>
                </RadioGroup>
                <span className={`${prefixCls}-header-count`}>
                    {locale.activeMCPNumber} {activatedCount}/{options.length + customOptions.length}
                </span>
            </div>
            {search}
            <div className={`${prefixCls}-item-container`}>
                {showOptions.map((option) => {
                    if (renderItem) {
                        return <Fragment key={option.value}>{renderItem({ custom: isCustom, option })}</Fragment>;
                    }
                    return (
                        <div key={option.value} className={`${prefixCls}-item`}>
                            {typeof option.icon === 'string' ? <img className={`${prefixCls}-item-sign`} alt="" src={option.icon} /> : <div className={`${prefixCls}-item-sign`}>{option.icon}</div>}
                            <div className={`${prefixCls}-item-content`}>
                                <div className={`${prefixCls}-item-content-label`}>{option.label}</div>
                                <div className={`${prefixCls}-item-content-desc`}>{option.desc}</div>
                            </div>
                            {option.configure && <Button className={`${prefixCls}-item-button ${prefixCls}-item-button-configure`} aria-label={locale.configure} icon={<IconSetting />} onClick={(e) => foundation.onConfigureButtonClick(e, option)} />}
                            {isCustom && <Button className={`${prefixCls}-item-button ${prefixCls}-item-button-configure`} aria-label={locale.edit} icon={<IconEdit />} onClick={(e) => foundation.onEditButtonClick(e, option)} />}
                            {renderStatusButton(option)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
