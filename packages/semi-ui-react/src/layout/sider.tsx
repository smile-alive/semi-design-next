import type React from 'react';
import { type CSSProperties, memo, useEffectEvent, useId, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { defaultResponsiveMap, type ResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
import { registerMediaQuery } from '@fibrae/semi-foundation/utils/dom';
import type { ElementProps } from '../_base/base';
import { useLayoutContext } from './layout-context';

export type { ResponsiveMap };

export interface SiderProps extends ElementProps<'aside'> {
    prefixCls?: string;
    style?: CSSProperties;
    className?: string;
    children?: React.ReactNode;
    breakpoint?: Array<keyof ResponsiveMap>;
    onBreakpoint?: (screen: keyof ResponsiveMap, match: boolean) => void;
    'aria-label'?: React.AriaAttributes['aria-label'];
    role?: React.AriaRole;
    /** Attached to the aside */
    ref?: React.Ref<HTMLElement>;
}

function Sider({ ref, prefixCls = cssClasses.PREFIX, className, children, breakpoint, onBreakpoint, ...rest }: SiderProps) {
    const { siderHook } = useLayoutContext();

    const id = useId();

    // breakpoint is read once at mount
    const [mountBreakpoint] = useState(breakpoint);

    const handleBreakpoint = useEffectEvent((screen: keyof ResponsiveMap, matches: boolean) => {
        onBreakpoint?.(screen, matches);
    });

    // layout effects: the has-sider class and a collapse in onBreakpoint must land before the first paint
    useLayoutEffect(() => {
        const screens = (Object.keys(defaultResponsiveMap) as Array<keyof ResponsiveMap>).filter((screen) => mountBreakpoint?.includes(screen));
        const unRegisters = screens.map((screen) =>
            registerMediaQuery(defaultResponsiveMap[screen], {
                match: () => handleBreakpoint(screen, true),
                unmatch: () => handleBreakpoint(screen, false),
            })
        );
        return () => unRegisters.forEach((unRegister) => unRegister());
    }, [mountBreakpoint]);

    useLayoutEffect(() => {
        siderHook.addSider(id);
        return () => siderHook.removeSider(id);
    }, [siderHook, id]);

    return (
        <aside {...rest} ref={ref} className={clsx(className, `${prefixCls}-sider`)}>
            <div className={`${prefixCls}-sider-children`}>{children}</div>
        </aside>
    );
}

// Layout finds direct Sider children by elementType
export default Object.assign(memo(Sider), { elementType: 'Layout.Sider' });
