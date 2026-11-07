import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/navigation/constants';
import '@fibrae/semi-foundation/components/navigation/navigation.scss';
import type { ElementProps } from '../../base/base';
import type { BaseProps } from '../../base/base-component';
import { useNavContext } from './context';

export type Logo = React.ReactNode;

export interface NavHeaderProps extends BaseProps, ElementProps<'div'> {
    link?: string;
    linkOptions?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
    logo?: Logo;
    text?: React.ReactNode;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

function NavHeader({ ref, children, style, className, logo, text, link, linkOptions, ...rest }: NavHeaderProps) {
    const { isCollapsed } = useNavContext();

    let wrappedChildren = (
        <>
            {Boolean(logo) && <i className={`${cssClasses.PREFIX}-header-logo`}>{logo}</i>}
            {text != null && !isCollapsed && <span className={`${cssClasses.PREFIX}-header-text`}>{text}</span>}
            {children}
        </>
    );

    const wrapCls = clsx(className, `${cssClasses.PREFIX}-header`, {
        [`${cssClasses.PREFIX}-header-collapsed`]: isCollapsed,
    });

    if (typeof link === 'string') {
        wrappedChildren = (
            // collapsed, the text is dropped, so it names the link; a non-string text needs linkOptions['aria-label']
            <a aria-label={isCollapsed && (typeof text === 'string' || typeof text === 'number') ? `${text}` : undefined} href={link} {...linkOptions} className={clsx(`${cssClasses.PREFIX}-header-link`, linkOptions?.className)}>
                {wrappedChildren}
            </a>
        );
    }

    return (
        <div {...rest} ref={ref} className={wrapCls} style={style}>
            {wrappedChildren}
        </div>
    );
}

export default Object.assign(memo(NavHeader), { elementType: 'Nav.Header' });
