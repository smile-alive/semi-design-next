import { children, createSignal, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
import '@fibrae/semi-foundation/layout/layout.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';
import { Content, Footer, Header } from './basic';
import { LayoutContext, type LayoutContextValue } from './context';
import Sider from './sider';

export interface LayoutProps extends ElementProps<'section'> {
    prefixCls?: string;
    hasSider?: boolean;
    tagName?: keyof HTMLElementTagNameMap;
}

const defaultProps = { prefixCls: cssClasses.PREFIX, tagName: 'section' } satisfies Partial<LayoutProps>;

function Layout(rawProps: LayoutProps) {
    const props = useDefaultProps('Layout', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'hasSider', 'prefixCls', 'tagName']);

    const [siderCount, setSiderCount] = createSignal(0);

    const context: LayoutContextValue = {
        addSider: () => setSiderCount((count) => count + 1),
        removeSider: () => setSiderCount((count) => count - 1),
    };

    return (
        <LayoutContext.Provider value={context}>
            <LayoutRoot {...rest} class={local.class} hasSider={local.hasSider} prefixCls={local.prefixCls} tagName={local.tagName} siderCount={siderCount}>
                {local.children}
            </LayoutRoot>
        </LayoutContext.Provider>
    );
}

// Resolves children before reading the class: the Siders register while they are created, and the server evaluates
// the root's attributes before its children unless the children are resolved first. It is a separate component so
// the Siders are created under the provider.
function LayoutRoot(props: LayoutProps & { siderCount: () => number }) {
    const [local, rest] = splitProps(props, ['children', 'class', 'hasSider', 'prefixCls', 'siderCount', 'tagName']);

    const resolved = children(() => local.children);

    return (
        <Dynamic component={local.tagName} {...rest} class={clsx(local.class, local.prefixCls, { [`${local.prefixCls}-has-sider`]: local.hasSider === true || local.siderCount() > 0 })}>
            {resolved()}
        </Dynamic>
    );
}

export default Object.assign(Layout, { Header, Footer, Content, Sider });
