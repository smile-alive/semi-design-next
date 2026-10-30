import { type JSX, For, Show, children, createEffect, createMemo, createUniqueId, on, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/user-guide/constants';
import UserGuideFoundation, { type UserGuideAdapter } from '@fibrae/semi-foundation/user-guide/foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import '@fibrae/semi-foundation/user-guide/user-guide.scss';
import hasContent from '../_base/has-content';
import mergeStyles from '../_base/merge-styles';
import useDefaultProps from '../_base/use-default-props';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useMounted from '../_base/use-mounted';
import useWatch from '../_base/use-watch';
import Button, { type ButtonProps } from '../button';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import Modal from '../modal';
import FooterButton from '../modal/footer-button';
import Popover from '../popover';
import type { Position } from '../tooltip';

const prefixCls = cssClasses.PREFIX;
const modalPrefixCls = cssClasses.PREFIX_MODAL;
const popupPrefixCls = `${prefixCls}-popup-content`;

type Style = JSX.CSSProperties | string;

/** Undeclared attributes are dropped: the guide has no root element of its own (F11) */
export interface UserGuideProps {
    /** On the Popover card or the Modal's outer element */
    class?: string;
    current?: number;
    finishText?: string;
    getPopupContainer?: () => HTMLElement;
    mask?: boolean;
    mode?: 'popup' | 'modal';
    nextButtonProps?: ButtonProps;
    onChange?: (current: number) => void;
    onFinish?: () => void;
    onNext?: (current: number) => void;
    onPrev?: (current: number) => void;
    onSkip?: () => void;
    position?: Position;
    prevButtonProps?: ButtonProps;
    /** Cover of the current step; a step it renders nothing for has no cover area */
    renderCover?: (props: StepRenderProps) => JSX.Element;
    /** Description of the current step; empty content falls back to the step's `description` */
    renderDescription?: (props: StepRenderProps) => JSX.Element;
    /** Title of the current step; empty content falls back to the step's `title` */
    renderTitle?: (props: StepRenderProps) => JSX.Element;
    showPrevButton?: boolean;
    showSkipButton?: boolean;
    spotlightPadding?: number;
    steps: StepItem[];
    style?: Style;
    theme?: 'default' | 'primary';
    visible?: boolean;
    zIndex?: number;
}

/** Steps hold data only: content is created by the render functions for the current step alone */
export interface StepItem {
    class?: string;
    target?: (() => Element | null | undefined) | Element | null;
    title?: string;
    description?: string;
    mask?: boolean;
    showArrow?: boolean;
    spotlightPadding?: number;
    theme?: 'default' | 'primary';
    position?: Position;
}

export interface StepRenderProps {
    item: StepItem;
    index: number;
}

export interface UserGuideState {
    current: number;
    spotlightRect: DOMRect | null;
}

type Foundation = UserGuideFoundation<UserGuideProps, UserGuideState>;
type Adapter = UserGuideAdapter<UserGuideProps, UserGuideState>;

const defaultProps = {
    mask: true,
    mode: 'popup',
    position: 'bottom',
    showPrevButton: true,
    showSkipButton: true,
    theme: 'default',
    visible: false,
    zIndex: numbers.DEFAULT_Z_INDEX,
} satisfies Partial<UserGuideProps>;

export default function UserGuide(rawProps: UserGuideProps) {
    const props = useDefaultProps('UserGuide', rawProps, defaultProps);
    const [local] = splitProps(props, ['class', 'finishText', 'getPopupContainer', 'mask', 'mode', 'nextButtonProps', 'position', 'prevButtonProps', 'renderCover', 'renderDescription', 'renderTitle', 'showPrevButton', 'showSkipButton', 'steps', 'style', 'theme', 'visible', 'zIndex']);

    const locale = useLocale('UserGuide');
    const config = useConfig();

    const scroll = new ReleaseHolder();
    const focusScope = new FocusScope();
    let anchor: HTMLDivElement | undefined;

    const mounted = useMounted();

    const { foundation, state } = useFoundation<Foundation, Adapter, UserGuideProps, UserGuideState>(
        UserGuideFoundation,
        props,
        () => ({ current: props.current || numbers.DEFAULT_CURRENT, spotlightRect: null }),
        (base) => ({
            disabledBodyScroll: () => (coversPage(base.getProp('getPopupContainer') ?? config().getPopupContainer) ? scroll.hold(lockBodyScroll) : scroll.release()),
            // hiding and unmounting both call it; release is idempotent
            enabledBodyScroll: () => scroll.release(),
            notifyChange: (current) => base.getProps().onChange?.(current),
            notifyFinish: () => base.getProps().onFinish?.(),
            notifyNext: (current) => base.getProps().onNext?.(current),
            notifyPrev: (current) => base.getProps().onPrev?.(current),
            notifySkip: () => base.getProps().onSkip?.(),
            setCurrent: (current) => base.setState({ current }),
        })
    );

    const spotlightId = `${prefixCls}-spotlight-${createUniqueId()}`;
    const titleId = `${spotlightId}-title`;
    const visible = createMemo(() => Boolean(local.visible));
    const mode = createMemo(() => local.mode);
    const current = createMemo(() => UserGuideFoundation.deriveCurrent(props, state()));
    const steps = createMemo(() => local.steps);
    const spotlightPadding = createMemo(() => props.spotlightPadding);
    const step = createMemo(() => local.steps[current()] as StepItem | undefined);

    // nothing rendered (popup target not measured yet) must not lock the page or take focus
    const shown = createMemo(() => Boolean(visible() && step() && (mode() === 'modal' || state().spotlightRect)));

    // modal mode leaves locking and focus to Modal
    const popupShown = createMemo(() => shown() && mode() === 'popup');

    const showMask = () => step()?.mask ?? local.mask;

    const locksScroll = createMemo(() => popupShown() && showMask());

    const isFirst = () => current() === 0;

    const isLast = () => current() === local.steps.length - 1;

    const measuring = () => visible() && mode() === 'popup';

    const isPrimaryTheme = () => (step()?.theme ?? local.theme) === 'primary';

    // read only under the guard that the step exists
    const item = () => step() as StepItem;

    // read only under the guard that the target was measured
    const rect = () => state().spotlightRect as DOMRect;

    // only a step change scrolls, so a user scroll is followed, not fought
    const measure = (scrollIntoView: boolean) => {
        const next = UserGuideFoundation.measure(local.steps[current()], props.spotlightPadding, scrollIntoView);
        if (!UserGuideFoundation.isSameRect(state().spotlightRect, next)) {
            foundation.setState({ spotlightRect: next });
        }
    };

    const remeasure = () => measure(false);

    // a user who clicked elsewhere keeps their focus
    const restoreFocus = (target?: Element) => {
        // closest() stops at a shadow boundary, so the card is looked up from the focus as the card's tree sees it
        focusScope.restoreIfAllowed(FocusTrapHandle.getActiveElement(target)?.closest<HTMLElement>(`.${prefixCls}-popover`), false, true);
    };

    const syncCurrent = () => {
        if (props.current !== undefined) {
            foundation.setState({ current: props.current });
        }
    };

    const prevText = () => local.prevButtonProps?.children || locale().locale.prev;

    const nextText = () => (isLast() ? local.finishText || locale().locale.finish : local.nextButtonProps?.children || locale().locale.next);

    // Called in the shown card only, so the render functions create the current step's content alone; resolved once,
    // the checks and the insertion read the same nodes
    const stepContent = () => {
        const args = (): StepRenderProps => ({ item: item(), index: current() });
        const cover = children(() => local.renderCover?.(args()));
        const customTitle = children(() => local.renderTitle?.(args()));
        const customDescription = children(() => local.renderDescription?.(args()));
        const title = () => (hasContent(customTitle()) ? customTitle() : item().title);
        const description = () => (hasContent(customDescription()) ? customDescription() : item().description);
        return { cover, title, description };
    };

    const renderModal = () => {
        const { cover, title, description } = stepContent();
        return (
            <Modal
                class={clsx(modalPrefixCls, local.class, item().class)}
                bodyStyle={{ padding: '0' }}
                style={local.style}
                aria-labelledby={hasContent(title()) ? titleId : undefined}
                centered
                footer={null}
                getPopupContainer={local.getPopupContainer}
                header={null}
                mask={showMask()}
                maskClosable={false}
                visible
                zIndex={local.zIndex}
                // Escape skips like the skip button; only the last step's button finishes
                onCancel={foundation.handleSkip}
            >
                <Show when={hasContent(cover())}>
                    <div class={`${modalPrefixCls}-cover`}>{cover()}</div>
                    <div class={`${modalPrefixCls}-indicator`} aria-hidden="true">
                        <For each={local.steps}>{(_, i) => <span class={clsx(`${modalPrefixCls}-indicator-item`, { [`${modalPrefixCls}-indicator-item-active`]: i() === current() })} data-index={i()} />}</For>
                    </div>
                    <span class={`${modalPrefixCls}-progress`}>
                        {current() + 1}/{local.steps.length}
                    </span>
                </Show>
                <Show when={hasContent(title()) || hasContent(description())}>
                    <div class={`${modalPrefixCls}-body`}>
                        <Show when={hasContent(title())}>
                            <div id={titleId} class={`${modalPrefixCls}-body-title`}>
                                {title()}
                            </div>
                        </Show>
                        <Show when={hasContent(description())}>
                            <div class={`${modalPrefixCls}-body-description`}>{description()}</div>
                        </Show>
                    </div>
                </Show>
                <div class={`${modalPrefixCls}-footer`}>
                    <Show when={local.showSkipButton && !isLast()}>
                        <Button type="tertiary" onClick={foundation.handleSkip}>
                            {locale().locale.skip}
                        </Button>
                    </Show>
                    <Show when={local.showPrevButton && !isFirst()}>
                        <FooterButton type="tertiary" own={local.prevButtonProps} onPress={foundation.handlePrev}>
                            {prevText()}
                        </FooterButton>
                    </Show>
                    {/* Modal's focus trap otherwise lands on the first control, which is Skip */}
                    <FooterButton autofocus theme="solid" own={local.nextButtonProps} onPress={foundation.handleNext}>
                        {nextText()}
                    </FooterButton>
                </div>
            </Modal>
        );
    };

    const renderPopup = () => {
        const { cover, title, description } = stepContent();
        const secondary = (): ButtonProps => ({ theme: isPrimaryTheme() ? 'solid' : 'light', type: isPrimaryTheme() ? 'primary' : 'tertiary' });
        const content = (
            <div class={clsx(popupPrefixCls, { [`${popupPrefixCls}-primary`]: isPrimaryTheme() })}>
                <Show when={hasContent(cover())}>
                    <div class={`${popupPrefixCls}-cover`}>{cover()}</div>
                </Show>
                <div class={`${popupPrefixCls}-body`}>
                    <Show when={hasContent(title())}>
                        <div id={titleId} class={`${popupPrefixCls}-title`}>
                            {title()}
                        </div>
                    </Show>
                    <Show when={hasContent(description())}>
                        <div class={`${popupPrefixCls}-description`}>{description()}</div>
                    </Show>
                    <div class={`${popupPrefixCls}-footer`}>
                        <Show when={local.steps.length > 1}>
                            <div class={`${popupPrefixCls}-indicator`}>
                                {current() + 1}/{local.steps.length}
                            </div>
                        </Show>
                        <div class={`${popupPrefixCls}-buttons`}>
                            <Show when={local.showSkipButton && !isLast()}>
                                <Button {...secondary()} style={isPrimaryTheme() ? { 'background-color': 'var(--semi-color-fill-2)' } : undefined} onClick={foundation.handleSkip}>
                                    {locale().locale.skip}
                                </Button>
                            </Show>
                            <Show when={local.showPrevButton && !isFirst()}>
                                <FooterButton {...secondary()} own={local.prevButtonProps} baseStyle={isPrimaryTheme() ? { 'background-color': 'var(--semi-color-fill-2)' } : undefined} onPress={foundation.handlePrev}>
                                    {prevText()}
                                </FooterButton>
                            </Show>
                            {/* a non-modal step is reached after the whole page, so the card focuses its primary button */}
                            <FooterButton autofocus type="primary" theme={isPrimaryTheme() ? 'borderless' : 'solid'} own={local.nextButtonProps} baseStyle={isPrimaryTheme() ? { 'background-color': 'var(--semi-color-white)' } : undefined} onPress={foundation.handleNext}>
                                {nextText()}
                            </FooterButton>
                        </div>
                    </div>
                </div>
            </div>
        );
        return (
            <Popover
                class={clsx(`${prefixCls}-popover`, local.class, item().class)}
                style={mergeStyles({ padding: '0', ...(isPrimaryTheme() ? { 'background-color': 'var(--semi-color-primary)' } : {}) }, local.style)}
                aria-labelledby={hasContent(title()) ? titleId : undefined}
                content={content}
                position={item().position || local.position}
                showArrow={item().showArrow !== false}
                trigger="custom"
                visible
                onEscKeyDown={foundation.handleSkip}
            >
                {/* Tooltip would make the anchor a Tab stop */}
                {(t) => <div {...t({ tabIndex: -1, ref: (node: HTMLDivElement) => (anchor = node) })} style={{ position: 'fixed', left: `${rect().x}px`, top: `${rect().y}px`, width: `${rect().width}px`, height: `${rect().height}px`, 'pointer-events': 'none' }} />}
            </Popover>
        );
    };

    const renderSpotlight = () => (
        <svg class={`${prefixCls}-spotlight`} style={{ 'z-index': local.zIndex }}>
            <defs>
                <mask id={spotlightId}>
                    <rect fill="white" height="100%" width="100%" />
                    <rect class={`${prefixCls}-spotlight-rect`} fill="black" height={rect().height} rx={4} width={rect().width} x={rect().x} y={rect().y} />
                </mask>
            </defs>
            <Show when={showMask()}>
                <rect fill="var(--semi-color-overlay-bg)" height="100%" mask={`url(#${spotlightId})`} width="100%" />
                <rect class={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={rect().y} width="100%" x={0} y={0} />
                <rect class={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={rect().height} width={rect().x} x={0} y={rect().y} />
                <rect class={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={rect().height} width={`calc(100% - ${rect().x + rect().width}px)`} x={rect().x + rect().width} y={rect().y} />
                <rect class={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={`calc(100% - ${rect().y + rect().height}px)`} width="100%" y={rect().y + rect().height} />
            </Show>
        </svg>
    );

    createEffect(
        on(locksScroll, (locks) => {
            if (!locks) {
                return;
            }
            foundation.beforeShow();
            onCleanup(foundation.releaseScroll);
        })
    );

    createEffect(
        on(visible, (isVisible) => {
            if (isVisible) {
                onCleanup(foundation.afterHide);
            }
        })
    );

    // Mirrored into state so going uncontrolled continues from the last controlled step; after the hide effect, so a
    // hide keeps the controlled step
    useWatch(() => props.current, syncCurrent);
    useWatch(visible, syncCurrent);

    // modal mode gets this from Modal
    createEffect(
        on(popupShown, (isShown) => {
            if (!isShown) {
                return;
            }
            focusScope.record();
            // the node is read now: the anchor unmounts before this cleanup runs
            const target = anchor;
            onCleanup(() => restoreFocus(target));
        })
    );

    useEventListener(() => window, 'resize', remeasure, { enabled: measuring });

    // capture: a scroll inside any container can move the target
    useEventListener(() => window, 'scroll', remeasure, { capture: true, enabled: measuring });

    createEffect(
        on([measuring, current], ([isMeasuring]) => {
            if (isMeasuring) {
                measure(true);
            }
        })
    );

    // shortcut: a target that moves with no reactive change here is not noticed until the next scroll or resize, upgrade
    // to a ResizeObserver on the target when a real use needs it. Deferred: the effect above already measures with the
    // steps of its first run
    createEffect(
        on(
            [steps, spotlightPadding],
            () => {
                if (measuring()) {
                    measure(false);
                }
            },
            { defer: true }
        )
    );

    return (
        <Show when={visible() && step()}>
            <Show
                when={mode() === 'modal'}
                fallback={
                    <Show when={mode() === 'popup' && state().spotlightRect}>
                        {/* a new step mounts a new card, as each step is its own popup */}
                        <For each={[current()]}>{() => renderPopup()}</For>
                        {renderSpotlight()}
                    </Show>
                }
            >
                {/* the dialog opens after mount, and its step content created during hydration would have no markup to claim */}
                <Show when={mounted()}>{renderModal()}</Show>
            </Show>
        </Show>
    );
}
