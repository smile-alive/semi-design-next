import { type JSX, Show, createEffect, createMemo, createRenderEffect, createSignal, on, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/side-sheet/constants';
import SideSheetFoundation, { type Placement, type SideSheetAdapter, type SideSheetState } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';
import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import '@fibrae/semi-foundation/side-sheet/side-sheet.scss';
import useCSSAnimation from '../_base/css-animation';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import PopupPortal from '../_base/popup-portal';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useMounted from '../_base/use-mounted';
import useRecordFocus from '../_base/use-record-focus';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import SideSheetContent from './side-sheet-content';

const prefixCls = cssClasses.PREFIX;

type Style = JSX.CSSProperties | string;

export interface SideSheetProps extends ElementProps<'div', 'title' | 'onCancel'> {
    /** Reports the sheet as shown when it opens and as hidden when its leave animation ends */
    afterVisibleChange?: (isVisible: boolean) => void;
    bodyStyle?: Style;
    /** Lets `width` apply to a top or bottom sheet */
    canVerticalSetWidth?: boolean;
    closable?: boolean;
    closeIcon?: JSX.Element;
    closeOnEsc?: boolean;
    disableScroll?: boolean;
    footer?: JSX.Element;
    getPopupContainer?: () => HTMLElement;
    headerStyle?: Style;
    height?: number | string;
    keepDOM?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    maskStyle?: Style;
    motion?: boolean;
    /** Escape closes through a document listener, so that path passes the native KeyboardEvent */
    onCancel?: (e: MouseEvent | KeyboardEvent) => void;
    placement?: Placement;
    size?: 'small' | 'medium' | 'large';
    /** On the role="dialog" element; the outer element takes `class` and the other undeclared attributes */
    style?: Style;
    title?: JSX.Element;
    visible?: boolean;
    width?: number | string;
    zIndex?: number;
}

export type { SideSheetState };

// the foundation reads none of the style props, and a string style is wider than its Record type
type FoundationProps = Omit<SideSheetProps, 'bodyStyle' | 'headerStyle' | 'maskStyle' | 'style'>;
type Foundation = SideSheetFoundation<FoundationProps>;
type Adapter = SideSheetAdapter<FoundationProps>;

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
} satisfies Partial<SideSheetProps>;

