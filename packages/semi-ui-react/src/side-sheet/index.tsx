import type React from 'react';
import { type CSSProperties, useEffect, useInsertionEffect, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/side-sheet/constants';
import SideSheetFoundation, { type SideSheetAdapter, type SideSheetProps, type SideSheetState } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';
import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import '@fibrae/semi-foundation/side-sheet/side-sheet.scss';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useIsServerRender from '../_base/use-is-server-render';
import useMergedRef from '../_base/use-merged-ref';
import useRealUnmount from '../_base/use-real-unmount';
import CSSAnimation from '../_css-animation';
import Portal from '../_portal';
import { useConfigContext } from '../config-provider/context';
import SideSheetContent from './side-sheet-content';

const prefixCls = cssClasses.PREFIX;

export type { SideSheetContentProps } from './side-sheet-content';

export interface SideSheetReactProps extends SideSheetProps {
    bodyStyle?: CSSProperties;
    headerStyle?: CSSProperties;
    maskStyle?: CSSProperties;
    style?: CSSProperties;
    title?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    /** Escape closes through a document listener, so that path passes the native KeyboardEvent */
    onCancel?: (e: React.MouseEvent | KeyboardEvent) => void;
    canVerticalSetWidth?: boolean;
    /** Attached to the sidesheet wrapper div inside the portal; null while nothing is rendered */
    ref?: React.Ref<HTMLDivElement>;
}

export type { SideSheetState } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';

const defaultProps = {
    visible: false,
    motion: true,
    mask: true,
    placement: 'right',
    closable: true,
    footer: null,
    zIndex: 1000,
    maskClosable: true,
    size: 'small',
    disableScroll: true,
    closeOnEsc: false,
    keepDOM: false,
} satisfies Partial<SideSheetReactProps>;

class SideSheetRuntime {
    // shown or leaving: an unmount in this period still reports afterVisibleChange(false)
    #shown = false;
    readonly scroll = new ReleaseHolder();
    readonly layer = new ReleaseHolder();
    root: HTMLDivElement | null = null;
    dialog: HTMLDivElement | null = null;
    readonly focusScope = new FocusScope();

    setShown(shown: boolean) {
        this.#shown = shown;
    }

    takeShown() {
        const shown = this.#shown;
        this.#shown = false;
        return shown;
    }

    readonly attachRoot = (node: HTMLDivElement | null) => {
        this.root = node;
    };

    readonly attachDialog = (node: HTMLDivElement | null) => {
        this.dialog = node;
    };

    disableBodyScroll(modal: boolean) {
        if (modal) {
            this.scroll.hold(lockBodyScroll);
        } else {
            this.scroll.release();
        }
    }
}

interface SideSheetOpenEffectsProps {
    visible: boolean;
    foundation: SideSheetFoundation<SideSheetReactProps>;
    runtime: SideSheetRuntime;
}

// Rendered in the Portal after the content, so these effects run once the sheet's DOM and refs exist: in the
// Portal's first commit, which on a hydrated page comes after hydration rather than with the sheet's own mount
function SideSheetOpenEffects({ visible, foundation, runtime }: SideSheetOpenEffectsProps) {
    // Read before this commit's layout phase, where an autoFocus element inside the sheet takes focus
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
        return () => foundation.afterHide();
    }, [visible, foundation]);

    useEffect(() => {
        if (visible) {
            warnIfDialogUnnamed(runtime.dialog, 'SideSheet');
        }
    }, [visible, runtime]);

    return null;
}

