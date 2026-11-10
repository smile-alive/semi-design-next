import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
import { type ElementProps, type BaseProps, useDefaultProps } from '../../base/index';
import { hasContent } from '../../utils/index';

export type { ScrollItemProps, ScrollItemHandle } from './scroll-item';
export interface ScrollListProps extends BaseProps, ElementProps<'div'> {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    bodyHeight?: number | string;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

function ScrollList(rawProps: ScrollListProps) {
    const props = useDefaultProps('ScrollList', rawProps, {});

    const {
        ref,
        children,
        header,
        footer,
        bodyHeight,
        className,
        style,
        // set by TimePicker to name the slots after its own props
        'x-semi-header-alias': headerAlias,
        'x-semi-footer-alias': footerAlias,
        ...rest
    } = props as ScrollListProps & { 'x-semi-header-alias'?: string; 'x-semi-footer-alias'?: string };

    const prefix = cssClasses.PREFIX;

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
            <div className={`${prefix}-body`} style={{ height: bodyHeight || '' }} x-semi-prop="children">
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

export default ScrollList;
