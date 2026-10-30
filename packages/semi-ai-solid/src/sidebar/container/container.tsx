import { type JSX, Show, children, createComputed, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import ContainerFoundation, { type ContainerAdapter, type ContainerProps } from '@fibrae/semi-ai-foundation/sidebar/container-foundation';
import { canRestoreFocus } from '@fibrae/semi-ai-foundation/sidebar/utils';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import '@fibrae/semi-ai-foundation/sidebar/sidebar.scss';
import { IconClose } from '@fibrae/semi-icons-solid';
import useCSSAnimation from '@fibrae/semi-ui-solid/_base/css-animation';
import hasContent from '@fibrae/semi-ui-solid/_base/has-content';
import mergeRefs from '@fibrae/semi-ui-solid/_base/merge-refs';
import { namedRole } from '@fibrae/semi-ui-solid/_base/named-role';
import useFoundation from '@fibrae/semi-ui-solid/_base/use-foundation';
import useWatch from '@fibrae/semi-ui-solid/_base/use-watch';
import Button from '@fibrae/semi-ui-solid/button/index';
import { useLocale, useRecordFocus } from '@fibrae/semi-ui-solid/hooks';
import { Resizable } from '@fibrae/semi-ui-solid/resizable/index';
import type { ContainerSolidProps } from '../interface';

const prefixCls = cssClasses.SIDEBAR;

const defaultProps = {
    motion: true,
    resizable: true,
    minWidth: 150,
    showClose: true,
} satisfies Partial<ContainerSolidProps>;

export default function Container(rawProps: ContainerSolidProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ['ref', 'containerRef', 'title', 'renderHeader', 'children', 'style', 'class', 'visible', 'motion', 'resizable', 'minWidth', 'maxWidth', 'defaultSize', 'showClose', 'onCancel', 'afterVisibleChange', 'closeOnEsc']);

    const locale = useLocale('Sidebar');

    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();

    // only the initial value: afterwards the foundation sets it when an animation ends
    const [displayNone, setDisplayNone] = createSignal(untrack(() => !props.visible));
    const [root, setRoot] = createSignal<HTMLDivElement>();
    let resizableRoot: HTMLDivElement | undefined;

    const { foundation } = useFoundation<ContainerFoundation, ContainerAdapter, ContainerProps, Record<string, never>>(
        ContainerFoundation,
        props as ContainerProps,
        () => ({}),
        () => ({
            notifyCancel: (e) => props.onCancel?.(e),
            notifyVisibleChange: (isVisible) => props.afterVisibleChange?.(isVisible),
            // The layer covers the Resizable around the container when there is one: its drag handles are siblings of the
            // container, and a modal layer opened earlier would make them inert. The page beside the sidebar stays
            // usable, so the layer is not modal.
            openLayer: (onEscape) => {
                const element = (local.resizable ? resizableRoot : undefined) ?? (root() as HTMLDivElement);
                layer.hold(() => openLayer({ element, modal: false, onEscape }));
            },
            closeLayer: () => layer.release(),
            toggleDisplayNone: (hidden) => setDisplayNone(hidden),
            restoreFocus: () => {
                if (canRestoreFocus(root())) {
                    focusScope.restore(true);
                }
            },
        })
    );

    const visible = createMemo(() => Boolean(local.visible));

    const animation = useCSSAnimation({
        startClassName: () => (visible() ? `${prefixCls}-animation-content_show` : `${prefixCls}-animation-content_hide`),
        motion: () => local.motion,
        onAnimationEnd: foundation.handleAnimationEnd,
    });

    const customHeader = children(() => local.renderHeader?.());

    // a hidden container stays mounted only while its leave animation runs
    const mounted = () => visible() || (local.motion && !displayNone());

    // content() is created inside the Show fallback memo or Resizable's children effect, which would track the ref read;
    // a spread props signal would then remount the whole content
    const content = () => (
        <div
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']}
            {...rest}
            ref={untrack(() => mergeRefs(local.ref, local.containerRef, setRoot, animation.ref))}
            class={clsx(`${prefixCls}-container`, local.class, animation.className())}
            style={local.style}
        >
            <Show
                when={hasContent(customHeader())}
                fallback={
                    <div class={`${prefixCls}-container-header`}>
                        <div class={`${prefixCls}-container-header-title`}>{local.title}</div>
                        <Show when={local.showClose}>
                            <Button type="tertiary" class={`${prefixCls}-container-header-closeBtn`} aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={(e) => local.onCancel?.(e)} />
                        </Show>
                    </div>
                }
            >
                {customHeader()}
            </Show>
            <div class={`${prefixCls}-container-content`}>{local.children}</div>
        </div>
    );

    useRecordFocus(focusScope, visible);

    // before the DOM updates, so showing mounts the content in this same update
    createComputed(() => {
        if (visible()) {
            setDisplayNone(false);
        }
    });

    createEffect(() => {
        if (!visible() || !root()) {
            return;
        }
        foundation.beforeShow();
        onCleanup(foundation.closeLayer);
    });

    useWatch(visible, (isVisible) => {
        if (!isVisible) {
            foundation.restoreFocus();
        }
    });

    useWatch(displayNone, (isHidden) => foundation.onVisibleChange(!isHidden));

    // focused content unmounts with the sidebar and would leave focus on the body; registered on mount, since a server
    // render disposes without one
    onMount(() => onCleanup(foundation.restoreFocus));

    return (
        <Show when={mounted()}>
            <Show when={local.resizable} fallback={content()}>
                <Resizable ref={(node: HTMLDivElement) => (resizableRoot = node)} defaultSize={local.defaultSize} enable={strings.DIRECTION} maxWidth={local.maxWidth} minWidth={local.minWidth}>
                    {content()}
                </Resizable>
            </Show>
        </Show>
    );
}