export default function SideSheet(rawProps: SideSheetProps) {
    const props = useDefaultProps('SideSheet', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'afterVisibleChange',
        'bodyStyle',
        'canVerticalSetWidth',
        'class',
        'closable',
        'closeIcon',
        'closeOnEsc',
        'disableScroll',
        'children',
        'footer',
        'getPopupContainer',
        'headerStyle',
        'height',
        'keepDOM',
        'mask',
        'maskClosable',
        'maskStyle',
        'motion',
        'onCancel',
        'placement',
        'ref',
        'size',
        'style',
        'title',
        'visible',
        'width',
        'zIndex',
    ]);

    const config = useConfig();

    // the initial value only: the effects below and the end of the animations keep it in step
    const [displayNone, setDisplayNone] = createSignal(!props.visible);
    const [dialog, setDialog] = createSignal<HTMLDivElement>();
    const scroll = new ReleaseHolder();
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();
    let root: HTMLDivElement | undefined;

    // shown or leaving: an unmount in this period still reports afterVisibleChange(false). The initial value only, as
    // hidden starts as !visible; the watch on hidden keeps it in step
    let shown = Boolean(props.visible);

    // getPopupContainer may query a node that exists only once the parent is inserted
    const mounted = useMounted();

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, SideSheetState>(
        SideSheetFoundation,
        props,
        () => ({}),
        (base) => {
            // a mask confined to a custom popup container leaves the rest of the page usable
            const isModal = () => Boolean(base.getProp('mask')) && coversPage(base.getProp('getPopupContainer') ?? config().getPopupContainer);
            return {
                disabledBodyScroll: () => (isModal() ? scroll.hold(lockBodyScroll) : scroll.release()),
                enabledBodyScroll: () => scroll.release(),
                notifyCancel: (e) => base.getProps().onCancel?.(e),
                notifyVisibleChange: (visible) => base.getProps().afterVisibleChange?.(visible),
                openLayer: (onEscape) => layer.hold(() => openLayer({ element: root as HTMLElement, modal: isModal(), onEscape })),
                closeLayer: () => layer.release(),
                // Solid inserts the sheet after the document loaded, so the browser does not focus its autofocus element.
                // shortcut: content under a mask confined to a custom container stays Tab-reachable,
                // upgrade to inert on the container's other children if it must become unreachable.
                trapFocus: () => {
                    const element = dialog();
                    if (!element) {
                        return;
                    }
                    if (!element.contains(FocusTrapHandle.getActiveElement(element))) {
                        FocusTrapHandle.findAutofocus(element)?.focus({ preventScroll: true });
                    }
                    focusScope.engage(element, isModal(), true);
                },
                releaseFocus: () => focusScope.deactivate(),
                // a user who moved on to the page next to a non-modal sheet keeps that focus
                restoreFocus: () => focusScope.restoreIfAllowed(dialog(), isModal(), true),
                toggleDisplayNone: (hidden) => setDisplayNone(hidden),
            };
        }
    );

    const visible = createMemo(() => props.visible);
    const hidden = createMemo(() => (visible() ? false : !props.motion || displayNone()));

    // the mask and the content animate separately and either duration may be customized, so both report
    const mask = useCSSAnimation({
        startClassName: () => (visible() ? `${prefixCls}-animation-mask_show` : `${prefixCls}-animation-mask_hide`),
        motion: () => props.motion,
        onAnimationEnd: () => foundation.toggleDisplayNone(!props.visible),
    });

    const content = useCSSAnimation({
        startClassName: () => (visible() ? `${prefixCls}-animation-content_show_${props.placement}` : `${prefixCls}-animation-content_hide_${props.placement}`),
        motion: () => props.motion,
        onAnimationEnd: () => foundation.toggleDisplayNone(!props.visible),
    });

    const shouldRender = () => visible() || props.keepDOM || (props.motion && !hidden());

    const isHorizontal = () => props.placement === 'top' || props.placement === 'bottom';

    const inBody = () => coversPage(props.getPopupContainer ?? config().getPopupContainer);

    const rootClass = () =>
        clsx(prefixCls, local.class, {
            [`${prefixCls}-${props.placement}`]: props.placement,
            [`${prefixCls}-popup`]: !inBody(),
            [`${prefixCls}-horizontal`]: isHorizontal(),
            [`${prefixCls}-hidden`]: props.keepDOM && hidden(),
        });

    const attachRoot = (node: HTMLDivElement) => {
        root = node;
    };

    const attachDialog = (node: HTMLDivElement) => {
        content.ref(node);
        setDialog(node);
        onCleanup(() => setDialog(undefined));
    };

    const onClose = (event: MouseEvent) => foundation.handleCancel(event);

    useRecordFocus(focusScope, visible);

    // an interrupted leave must start from the shown state, or the next close would unmount at once
    createRenderEffect(
        on(visible, (isVisible) => {
            if (isVisible) {
                setDisplayNone(false);
            }
        })
    );

    // The dialog is tracked, so the sheet takes the layer, scroll lock and focus once its content is in the document
    createEffect(() => {
        const element = dialog();
        if (!visible() || !element) {
            return;
        }
        untrack(() => {
            foundation.beforeShow();
            warnIfDialogUnnamed(element, 'SideSheet');
        });
        onCleanup(foundation.afterHide);
    });

    useWatch(hidden, (isHidden) => {
        shown = !isHidden;
        foundation.onVisibleChange(!isHidden);
    });

    onCleanup(() => {
        if (shown) {
            foundation.onVisibleChange(false);
        }
    });

    return (
        <Show when={mounted() && shouldRender()}>
            <PopupPortal getPopupContainer={local.getPopupContainer} zIndex={local.zIndex} inBody={inBody()}>
                <SideSheetContent
                    {...rest}
                    ref={mergeRefs(local.ref, attachRoot)}
                    class={rootClass()}
                    dialogClass={content.className()}
                    maskClass={mask.className()}
                    bodyStyle={local.bodyStyle}
                    headerStyle={local.headerStyle}
                    maskStyle={local.maskStyle}
                    style={local.style}
                    title={local.title}
                    closable={local.closable}
                    closeIcon={local.closeIcon}
                    dialogRef={attachDialog}
                    maskRef={mask.ref}
                    footer={local.footer}
                    mask={local.mask}
                    maskClosable={local.maskClosable}
                    modal={local.mask && inBody()}
                    sheetSize={SideSheetFoundation.getSheetSize(props)}
                    size={local.size}
                    onClose={onClose}
                >
                    {local.children}
                </SideSheetContent>
            </PopupPortal>
        </Show>
    );
}
