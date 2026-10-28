import { useInsertionEffect, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
import ContainerFoundation, { type ContainerAdapter, type ContainerProps } from '@fibrae/semi-ai-foundation/sidebar/container-foundation';
import { canRestoreFocus } from '@fibrae/semi-ai-foundation/sidebar/utils';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import '@fibrae/semi-ai-foundation/sidebar/sidebar.scss';
import { IconClose } from '@fibrae/semi-icons-react';
import { namedRole } from '@fibrae/semi-ui-react/_base/named-role';
import useFoundation from '@fibrae/semi-ui-react/_base/use-foundation';
import useRealUnmount from '@fibrae/semi-ui-react/_base/use-real-unmount';
import CSSAnimation from '@fibrae/semi-ui-react/_css-animation/index';
import Button from '@fibrae/semi-ui-react/button/index';
import { useDidUpdate, useMergedRef, useLocale } from '@fibrae/semi-ui-react/hooks';
import Resizable from '@fibrae/semi-ui-react/resizable/single/resizable';
import type { ContainerReactProps } from '../interface';

const prefixCls = cssClasses.SIDEBAR;

// The root element and the overlay layer the adapter opens on show
class ContainerRuntime {
    readonly #layer = new ReleaseHolder();
    readonly focusScope = new FocusScope();
    root: HTMLDivElement | null = null;
    resizable: HTMLDivElement | null = null;

    readonly attachRoot = (node: HTMLDivElement | null) => {
        this.root = node;
    };

    readonly attachResizable = (node: HTMLDivElement | null) => {
        this.resizable = node;
    };

    openLayer(onEscape: (e: KeyboardEvent) => boolean) {
        // The layer covers the Resizable around the container when there is one: its drag handles are siblings of the
        // container, and a modal layer opened earlier would make them inert. The page beside the sidebar stays usable,
        // so the layer is not modal.
        this.#layer.hold(() => openLayer({ element: this.resizable ?? this.root, modal: false, onEscape }));
    }

    closeLayer() {
        this.#layer.release();
    }

    restoreFocus() {
        if (canRestoreFocus(this.root)) {
            this.focusScope.restore(true);
        }
    }
}

export default function Container(props: ContainerReactProps) {
    const { ref, containerRef, title, renderHeader, children, style, className, visible, motion = true, resizable = true, minWidth = 150, maxWidth, defaultSize, showClose = true, onCancel, afterVisibleChange, closeOnEsc, ...rest } = props;

    const { locale } = useLocale('Sidebar');

    const [runtime] = useState(() => new ContainerRuntime());
    const [displayNone, setDisplayNone] = useState(!visible);

    const [foundation] = useFoundation<ContainerFoundation, ContainerAdapter, ContainerProps, Record<string, never>>(
        ContainerFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyCancel: (e) => base.getProps().onCancel?.(e),
            notifyVisibleChange: (isVisible) => base.getProps().afterVisibleChange?.(isVisible),
            openLayer: (onEscape) => runtime.openLayer(onEscape),
            closeLayer: () => runtime.closeLayer(),
            toggleDisplayNone: (hidden) => setDisplayNone(hidden),
            restoreFocus: () => runtime.restoreFocus(),
        })
    );

    // adjusted during render so showing mounts the content in the same commit
    if (visible && displayNone) {
        setDisplayNone(false);
    }

    const setRoot = useMergedRef(ref, containerRef, runtime.attachRoot);

    const header = renderHeader?.() || (
        <div className={`${prefixCls}-container-header`}>
            <div className={`${prefixCls}-container-header-title`}>{title}</div>
            {showClose && <Button type="tertiary" className={`${prefixCls}-container-header-closeBtn`} aria-label={locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={onCancel} />}
        </div>
    );

    // Read before this commit's layout phase, where an autoFocus element inside the sidebar takes focus
    useInsertionEffect(() => {
        if (visible) {
            runtime.focusScope.record();
        }
    }, [visible, runtime]);

    useLayoutEffect(() => {
        if (!visible) {
            return undefined;
        }
        foundation.beforeShow();
        // Focus is not restored here: StrictMode's simulated unmount runs this cleanup and must not move focus
        return () => foundation.closeLayer();
    }, [visible, foundation]);

    // React refocuses the pre-commit element after the cleanup, while it is still mounted for the leave animation;
    // restore again
    useDidUpdate(visible, (isVisible) => {
        if (!isVisible) {
            foundation.restoreFocus();
        }
    });

    // Focused content unmounts with the sidebar and would leave focus on the body
    useRealUnmount(() => foundation.restoreFocus());
    useDidUpdate(displayNone, (isHidden) => foundation.onVisibleChange(!isHidden));

    return (
        <CSSAnimation startClassName={visible ? `${prefixCls}-animation-content_show` : `${prefixCls}-animation-content_hide`} animationState={visible ? 'enter' : 'leave'} motion={motion} onAnimationEnd={foundation.handleAnimationEnd}>
            {({ animationClassName, animationStyle, animationEventsNeedBind }) => {
                // a hidden container stays mounted only while its leave animation runs
                if (!visible && (!motion || displayNone)) {
                    return null;
                }
                const content = (
                    <div role={namedRole(rest)} {...rest} ref={setRoot} className={clsx(`${prefixCls}-container`, className, animationClassName)} style={{ ...style, ...animationStyle }} {...animationEventsNeedBind}>
                        {header}
                        <div className={`${prefixCls}-container-content`}>{children}</div>
                    </div>
                );
                return resizable ? (
                    <Resizable ref={runtime.attachResizable} defaultSize={defaultSize} enable={strings.DIRECTION} maxWidth={maxWidth} minWidth={minWidth}>
                        {content}
                    </Resizable>
                ) : (
                    content
                );
            }}
        </CSSAnimation>
    );
}
