import type React from 'react';
import { type CSSProperties, Children, createElement, isValidElement, memo, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
import '@fibrae/semi-foundation/layout/layout.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import { LayoutContext, type ContextType } from './layout-context';
import Sider from './sider';

export type { ResponsiveMap, SiderProps } from './sider';

export interface BasicProps extends ElementProps<'section'> {
    prefixCls?: string;
    style?: CSSProperties;
    className?: string;
    tagName?: keyof HTMLElementTagNameMap;
    type?: string;
    children?: React.ReactNode;
    /** Attached to the root element, whose tag is `tagName` */
    ref?: React.Ref<HTMLElement>;
}

function Basic({ ref, prefixCls = cssClasses.PREFIX, type, className, children, tagName, ...rest }: BasicProps) {
    return createElement(tagName, { ...rest, ref, className: clsx(className, `${prefixCls}-${type}`) }, children);
}

function Header(props: BasicProps) {
    return <Basic {...props} type={props.type ?? 'header'} tagName={props.tagName ?? 'header'} />;
}

function Footer(props: BasicProps) {
    return <Basic {...props} type={props.type ?? 'footer'} tagName={props.tagName ?? 'footer'} />;
}

function Content(props: BasicProps) {
    return <Basic {...props} type={props.type ?? 'content'} tagName={props.tagName ?? 'main'} />;
}

export interface BasicLayoutProps extends ElementProps<'section'> {
    prefixCls?: string;
    style?: CSSProperties;
    className?: string;
    children?: React.ReactNode;
    hasSider?: boolean;
    tagName?: keyof HTMLElementTagNameMap;
    /** Attached to the root element, whose tag is `tagName` */
    ref?: React.Ref<HTMLElement>;
}

const defaultProps = { prefixCls: cssClasses.PREFIX, tagName: 'section' } satisfies Partial<BasicLayoutProps>;

function isSider(child: React.ReactNode) {
    return isValidElement(child) && (child.type as { elementType?: string }).elementType === 'Layout.Sider';
}

function Layout(rawProps: BasicLayoutProps) {
    const { ref, prefixCls, className, children, hasSider, tagName, ...rest } = useDefaultProps('Layout', rawProps, defaultProps);

    const [siders, setSiders] = useState<string[]>([]);

    // a new context value per render would re-run the Siders' registering effects in a loop
    const [context] = useState<ContextType>(() => ({
        siderHook: {
            addSider: (id) => setSiders((current) => [...current, id]),
            removeSider: (id) => setSiders((current) => current.filter((curr) => curr !== id)),
        },
    }));

    const classString = clsx(className, prefixCls, {
        [`${prefixCls}-has-sider`]: hasSider === true || siders.length > 0 || Children.toArray(children).some(isSider),
    });

    return <LayoutContext value={context}>{createElement(tagName, { ...rest, ref, className: classString }, children)}</LayoutContext>;
}

const exported = Object.assign(Layout, {
    Header: memo(Header),
    Footer: memo(Footer),
    Content: memo(Content),
    Sider,
});

export { exported as Layout };
export default exported;
