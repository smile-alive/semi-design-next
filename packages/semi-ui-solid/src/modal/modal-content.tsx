import { type JSX, Match, Show, Switch, children, createEffect, createMemo, createUniqueId, on, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
import ModalContentFoundation, { type ModalContentAdapter, isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
import type { Size } from '@fibrae/semi-foundation/modal/modal-foundation';
import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { IconClose } from '@fibrae/semi-icons-solid';
import { splitControlAttrs } from '../_base/control-attrs';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useFoundation from '../_base/use-foundation';
import useRecordFocus from '../_base/use-record-focus';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import Typography from '../typography';

export interface ModalContentProps extends JSX.AriaAttributes {
    /** Whether the dialog is shown: from opening until the leave animation ends */
    open: boolean;
    onClose: (e: MouseEvent | KeyboardEvent) => void;
    /** Whether the dialog renders into body rather than a custom container */
    inBody: boolean;
    /** On the outer element */
    ref?: (element: HTMLDivElement) => void;
    class?: string;
    contentClassName?: string;
    /** On the role="dialog" element, which plays the content animation */
    contentRef?: (element: HTMLDivElement) => void;
    maskClassName?: string;
    maskRef?: (element: HTMLDivElement) => void;
    children?: JSX.Element;
    modalRender?: (node: JSX.Element) => JSX.Element;
    bodyStyle?: JSX.CSSProperties | string;
    maskStyle?: JSX.CSSProperties | string;
    /** On the `.semi-modal` box */
    style?: JSX.CSSProperties | string;
    centered?: boolean;
    closable?: boolean;
    closeIcon?: JSX.Element;
    closeOnEsc?: boolean;
    direction?: 'ltr' | 'rtl';
    footer?: JSX.Element;
    header?: JSX.Element;
    height?: string | number;
    icon?: JSX.Element;
    /** The default footer button (its `data-type`) focused on opening when the content holds no focused element */
    initialFocus?: 'ok' | 'cancel';
    isFullScreen?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    maskFixed?: boolean;
    preventScroll?: boolean;
    role?: 'dialog' | 'alertdialog';
    size?: Size;
    title?: JSX.Element;
    width?: string | number;
}

// the foundation reads closeOnEsc and onClose only; its style types are React's
type FoundationProps = Omit<ModalContentProps, 'style' | 'bodyStyle' | 'maskStyle'>;
type Foundation = ModalContentFoundation<FoundationProps, MouseEvent>;
type Adapter = ModalContentAdapter<FoundationProps, MouseEvent>;

const prefix = cssClasses.DIALOG;
const isAriaKey = (key: string): key is `aria-${string}` => key.startsWith('aria-');

export default function ModalContent(props: ModalContentProps) {
    const [local, others] = splitProps(props, [
        'ref',
        'open',
        'onClose',
        'inBody',
        'class',
        'contentClassName',
        'contentRef',
        'maskClassName',
        'maskRef',
        'children',
        'modalRender',
        'bodyStyle',
        'maskStyle',
        'style',
        'centered',
        'closable',
        'closeIcon',
        'closeOnEsc',
        'direction',
        'footer',
        'header',
        'height',
        'icon',
        'initialFocus',
        'isFullScreen',
        'mask',
        'maskClosable',
        'maskFixed',
        'preventScroll',
        'role',
        'size',
        'title',
        'width',
    ]);

    // every aria-* lands on the dialog element (F12), the other unknown props on the outer element
    const [dialogAria, rest] = splitControlAttrs(others, isAriaKey);

    const locale = useLocale('Modal');

    const focusScope = new FocusScope();
    const layer = new ReleaseHolder();
    let root: HTMLDivElement | undefined;
    let dialog: HTMLDivElement | undefined;

    // the first element outside the default footer that held focus when the dialog opened
    let bodyFocus: HTMLElement | null = null;

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, object>(
        ModalContentFoundation,
        props,
        () => ({}),
        () => ({
            notifyClose: (e) => props.onClose(e),
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: root as HTMLDivElement, modal: isModal(props), onEscape })),
            closeLayer: () => layer.release(),
            trapFocus: () => {
                if (!dialog) {
                    return;
                }
                const footer = dialog.querySelector(`:scope > .${prefix}-footer`);
                const active = FocusTrapHandle.getActiveElement(dialog);
                // Solid never focuses an inserted autofocus element, and a component's mount-time focus acts once, so
                // a keepDOM reopen refocuses the body element the first open focused, else autofocus, else the default
                // button; FocusScope would otherwise focus the tabIndex=-1 dialog first. Known limit: keepDOM with
                // lazyRender={false} that starts hidden mounts under display:none, where mount-time focus fails.
                if (dialog.contains(active)) {
                    if (!bodyFocus && active !== dialog && !footer?.contains(active)) {
                        bodyFocus = active;
                    }
                } else {
                    FocusTrapHandle.pickInitialFocus(dialog, { remembered: bodyFocus, autofocus: true, footer, initialFocus: local.initialFocus })?.focus({ preventScroll: local.preventScroll });
                }
                focusScope.engage(dialog, isModal(props), local.preventScroll);
            },
            releaseFocus: () => {
                dialog?.blur();
                focusScope.deactivate();
            },
            restoreFocus: () => focusScope.restoreIfAllowed(dialog, isModal(props), local.preventScroll),
        })
    );

    const dialogId = `dialog-${createUniqueId()}`;
    const open = createMemo(() => local.open);
    const header = children(() => local.header);
    const footer = children(() => local.footer);
    const closeIcon = children(() => local.closeIcon);

    const hasHeaderProp = () => header() !== undefined;

    // a custom header replaces the title and the icon, so they are not read at all then
    const title = children(() => (hasHeaderProp() ? undefined : local.title));
    const icon = children(() => (hasHeaderProp() ? undefined : local.icon));

    const hasTitle = () => title() != null;

    const hasIcon = () => hasContent(icon());

    // the title exists only in the default header; an aria-label must not be shadowed by a generated reference
    const labelledBy = () => dialogAria['aria-labelledby'] ?? (!dialogAria['aria-label'] && !hasHeaderProp() && hasTitle() ? `${dialogId}-title` : undefined);

    const heightSet = () => {
        const style = local.style;
        return Boolean(local.height) || (typeof style === 'string' ? /(^|;)\s*height\s*:/.test(style) : style?.height !== undefined);
    };

    const dialogStyle = (): JSX.CSSProperties | string | undefined => {
        const size: JSX.CSSProperties = local.isFullScreen
            ? { width: '100%', height: '100%', margin: 'unset' }
            : {
                  ...(local.width ? { width: toCssLength(local.width) } : {}),
                  ...(local.height ? { height: toCssLength(local.height) } : {}),
              };
        const own = local.style;
        if (typeof own === 'string') {
            return [own, ...Object.entries(size).map(([key, value]) => `${key}: ${value}`)].join('; ');
        }
        return { ...own, ...size };
    };

    const closer = () => (
        <Show when={local.closable}>
            <IconButton type="tertiary" class={`${prefix}-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={hasContent(closeIcon()) ? closeIcon() : <IconClose x-semi-prop="closeIcon" />} onClick={(e) => foundation.close(e)} />
        </Show>
    );

    const iconNode = () => (
        <Show when={hasIcon()}>
            <span class={`${prefix}-icon-wrapper`} x-semi-prop="icon">
                {icon()}
            </span>
        </Show>
    );

    const bodyNode = () => (
        <div class={clsx(`${prefix}-body`, { [`${prefix}-withIcon`]: hasIcon() })} style={local.bodyStyle} x-semi-prop="children">
            {local.children}
        </div>
    );

    // a factory: the modalRender branch and the plain one each get their own element
    const renderDialog = () => (
        <div
            {...dialogAria}
            ref={mergeRefs(local.contentRef, (node: HTMLDivElement) => (dialog = node))}
            class={clsx(`${prefix}-content`, local.contentClassName, {
                [`${prefix}-content-fullScreen`]: local.isFullScreen,
                [`${prefix}-content-height-set`]: heightSet(),
            })}
            aria-labelledby={labelledBy()}
            aria-modal={dialogAria['aria-modal'] ?? (isModal(props) ? 'true' : undefined)}
            role={local.role ?? 'dialog'}
            tabIndex={-1}
        >
            <Switch>
                <Match when={hasHeaderProp()}>{header()}</Match>
                <Match when={hasTitle()}>
                    <div class={`${prefix}-header`}>
                        {iconNode()}
                        {/* h5 look, h2 outline: the sheet's title is level 2 as well */}
                        <Typography.Title id={`${dialogId}-title`} component="h2" class={`${prefix}-title`} heading={5} x-semi-prop="title">
                            {title()}
                        </Typography.Title>
                        {closer()}
                    </div>
                </Match>
            </Switch>
            <Show
                when={hasTitle() || hasHeaderProp()}
                fallback={
                    <div class={`${prefix}-body-wrapper`}>
                        {iconNode()}
                        {bodyNode()}
                        {closer()}
                    </div>
                }
            >
                {bodyNode()}
            </Show>
            <Show when={hasContent(footer())}>
                <div class={`${prefix}-footer`} x-semi-prop="footer">
                    {footer()}
                </div>
            </Show>
        </div>
    );

    // Built before the effects below: the content's components register their onMount (an autofocusing Input) while it
    // is created, and the dialog must see where they put focus before it picks the initial focus
    const view = (
        <div
            {...rest}
            // the portal carries the context direction; the Modal's own direction overrides it
            dir={local.direction}
            ref={mergeRefs(local.ref, (node: HTMLDivElement) => (root = node))}
            class={clsx(local.class, {
                [`${prefix}-no-mask`]: !local.mask,
                [`${prefix}-popup`]: !local.inBody && !local.maskFixed,
                [`${prefix}-fixed`]: local.maskFixed,
            })}
        >
            <Show when={local.mask}>
                <div ref={(node) => local.maskRef?.(node)} class={clsx(`${prefix}-mask`, local.maskClassName)} style={local.maskStyle} />
            </Show>
            <div
                class={clsx(`${prefix}-wrap`, { [`${prefix}-wrap-center`]: local.centered })}
                role="none"
                onClick={(e) => {
                    if (local.maskClosable) {
                        foundation.handleMaskClick(e);
                    }
                }}
                onMouseUp={() => {
                    if (local.maskClosable) {
                        foundation.handleMaskMouseUp();
                    }
                }}
            >
                <div
                    id={dialogId}
                    class={clsx(prefix, {
                        [`${prefix}-centered`]: local.centered,
                        [`${prefix}-${local.size}`]: local.size,
                    })}
                    style={dialogStyle()}
                    // only the mask's mouseup clears the mark, so mark only while it listens
                    onMouseDown={() => {
                        if (local.maskClosable) {
                            foundation.handleDialogMouseDown();
                        }
                    }}
                >
                    <Show keyed when={local.modalRender} fallback={renderDialog()}>
                        {(render) => render(renderDialog())}
                    </Show>
                </div>
            </div>
        </div>
    );

    useRecordFocus(focusScope, open);

    createEffect(
        on(open, (isOpen) => {
            if (!isOpen) {
                return;
            }
            foundation.show();
            warnIfDialogUnnamed(dialog ?? null, 'Modal');
            onCleanup(() => foundation.hide());
        })
    );

    return view;
}
