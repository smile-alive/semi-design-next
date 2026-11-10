import type React from 'react';
import { type CSSProperties, createElement, memo, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/layout/constants';
import '@fibrae/semi-foundation/components/layout/layout.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { elementTypeOf, flattenChildren } from '../../utils/index';
import { LayoutContext, type ContextType } from './context';
import Sider from './sider';

export type { ResponsiveMap, SiderProps } from './sider';

const prefixCls = cssClasses.PREFIX;

export interface BasicProps extends ElementProps<'section'> {
    style?: CSSProperties;
    className?: string;
    tagName?: keyof HTMLElementTagNameMap;
    children?: React.ReactNode;
    /** Attached to the root element, whose tag is `tagName` */
    ref?: React.Ref<HTMLElement>;
}

function Basic({ ref, type, className, children, tagName, ...rest }: BasicProps & { type: string }) {
    return createElement(tagName, { ...rest, ref, className: clsx(className, `${prefixCls}-${type}`) }, children);
}

function Header(props: BasicProps) {
    return <Basic {...props} type="header" tagName={props.tagName ?? 'header'} />;
}

function Footer(props: BasicProps) {
    return <Basic {...props} type="footer" tagName={props.tagName ?? 'footer'} />;
}

function Content(props: BasicProps) {
    return <Basic {...props} type="content" tagName={props.tagName ?? 'main'} />;
}

export interface BasicLayoutProps extends ElementProps<'section'> {
    style?: CSSProperties;
    className?: string;
    children?: React.ReactNode;
    hasSider?: boolean;
    tagName?: keyof HTMLElementTagNameMap;
    /** Attached to the root element, whose tag is `tagName` */
    ref?: React.Ref<HTMLElement>;
}

const defaultProps = { tagName: 'section' } satisfies Partial<BasicLayoutProps>;

function isSider(child: React.ReactNode) {
    return elementTypeOf(child) === 'Layout.Sider';
}

function Layout(rawProps: BasicLayoutProps) {
    const { ref, className, children, hasSider, tagName, ...rest } = useDefaultProps('Layout', rawProps, defaultProps);

    const [siders, setSiders] = useState<string[]>([]);

    // a new context value per render would re-run the Siders' registering effects in a loop
    const [context] = useState<ContextType>(() => ({
        siderHook: {
            addSider: (id) => setSiders((current) => [...current, id]),
            removeSider: (id) => setSiders((current) => current.filter((curr) => curr !== id)),
        },
    }));

    const classString = clsx(className, prefixCls, {
        [`${prefixCls}-has-sider`]: hasSider === true || siders.length > 0 || flattenChildren(children).some(isSider),
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
