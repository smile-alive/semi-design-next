import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, type NavHeaderPart } from '@fibrae/semi-foundation/components/navigation/constants';
import '@fibrae/semi-foundation/components/navigation/navigation.scss';
import type { ElementProps, BaseProps } from '../../base/index';
import { useNavContext } from './context';

export type Logo = React.ReactNode;

export interface NavHeaderProps extends BaseProps, ElementProps<'div'> {
    classNames?: Partial<Record<NavHeaderPart, string>>;
    link?: string;
    linkOptions?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
    logo?: Logo;
    styles?: Partial<Record<NavHeaderPart, React.CSSProperties>>;
    text?: React.ReactNode;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

function NavHeader({ ref, children, style, styles, className, classNames, logo, text, link, linkOptions, ...rest }: NavHeaderProps) {
    const { isCollapsed } = useNavContext();

    let wrappedChildren = (
        <>
            {Boolean(logo) && (
                <i className={clsx(`${cssClasses.PREFIX}-header-logo`, classNames?.logo)} style={styles?.logo}>
                    {logo}
                </i>
            )}
            {text != null && !isCollapsed && (
                <span className={clsx(`${cssClasses.PREFIX}-header-text`, classNames?.text)} style={styles?.text}>
                    {text}
                </span>
            )}
            {children}
        </>
    );

    const wrapCls = clsx(className, `${cssClasses.PREFIX}-header`, {
        [`${cssClasses.PREFIX}-header-collapsed`]: isCollapsed,
    });

    if (typeof link === 'string') {
        wrappedChildren = (
            // collapsed, the text is dropped, so it names the link; a non-string text needs linkOptions['aria-label']
            <a aria-label={isCollapsed && (typeof text === 'string' || typeof text === 'number') ? `${text}` : undefined} href={link} {...linkOptions} className={clsx(`${cssClasses.PREFIX}-header-link`, classNames?.link, linkOptions?.className)} style={{ ...styles?.link, ...linkOptions?.style }}>
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
