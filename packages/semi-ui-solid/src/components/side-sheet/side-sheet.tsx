import { type JSX, Show, createMemo, createRenderEffect, createSignal, on, onCleanup, splitProps } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, type SideSheetPart } from '@fibrae/semi-foundation/components/side-sheet/constants';
import SideSheetFoundation, { type Placement, type SideSheetAdapter, type SideSheetState } from '@fibrae/semi-foundation/components/side-sheet/side-sheet-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/side-sheet/side-sheet.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useCSSAnimation, PopupPortal } from '../../internal/index';
import { useMounted, useOverlayResources, useWatch } from '../../primitives/index';
import { mergeRefs } from '../../utils/index';
import useConfig from '../config-provider/use-config';
import SideSheetContent from './side-sheet-content';

const prefixCls = cssClasses.PREFIX;

type Style = JSX.CSSProperties | string;

export interface SideSheetProps extends ElementProps<'div', 'title' | 'onCancel'> {
    /** Reports the sheet as shown when its enter animation ends and as hidden when its leave animation ends */
    afterVisibleChange?: (isVisible: boolean) => void;
    /** Lets `width` apply to a top or bottom sheet */
    canVerticalSetWidth?: boolean;
    /** `content` is the role="dialog" element */
    classNames?: Partial<Record<SideSheetPart, string>>;
    styles?: Partial<Record<SideSheetPart, Style>>;
    closable?: boolean;
    closeIcon?: JSX.Element;
    closeOnEsc?: boolean;
    disableScroll?: boolean;
    footer?: JSX.Element;
    getPopupContainer?: () => HTMLElement;
    height?: number | string;
    keepDOM?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
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
type FoundationProps = Omit<SideSheetProps, 'styles' | 'style'>;
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
        'canVerticalSetWidth',
        'class',
        'classNames',
        'closable',
        'closeIcon',
        'closeOnEsc',
        'disableScroll',
        'children',
        'footer',
        'getPopupContainer',
        'height',
        'keepDOM',
        'mask',
        'maskClosable',
        'motion',
        'onCancel',
        'placement',
        'ref',
        'size',
        'style',
        'styles',
        'title',
        'visible',
        'width',
        'zIndex',
    ]);

    const config = useConfig();

    // the initial value only: the effects below and the end of the animations keep it in step
    const [displayNone, setDisplayNone] = createSignal(!props.visible);
    const [dialog, setDialog] = createSignal<HTMLDivElement>();
    let root: HTMLDivElement | undefined;

    // getPopupContainer may query a node that exists only once the parent is inserted
    const mounted = useMounted();

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, SideSheetState>(
        SideSheetFoundation,
        props,
        () => SideSheetFoundation.getInitialState(),
        (base) => ({
            notifyCancel: (e) => base.getProps().onCancel?.(e),
            notifyAfterVisibleChange: (isVisible) => base.getProps().afterVisibleChange?.(isVisible),
            getRoot: () => root,
            getDialog: () => dialog(),
        }),
        { context: config }
    );

    const visible = createMemo(() => props.visible);

    // the mask and the content animate separately and either duration may be customized, so both report
    const mask = useCSSAnimation({
        startClassName: () => (visible() ? `${prefixCls}-animation-mask_show` : `${prefixCls}-animation-mask_hide`),
        motion: () => props.motion,
        onAnimationEnd: () => setDisplayNone(!props.visible),
    });

    const content = useCSSAnimation({
        startClassName: () => (visible() ? `${prefixCls}-animation-content_show_${props.placement}` : `${prefixCls}-animation-content_hide_${props.placement}`),
        motion: () => props.motion,
        onAnimationEnd: () => {
            setDisplayNone(!props.visible);
            foundation.handleAnimationEnd();
        },
    });

    const hidden = createMemo(() => (visible() ? false : !props.motion || displayNone()));

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

    // The dialog is tracked, so the sheet takes the layer, scroll lock and focus once its content is in the document
    useOverlayResources(foundation, visible, () => Boolean(dialog() && !hidden()));

    // an interrupted leave must start from the shown state, or the next close would unmount at once
    createRenderEffect(
        on(visible, (isVisible) => {
            if (isVisible) {
                setDisplayNone(false);
            }
        })
    );

    useWatch(hidden, foundation.handleHiddenChange);

    // the server disposes the root without ever showing the sheet
    if (!isServer) {
        onCleanup(() => foundation.handleHiddenChange(true));
    }

    return (
        <Show when={mounted() && shouldRender()}>
            <PopupPortal getPopupContainer={local.getPopupContainer} zIndex={local.zIndex}>
                <SideSheetContent
                    {...rest}
                    ref={mergeRefs(local.ref, attachRoot)}
                    class={rootClass()}
                    classNames={{ ...local.classNames, mask: clsx(mask.className(), local.classNames?.mask), content: clsx(content.className(), local.classNames?.content) }}
                    styles={local.styles}
                    style={local.style}
                    title={local.title}
                    closable={local.closable}
                    closeIcon={local.closeIcon}
                    dialogRef={attachDialog}
                    maskRef={mask.ref}
                    footer={local.footer}
                    mask={local.mask}
                    maskClosable={local.maskClosable}
                    modal={SideSheetFoundation.isModal({ mask: local.mask, inBody: inBody() })}
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
