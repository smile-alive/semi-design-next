import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import ScrollItem from './scroll-item';

export type { ScrollItemProps, ScrollItemHandle } from './scroll-item';
export interface ScrollListProps extends BaseProps, ElementProps<'div'> {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    bodyHeight?: number | string;
    prefixCls?: string;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

// 0 and '' are renderable content
const hasContent = (node: React.ReactNode) => node != null && node !== false;

function ScrollList(rawProps: ScrollListProps) {
    const props = useDefaultProps('ScrollList', rawProps, {});

    const {
        ref,
        children,
        header,
        footer,
        prefixCls,
        bodyHeight,
        className,
        style,
        // set by TimePicker to name the slots after its own props
        'x-semi-header-alias': headerAlias,
        'x-semi-footer-alias': footerAlias,
        ...rest
    } = props as ScrollListProps & { 'x-semi-header-alias'?: string; 'x-semi-footer-alias'?: string };

    const prefix = prefixCls || cssClasses.PREFIX;

    return (
        <div role={namedRole(rest)} {...rest} ref={ref} className={clsx(className, prefix)} style={style}>
            {hasContent(header) && (
                <div className={`${prefix}-header`}>
                    <div className={`${prefix}-header-title`} x-semi-prop={headerAlias || 'header'}>
                        {header}
                    </div>
                    <div className={`${prefix}-line`} />
                </div>
            )}
            <div className={`${prefix}-body`} style={{ height: bodyHeight ? bodyHeight : '' }} x-semi-prop="children">
                {children}
            </div>
            {hasContent(footer) && (
                <div className={`${prefix}-footer`} x-semi-prop={footerAlias || 'footer'}>
                    {footer}
                </div>
            )}
        </div>
    );
}

export default Object.assign(ScrollList, { Item: ScrollItem });
