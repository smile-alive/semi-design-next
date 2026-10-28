import { onCleanup, onMount, splitProps } from 'solid-js';
import clsx from 'clsx';
import { defaultResponsiveMap, type ResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
import { registerMediaQuery } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/layout/layout.scss';
import type { ElementProps } from '../_base/element-props';
import { useLayoutContext } from './context';

export interface SiderProps extends ElementProps<'aside'> {
    prefixCls?: string;
    breakpoint?: Array<keyof ResponsiveMap>;
    onBreakpoint?: (screen: keyof ResponsiveMap, match: boolean) => void;
}

export default function Sider(props: SiderProps) {
    const [local, rest] = splitProps(props, ['breakpoint', 'children', 'class', 'onBreakpoint', 'prefixCls']);

    const layout = useLayoutContext();

    // Registered in the body, which runs on the server too, so the Layout's first frame already has has-sider
    layout?.addSider();

    onCleanup(() => layout?.removeSider());

    // Known limit: breakpoint is read once at mount. Upgrade: re-register the queries when it changes.
    onMount(() => {
        const screens = (Object.keys(defaultResponsiveMap) as Array<keyof ResponsiveMap>).filter((screen) => local.breakpoint?.includes(screen));
        const unregisters = screens.map((screen) =>
            registerMediaQuery(defaultResponsiveMap[screen], {
                match: () => local.onBreakpoint?.(screen, true),
                unmatch: () => local.onBreakpoint?.(screen, false),
            })
        );

        onCleanup(() => unregisters.forEach((unregister) => unregister()));
    });

    return (
        <aside {...rest} class={clsx(local.class, `${local.prefixCls ?? cssClasses.PREFIX}-sider`)}>
            <div class={`${local.prefixCls ?? cssClasses.PREFIX}-sider-children`}>{local.children}</div>
        </aside>
    );
}
