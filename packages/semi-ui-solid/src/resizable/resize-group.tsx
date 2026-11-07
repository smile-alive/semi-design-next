import { type JSX, Show, createMemo, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/resizable/constants';
import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseState } from '@fibrae/semi-foundation/components/resizable/foundation';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/resizable/resizable.scss';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import { ResizeGroupContext, type ResizeGroupContextValue } from './context';
import { joinStyle } from './style';

const prefixCls = cssClasses.PREFIX;

export interface ResizeGroupProps extends ElementProps<'div'> {
    direction?: 'horizontal' | 'vertical';
}

type Foundation = ResizeGroupFoundation<ResizeGroupProps>;
type Adapter = ResizeGroupAdapter<ResizeGroupProps>;

const defaultProps = {
    direction: 'horizontal',
} satisfies Partial<ResizeGroupProps>;

export default function ResizeGroup(rawProps: ResizeGroupProps) {
    const props = useDefaultProps('ResizeGroup', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['ref', 'class', 'style', 'children', 'direction']);

    let group: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, ResizeGroupProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        props,
        () => ResizeGroupFoundation.getInitialState(),
        () => ({
            getGroupRef: () => group ?? null,
        })
    );

    const view = createMemo(() => ({ direction: props.direction }));

    // A handler that left the group (unmounted mid-drag) still receives the pointer's last events on its detached
    // element; the foundation ignores those.
    const context: ResizeGroupContextValue = {
        view,
        registerItem: foundation.registerItem,
        registerHandler: foundation.registerHandler,
        notifyResizeStart: foundation.onResizeStart,
        notifyResizing: foundation.onResizing,
        notifyResizeEnd: foundation.onResizeEnd,
        notifyKeyDown: foundation.resizeByKey,
    };

    // vw and vh limits change with the window even when the group keeps its size
    useEventListener(
        () => window,
        'resize',
        () => foundation.ensureConstraint()
    );

    useResizeObserver(
        () => group,
        () => {
            // a group first mounted inside display:none measures 0: lay out again once it becomes measurable. #3336
            foundation.handleGroupResize();
            // a container resize without a window resize can leave px limits violated
            foundation.ensureConstraint();
        }
    );

    return (
        <ResizeGroupContext.Provider value={context}>
            <div
                role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']}
                {...rest}
                // the Provider's children memo tracks the ref read; a spread props signal would rebuild the group and its panes
                ref={untrack(() => mergeRefs(local.ref, (node: HTMLDivElement) => (group = node)))}
                class={clsx(local.class, `${prefixCls}-group`)}
                style={joinStyle(local.style, { 'flex-direction': props.direction === 'vertical' ? 'column' : 'row' })}
            >
                <Show when={state().isResizing}>
                    <div class={`${prefixCls}-background`} style={state().backgroundStyle} />
                </Show>
                {local.children}
            </div>
        </ResizeGroupContext.Provider>
    );
}
