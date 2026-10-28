import { type JSX, Show, children, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
import { IconHandle } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import { useLocale } from '../locale';
import { useResizeGroupContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface ResizeHandlerProps extends ElementProps<'div'> {}

export default function ResizeHandler(rawProps: ResizeHandlerProps) {
    const props = useDefaultProps('ResizeHandler', rawProps, {});
    const [local, rest] = splitProps(props, ['ref', 'class', 'children', 'onKeyDown', 'onLostPointerCapture', 'onPointerDown', 'onPointerMove']);

    const group = useResizeGroupContext('ResizeHandler');
    const locale = useLocale('Resizable');

    let handler!: HTMLDivElement;

    const content = children(() => local.children);

    const direction = () => group.view().direction;

    const handleKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (e) => {
        callHandler(local.onKeyDown, e);
        if (group.notifyKeyDown(handler, e)) {
            e.preventDefault();
        }
    };

    const handleLostPointerCapture: JSX.EventHandler<HTMLDivElement, PointerEvent> = (e) => {
        callHandler(local.onLostPointerCapture, e);
        group.notifyResizeEnd(handler, e);
    };

    const handlePointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (e) => {
        callHandler(local.onPointerDown, e);
        if (isSecondaryPress(e)) {
            return;
        }
        // capturing keeps the moves and the release on the handler wherever the pointer goes
        e.currentTarget.setPointerCapture(e.pointerId);
        group.notifyResizeStart(handler, e);
    };

    const handlePointerMove: JSX.EventHandler<HTMLDivElement, PointerEvent> = (e) => {
        callHandler(local.onPointerMove, e);
        group.notifyResizing(handler, e);
    };

    return (
        // the name comes first so a name in rest wins; aria-value* and aria-controls are written by the foundation
        <div
            aria-label={locale().locale.separator}
            {...rest}
            ref={mergeRefs(local.ref, (node: HTMLDivElement) => {
                handler = node;
                onCleanup(group.registerHandler(node));
            })}
            class={clsx(local.class, `${prefixCls}-handler`, `${prefixCls}-handler-${direction()}`)}
            // the bar between side-by-side panes is vertical
            aria-orientation={direction() === 'horizontal' ? 'vertical' : 'horizontal'}
            role="separator"
            tabindex={0}
            onKeyDown={handleKeyDown}
            onLostPointerCapture={handleLostPointerCapture}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
        >
            <Show when={hasContent(content())} fallback={<IconHandle style={{ rotate: direction() === 'horizontal' ? '0deg' : '90deg' }} size="inherit" />}>
                {content()}
            </Show>
        </div>
    );
}
