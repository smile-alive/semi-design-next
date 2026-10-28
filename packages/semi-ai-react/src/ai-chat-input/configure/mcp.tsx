import React, { type MouseEvent, useCallback } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import Button from '@fibrae/semi-ui-react/button/index';
import Dropdown, { type DropdownProps } from '@fibrae/semi-ui-react/dropdown/index';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';

export interface McpOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    [key: string]: any;
}

export interface McpProps extends DropdownProps {
    options: McpOption[];
    num?: number;
    showConfigure?: boolean;
    onConfigureButtonClick?: () => void;
}

function Mcp({ className, style, options = [], num, children, onConfigureButtonClick, showConfigure = true, ...rest }: McpProps) {
    const count = num ?? options.length;

    const onClick = useCallback((e: MouseEvent) => {
        // keep the click from reaching the Dropdown trigger, which would close the menu
        e.stopPropagation();
    }, []);

    return (
        <Dropdown
            className={clsx({
                [className]: className,
                [`${cssClasses.PREFIX}-footer-configure-mcp`]: true,
            })}
            style={style}
            {...rest}
            render={
                <LocaleConsumer componentName="AIChatInput">
                    {(locale: Locale['AIChatInput']) => (
                        <>
                            <div className={`${cssClasses.PREFIX}-footer-configure-mcp-header`}>
                                <span className={`${cssClasses.PREFIX}-footer-configure-mcp-header-title`}>{locale.selected.replace('${count}', String(count))}</span>
                                {showConfigure && (
                                    <Button className={`${cssClasses.PREFIX}-footer-configure-mcp-header-config`} theme="outline" onClick={onConfigureButtonClick}>
                                        {locale.configure}
                                    </Button>
                                )}
                            </div>
                            {children ? (
                                children
                            ) : (
                                <>
                                    <Dropdown.Menu>
                                        {options.map((item: any) => (
                                            <Dropdown.Item key={item.value} icon={item.icon}>
                                                {item.label}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </>
                            )}
                        </>
                    )}
                </LocaleConsumer>
            }
        >
            <Button type="tertiary" className={`${cssClasses.PREFIX}-footer-configure-mcp-trigger`} theme="outline" onClick={onClick}>
                MCP · {count}
            </Button>
        </Dropdown>
    );
}

export default React.memo(Mcp);
