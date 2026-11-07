import type React from 'react';
import { type ReactNode, useId, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/components/user-guide/constants';
import UserGuideFoundation, { type UserGuideAdapter, type UserGuideBaseState } from '@fibrae/semi-foundation/components/user-guide/foundation';
import '@fibrae/semi-foundation/components/user-guide/user-guide.scss';
import type { BaseProps } from '../_base/base-component';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import Button, { type ButtonProps } from '../button';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import Modal from '../modal';
import Popover, { type PopoverHandle } from '../popover';
import type { Position } from '../tooltip/index';

type Foundation = UserGuideFoundation<UserGuideProps>;
type Adapter = UserGuideAdapter<UserGuideProps>;

const prefixCls = cssClasses.PREFIX;
const modalPrefixCls = cssClasses.PREFIX_MODAL;

export interface UserGuideProps extends BaseProps {
    className?: string;
    current?: number;
    finishText?: string;
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
    showPrevButton?: boolean;
    showSkipButton?: boolean;
    spotlightPadding?: number;
    steps: StepItem[];
    style?: React.CSSProperties;
    theme?: 'default' | 'primary';
    visible?: boolean;
    getPopupContainer?: () => HTMLElement;
    zIndex?: number;
}

export interface StepItem {
    className?: string;
    cover?: ReactNode;
    target?: (() => Element | null | undefined) | Element | null;
    title?: string | ReactNode;
    description?: React.ReactNode;
    mask?: boolean;
    showArrow?: boolean;
    spotlightPadding?: number;
    theme?: 'default' | 'primary';
    position?: Position;
}

export type { UserGuideBaseState as UserGuideState };

const defaultProps = {
    mask: true,
    mode: 'popup',
    nextButtonProps: {},
    position: 'bottom',
    prevButtonProps: {},
    showPrevButton: true,
    showSkipButton: true,
    theme: 'default',
    visible: false,
    zIndex: numbers.DEFAULT_Z_INDEX,
} satisfies Partial<UserGuideProps>;

// A non-modal popup step would be reached after the whole page, so its card focuses the primary button on mount.
// Module level, so the ref runs only on mount.
function focusOnMount(node: HTMLButtonElement | null) {
    node?.focus({ preventScroll: true });
}

function withBuiltIn(custom: ButtonProps | undefined, handle: () => void, builtInStyle?: React.CSSProperties): ButtonProps {
    const { onClick, style, ...rest } = custom ?? {};
    return {
        ...rest,
        style: builtInStyle || style ? { ...builtInStyle, ...style } : undefined,
        onClick: (e) => {
            onClick?.(e);
            handle();
        },
    };
}

export default function UserGuide(rawProps: UserGuideProps) {
    const props = useDefaultProps('UserGuide', rawProps, defaultProps);
    const { className, finishText, mask, mode, nextButtonProps, position, prevButtonProps, showPrevButton, showSkipButton, steps, style, theme, visible, zIndex, getPopupContainer } = props;

    const { locale } = useLocale('UserGuide');

    const popoverRef = useRef<PopoverHandle>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, UserGuideProps, UserGuideBaseState>(
        UserGuideFoundation,
        props,
        () => UserGuideFoundation.getInitialState(props),
        (base) => ({
            getPopup: () => popoverRef.current?.getPopup(),
            notifyChange: (current) => base.getProps().onChange?.(current),
            notifyFinish: () => base.getProps().onFinish?.(),
            notifyNext: (current) => base.getProps().onNext?.(current),
            notifyPrev: (current) => base.getProps().onPrev?.(current),
            notifySkip: () => base.getProps().onSkip?.(),
        }),
        useConfigContext()
    );

    const spotlightId = `${prefixCls}-spotlight-${useId()}`;
    const titleId = `${spotlightId}-title`;
    const { spotlightRect } = state;
    const current = UserGuideFoundation.deriveCurrent(props, state);
    const step = steps[current];
    const showMask = step?.mask ?? mask;

    // nothing rendered (popup target not measured yet) must not lock the page or take focus
    const shown = Boolean(visible && step && (mode === 'modal' || spotlightRect));

    // mode and showMask are read by the foundation's lock rule
    useLayoutEffect(() => {
        if (!shown) {
            return undefined;
        }
        foundation.beforeShow();
        return foundation.releaseScroll;
    }, [shown, mode, showMask, foundation]);

    useLayoutEffect(() => {
        if (!visible) {
            return undefined;
        }
        return foundation.afterHide;
    }, [visible, foundation]);

    // modal mode gets this from Modal
    useLayoutEffect(() => {
        if (!shown || mode !== 'popup') {
            return undefined;
        }
        foundation.recordFocus();
        return foundation.restoreFocus;
    }, [shown, mode, foundation]);

    useLayoutEffect(() => {
        if (!visible || mode !== 'popup') {
            return undefined;
        }
        foundation.measureSpotlight(true);
        const remeasure = () => foundation.measureSpotlight(false);
        window.addEventListener('resize', remeasure);
        // capture: a scroll inside any container can move the target
        window.addEventListener('scroll', remeasure, true);
        return () => {
            window.removeEventListener('resize', remeasure);
            window.removeEventListener('scroll', remeasure, true);
        };
    }, [visible, mode, current, foundation]);

    // steps, padding and the target can change without current moving; an unchanged rect sets no state
    useLayoutEffect(() => {
        if (visible && mode === 'popup') {
            foundation.measureSpotlight(false);
        }
    });

    if (!visible || !step) {
        return null;
    }

    const isFirst = current === 0;
    const isLast = current === steps.length - 1;
    const { cover, title, description } = step;

    if (mode === 'modal') {
        return (
            <Modal
                className={clsx(modalPrefixCls, className, step.className)}
                bodyStyle={{ padding: 0 }}
                style={style}
                aria-labelledby={title ? titleId : undefined}
                centered
                footer={null}
                getPopupContainer={getPopupContainer}
                header={null}
                mask={showMask}
                maskClosable={false}
                visible={visible}
                zIndex={zIndex}
                // Escape skips like the skip button; only the last step's button finishes
                onCancel={foundation.handleSkip}
            >
                {cover && (
                    <>
                        <div className={`${modalPrefixCls}-cover`}>{cover}</div>
                        <div className={`${modalPrefixCls}-indicator`} aria-hidden="true">
                            {steps.map((_, i) => (
                                <span
                                    key={i}
                                    className={clsx(`${modalPrefixCls}-indicator-item`, {
                                        [`${modalPrefixCls}-indicator-item-active`]: i === current,
                                    })}
                                    data-index={i}
                                />
                            ))}
                        </div>
                        <span className={`${modalPrefixCls}-progress`}>
                            {current + 1}/{steps.length}
                        </span>
                    </>
                )}
                {(title || description) && (
                    <div className={`${modalPrefixCls}-body`}>
                        {title && (
                            <div id={titleId} className={`${modalPrefixCls}-body-title`}>
                                {title}
                            </div>
                        )}
                        {description && <div className={`${modalPrefixCls}-body-description`}>{description}</div>}
                    </div>
                )}
                <div className={`${modalPrefixCls}-footer`}>
                    {showSkipButton && !isLast && (
                        <Button type="tertiary" onClick={foundation.handleSkip}>
                            {locale.skip}
                        </Button>
                    )}
                    {showPrevButton && !isFirst && (
                        <Button type="tertiary" {...withBuiltIn(prevButtonProps, foundation.handlePrev)}>
                            {prevButtonProps?.children || locale.prev}
                        </Button>
                    )}
                    {/* Modal's focus trap otherwise lands on the first control, which is Skip */}
                    <Button autoFocus theme="solid" {...withBuiltIn(nextButtonProps, foundation.handleNext)}>
                        {isLast ? finishText || locale.finish : nextButtonProps?.children || locale.next}
                    </Button>
                </div>
            </Modal>
        );
    }

    if (mode !== 'popup') {
        return null;
    }

    // spotlightRect comes from the layout effect; measuring here would be a layout read during render
    if (!spotlightRect) {
        return null;
    }

    const isPrimaryTheme = (step.theme ?? theme) === 'primary';
    const popupPrefixCls = `${prefixCls}-popup-content`;

    const secondaryButtonProps: ButtonProps = {
        style: isPrimaryTheme ? { backgroundColor: 'var(--semi-color-fill-2)' } : {},
        theme: isPrimaryTheme ? 'solid' : 'light',
        type: isPrimaryTheme ? 'primary' : 'tertiary',
    };

    const content = (
        <div className={clsx(popupPrefixCls, { [`${popupPrefixCls}-primary`]: isPrimaryTheme })}>
            {cover && <div className={`${popupPrefixCls}-cover`}>{cover}</div>}
            <div className={`${popupPrefixCls}-body`}>
                {title && (
                    <div id={titleId} className={`${popupPrefixCls}-title`}>
                        {title}
                    </div>
                )}
                {description && <div className={`${popupPrefixCls}-description`}>{description}</div>}
                <div className={`${popupPrefixCls}-footer`}>
                    {steps.length > 1 && (
                        <div className={`${popupPrefixCls}-indicator`}>
                            {current + 1}/{steps.length}
                        </div>
                    )}
                    <div className={`${popupPrefixCls}-buttons`}>
                        {showSkipButton && !isLast && (
                            <Button {...secondaryButtonProps} onClick={foundation.handleSkip}>
                                {locale.skip}
                            </Button>
                        )}
                        {showPrevButton && !isFirst && (
                            <Button {...secondaryButtonProps} {...withBuiltIn(prevButtonProps, foundation.handlePrev, secondaryButtonProps.style)}>
                                {prevButtonProps?.children || locale.prev}
                            </Button>
                        )}
                        <Button ref={focusOnMount} type="primary" theme={isPrimaryTheme ? 'borderless' : 'solid'} {...withBuiltIn(nextButtonProps, foundation.handleNext, isPrimaryTheme ? { backgroundColor: 'var(--semi-color-white)' } : undefined)}>
                            {isLast ? finishText || locale.finish : nextButtonProps?.children || locale.next}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Popover
                key={`userGuide-popup-${current}`}
                ref={popoverRef}
                className={clsx(`${prefixCls}-popover`, className, step.className)}
                style={{
                    padding: 0,
                    ...(isPrimaryTheme ? { backgroundColor: 'var(--semi-color-primary)' } : {}),
                    ...style,
                }}
                aria-labelledby={title ? titleId : undefined}
                content={content}
                position={step.position || position}
                showArrow={step.showArrow !== false}
                trigger="custom"
                visible={visible}
                onEscKeyDown={foundation.handleSkip}
            >
                {/* Tooltip would make the anchor a Tab stop */}
                <div
                    style={{
                        position: 'fixed',
                        left: spotlightRect.x,
                        top: spotlightRect.y,
                        width: spotlightRect.width,
                        height: spotlightRect.height,
                        pointerEvents: 'none',
                    }}
                    tabIndex={-1}
                />
            </Popover>
            {spotlightRect && (
                <svg className={`${prefixCls}-spotlight`} style={{ zIndex }}>
                    <defs>
                        <mask id={spotlightId}>
                            <rect fill="white" height="100%" width="100%" />
                            <rect className={`${prefixCls}-spotlight-rect`} fill="black" height={spotlightRect.height} rx={4} width={spotlightRect.width} x={spotlightRect.x} y={spotlightRect.y} />
                        </mask>
                    </defs>
                    {showMask && (
                        <>
                            <rect fill="var(--semi-color-overlay-bg)" height="100%" mask={`url(#${spotlightId})`} width="100%" />
                            <rect className={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={spotlightRect.y} width="100%" x={0} y={0} />
                            <rect className={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={spotlightRect.height} width={spotlightRect.x} x={0} y={spotlightRect.y} />
                            <rect className={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={spotlightRect.height} width={`calc(100% - ${spotlightRect.x + spotlightRect.width}px)`} x={spotlightRect.x + spotlightRect.width} y={spotlightRect.y} />
                            <rect className={`${prefixCls}-spotlight-transparent-rect`} fill="transparent" height={`calc(100% - ${spotlightRect.y + spotlightRect.height}px)`} width="100%" y={spotlightRect.y + spotlightRect.height} />
                        </>
                    )}
                </svg>
            )}
        </>
    );
}