export default function SideSheet(rawProps: SideSheetReactProps) {
    const props = useDefaultProps('SideSheet', rawProps, defaultProps);
    const { ref, placement, className, children, width, height, motion, visible, style, maskStyle, size, zIndex, getPopupContainer, keepDOM, canVerticalSetWidth, afterVisibleChange, closeOnEsc, disableScroll, onCancel, mask, maskClosable, closable, closeIcon, title, footer, headerStyle, bodyStyle, ...rest } = props;

    const context = useConfigContext();

    const [runtime] = useState(() => new SideSheetRuntime());
    const [displayNone, setDisplayNone] = useState(!props.visible);

    // adjusted during render so the hidden class and unmounting without motion land in the same commit as visible
    let hidden = displayNone;

    const isServerRender = useIsServerRender();

    const [foundation] = useFoundation<SideSheetFoundation<SideSheetReactProps>, SideSheetAdapter<SideSheetReactProps>, SideSheetReactProps, SideSheetState>(
        SideSheetFoundation,
        props,
        () => ({}),
        (base) => {
            // a mask confined to a custom popup container leaves the rest of the page usable
            const isModal = () => Boolean(base.getProp('mask')) && coversPage(base.getProp('getPopupContainer') ?? base.getContext('getPopupContainer'));
            return {
                disabledBodyScroll: () => runtime.disableBodyScroll(isModal()),
                enabledBodyScroll: () => runtime.scroll.release(),
                notifyCancel: (e) => base.getProps().onCancel?.(e),
                notifyVisibleChange: (visible) => base.getProps().afterVisibleChange?.(visible),
                openLayer: (onEscape) => runtime.layer.hold(() => openLayer({ element: runtime.root, modal: isModal(), onEscape })),
                closeLayer: () => runtime.layer.release(),
                // shortcut: content under a mask confined to a custom container stays Tab-reachable,
                // upgrade to inert on the container's other children if it must become unreachable.
                trapFocus: () => runtime.focusScope.engage(runtime.dialog, isModal(), true),
                releaseFocus: () => runtime.focusScope.deactivate(),
                // a user who moved on to the page next to a non-modal sheet keeps that focus
                restoreFocus: () => runtime.focusScope.restoreIfAllowed(runtime.dialog, isModal(), true),
                toggleDisplayNone: (hidden) => setDisplayNone(hidden),
            };
        },
        context
    );

    if (visible) {
        hidden = false;
    } else if (!motion) {
        hidden = true;
    }

    if (hidden !== displayNone) {
        setDisplayNone(hidden);
    }

    const rootRef = useMergedRef(ref, runtime.attachRoot);
    const isHorizontal = placement === 'top' || placement === 'bottom';

    // the caller's getter may read document; on the server and while hydrating the Portal renders nothing anyway
    const inBody = !isServerRender && coversPage(getPopupContainer ?? context.getPopupContainer);

    const classList = clsx(prefixCls, className, {
        [`${prefixCls}-${placement}`]: placement,
        [`${prefixCls}-popup`]: !inBody,
        [`${prefixCls}-horizontal`]: isHorizontal,
        [`${prefixCls}-hidden`]: keepDOM && hidden,
    });

    const wrapperStyle: CSSProperties = inBody ? { zIndex } : { zIndex, position: 'static' };
    const shouldRender = visible || keepDOM || (motion && !hidden);

    const updateState = () => foundation.toggleDisplayNone(!visible);

    // React refocuses the pre-commit element after the cleanup while the sheet is still mounted for its leave
    // animation; restore again
    useDidUpdate(visible, (isVisible) => {
        if (!isVisible) {
            foundation.restoreFocus();
        }
    });

    useDidUpdate(displayNone, (isHidden) => foundation.onVisibleChange(!isHidden));
    useLayoutEffect(() => runtime.setShown(!hidden), [runtime, hidden]);

    useRealUnmount(() => {
        if (runtime.takeShown()) {
            foundation.onVisibleChange(false);
        }
    });

    // the mask and the content animate separately and either duration may be customized, so both report
    return (
        <CSSAnimation startClassName={visible ? `${prefixCls}-animation-mask_show` : `${prefixCls}-animation-mask_hide`} animationState={visible ? 'enter' : 'leave'} motion={motion} onAnimationEnd={updateState}>
            {({ animationClassName: maskAnimationClassName, animationEventsNeedBind: maskAnimationEventsNeedBind }) => (
                <CSSAnimation startClassName={visible ? `${prefixCls}-animation-content_show_${placement}` : `${prefixCls}-animation-content_hide_${placement}`} animationState={visible ? 'enter' : 'leave'} motion={motion} onAnimationEnd={updateState}>
                    {({ animationClassName, animationStyle, animationEventsNeedBind }) =>
                        shouldRender ? (
                            <Portal style={wrapperStyle} getPopupContainer={getPopupContainer}>
                                <SideSheetContent
                                    {...rest}
                                    ref={rootRef}
                                    className={classList}
                                    dialogClassName={animationClassName}
                                    maskClassName={maskAnimationClassName}
                                    bodyStyle={bodyStyle}
                                    headerStyle={headerStyle}
                                    maskStyle={maskStyle}
                                    style={{ ...animationStyle, ...style }}
                                    title={title}
                                    closable={closable}
                                    closeIcon={closeIcon}
                                    dialogRef={runtime.attachDialog}
                                    footer={footer}
                                    mask={mask}
                                    maskClosable={maskClosable}
                                    maskExtraProps={maskAnimationEventsNeedBind}
                                    modal={mask && inBody}
                                    sheetSize={SideSheetFoundation.getSheetSize(props)}
                                    size={size}
                                    wrapperExtraProps={animationEventsNeedBind}
                                    onClose={foundation.handleCancel}
                                >
                                    {children}
                                </SideSheetContent>
                                <SideSheetOpenEffects foundation={foundation} runtime={runtime} visible={visible} />
                            </Portal>
                        ) : null
                    }
                </CSSAnimation>
            )}
        </CSSAnimation>
    );
}
