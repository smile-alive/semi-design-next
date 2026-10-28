import type React from 'react';
import { useId, useRef } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/slider/constants';
import SliderFoundation, { type SliderAdapter, type SliderProps as BasicSliderProps, type SliderState } from '@fibrae/semi-foundation/slider/foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import '@fibrae/semi-foundation/slider/slider.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip/index';

const prefixCls = cssClasses.PREFIX;

export interface SliderProps extends BasicSliderProps, ElementProps<'div', 'defaultValue' | 'onChange' | 'onMouseUp'> {
    /** A mark's label; any node, rendered next to the mark and in its tooltip */
    marks?: Record<number, React.ReactNode>;
    /** Names the first handle's input, so a `<label htmlFor>` focuses the slider */
    id?: string;
    /** Attached to the `.semi-slider-wrapper` div */
    title?: string;
    /** Attached to the `.semi-slider-wrapper` div; fires for focus on either handle */
    onFocus?: React.FocusEventHandler<HTMLDivElement>;
    style?: React.CSSProperties;
    railStyle?: React.CSSProperties;
    /** Attached to the `.semi-slider-wrapper` div */
    ref?: React.Ref<HTMLDivElement>;
}

export type { SliderState };

const defaultProps = {
    disabled: false,
    showMarkLabel: true,
    tooltipOnMark: false,
    included: true,
    max: 100,
    min: 0,
    range: false,
    showArrow: true,
    step: 1,
    tipFormatter: (value: number) => value,
    vertical: false,
    showBoundary: false,
    onAfterChange: noop,
    onChange: noop,
    verticalReverse: false,
} satisfies Partial<SliderProps>;

export default function Slider(rawProps: SliderProps) {
    const props = useDefaultProps('Slider', rawProps, defaultProps);

    const {
        ref,
        defaultValue,
        disabled,
        showMarkLabel,
        included,
        marks,
        max,
        min,
        range,
        step,
        tipFormatter,
        value,
        vertical,
        onAfterChange,
        onChange,
        onMouseUp,
        tooltipOnMark,
        tooltipVisible,
        style,
        showArrow,
        className,
        showBoundary,
        railStyle,
        verticalReverse,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuetext': ariaValueText,
        getAriaValueText,
        handleDot,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        name,
        // the slider role supports no aria-required
        'aria-required': ariaRequired,
        tabIndex,
        id,
        autoFocus,
        validateStatus,
        insetLabel,
        insetLabelId,
        onBlur,
        onKeyDown,
        ...rest
    } = props as SliderProps &
        React.AriaAttributes & {
            tabIndex?: number;
            validateStatus?: unknown;
            insetLabel?: unknown;
            insetLabelId?: unknown;
            onBlur?: React.FocusEventHandler<HTMLDivElement>;
        };

    const { locale } = useLocale('Slider');
    const context = useConfigContext();

    const generatedId = useId();
    const sliderRef = useRef<HTMLDivElement>(null);
    const minInputRef = useRef<HTMLInputElement>(null);
    const maxInputRef = useRef<HTMLInputElement>(null);

    const [foundation, state] = useFoundation<SliderFoundation<BasicSliderProps>, SliderAdapter<BasicSliderProps>, BasicSliderProps, SliderState>(
        SliderFoundation,
        props,
        () => SliderFoundation.getInitialState(props),
        (base) => ({
            getSliderNode: () => sliderRef.current,
            notifyChange: (value) => base.getProps().onChange(value),
            notifyAfterChange: (value) => base.getProps().onAfterChange(value),
            notifyMouseUp: (e) => base.getProps().onMouseUp?.(e),
        }),
        context
    );

    const mergedRef = useMergedRef(ref, sliderRef);
    const { currentValue, chooseMovePos, isDrag, isInRenderTree, focusVisibleHandle } = state;
    const isRTL = context.direction === 'rtl' && !vertical;
    const stylePos = vertical ? 'top' : isRTL ? 'right' : 'left';
    const { min: minPercent, max: maxPercent } = SliderFoundation.getMinAndMaxPercent(props, currentValue);
    const { tipVisible, tipChildren } = SliderFoundation.computeHandleVisibleVal(props, state);
    const markKeys = marks ? Object.keys(marks) : [];
    const reverse = vertical && verticalReverse ? '-reverse' : '';
    const trackSize = range ? `${Math.abs(maxPercent - minPercent) * 100}%` : `${minPercent * 100}%`;
    const trackStart = range ? `${Math.min(minPercent, maxPercent) * 100}%` : 0;
    const trackStyle: React.CSSProperties = included ? { [vertical ? 'height' : 'width']: trackSize, [stylePos]: trackStart } : {};

    const renderHandle = (pos: 'min' | 'max') => {
        const index = pos === 'min' ? 0 : 1;
        const handleValue = range ? currentValue[index] : (currentValue as number);
        const dot = Array.isArray(handleDot) ? handleDot[index] : handleDot;
        const active = chooseMovePos === pos && (range || isDrag);
        const inputRef = pos === 'min' ? minInputRef : maxInputRef;
        const a11y = SliderFoundation.getHandleA11y({ range, pos, id, ariaLabel, ariaLabelledby, generatedId, endName: pos === 'min' ? locale.rangeStart : locale.rangeEnd });
        return (
            // closeOnEsc off: the slider drives this tip, which Escape cannot hide, so the key goes on to the layer below
            <Tooltip className={`${cssClasses.HANDLE}-tooltip`} closeOnEsc={false} content={tipChildren[pos]} position="top" showArrow={showArrow} trigger="custom" visible={isInRenderTree && (tipVisible[pos] || focusVisibleHandle === pos)}>
                <span
                    className={clsx(cssClasses.HANDLE, {
                        [`${cssClasses.HANDLE}-clicked`]: chooseMovePos === pos && isDrag,
                    })}
                    style={{
                        [stylePos]: `${(pos === 'min' ? minPercent : maxPercent) * 100}%`,
                        zIndex: active ? 2 : 1,
                    }}
                    aria-describedby={undefined}
                    // the input is the control: the wrapping Tooltip would otherwise make this span a Tab stop
                    tabIndex={-1}
                    onFocus={range ? undefined : foundation.syncIsInRenderTree}
                    // keeps focus on the input rather than moving it to this span
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => foundation.onHandleEnter(pos)}
                    onMouseLeave={() => foundation.onHandleLeave()}
                    // a single slider re-checks for a hidden container whenever its tooltip would show
                    onMouseOver={range ? undefined : foundation.syncIsInRenderTree}
                    onPointerDown={(e) => {
                        // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
                        if (inputRef.current) focusWithoutRing(inputRef.current, { preventScroll: true });
                        foundation.onHandleDown(e, pos);
                    }}
                >
                    <input
                        ref={inputRef}
                        id={a11y.id}
                        name={name}
                        type="range"
                        className={`${cssClasses.HANDLE}-input`}
                        style={vertical ? { writingMode: 'vertical-lr' } : undefined}
                        aria-describedby={ariaDescribedby}
                        aria-errormessage={ariaErrormessage}
                        aria-invalid={ariaInvalid}
                        aria-label={a11y.ariaLabel}
                        aria-labelledby={a11y.ariaLabelledby}
                        aria-orientation={vertical ? 'vertical' : undefined}
                        aria-valuetext={getAriaValueText ? getAriaValueText(handleValue, index) : ariaValueText}
                        // one Tab stop lands first: the start handle
                        autoFocus={pos === 'min' ? autoFocus : undefined}
                        // matches where the handle moves; arrows are stepped by the foundation since engines map them differently
                        dir={isRTL || (vertical && verticalReverse) ? 'rtl' : 'ltr'}
                        disabled={disabled}
                        max={max}
                        min={min}
                        step={step}
                        value={handleValue}
                        onBlur={() => foundation.onBlur(pos)}
                        onChange={(e) => foundation.handleInputChange(Number(e.target.value), pos)}
                        onFocus={(e) => foundation.onFocus(e, pos)}
                        // the handle input is the only focusable part: it hosts the consumer's handler so that it
                        // sees value keys too, and can prevent them
                        onKeyDown={(e) => {
                            onKeyDown?.(e);
                            foundation.handleKeyDown(e, pos);
                        }}
                        onKeyUp={(e) => foundation.handleKeyUp(e)}
                    />
                    {dot && (
                        <div
                            className={cssClasses.HANDLE_DOT}
                            style={{
                                ...(dot.size ? { width: dot.size, height: dot.size } : {}),
                                ...(dot.color ? { backgroundColor: dot.color } : {}),
                            }}
                        />
                    )}
                </span>
            </Tooltip>
        );
    };

    const markPercent = (mark: string) => (Number(mark) - min) / (max - min);

    const slider = (
        <div
            {...rest}
            ref={mergedRef}
            className={clsx(
                `${prefixCls}-wrapper`,
                {
                    [`${prefixCls}-disabled`]: disabled,
                    [`${cssClasses.VERTICAL}-wrapper`]: vertical,
                    [`${prefixCls}-reverse`]: vertical && verticalReverse,
                },
                className
            )}
            style={style}
            // moving between handles is not leaving: Form's blur validation waits for focus outside
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    onBlur?.(e);
                }
            }}
            onMouseEnter={() => foundation.handleWrapperEnter()}
            onMouseLeave={() => foundation.handleWrapperLeave()}
        >
            <div className={`${prefixCls}-rail`} style={railStyle} onClick={foundation.handleWrapClick} />
            <div className={cssClasses.TRACK} style={trackStyle} onClick={foundation.handleWrapClick} />
            {markKeys.length > 0 && (
                <div className={cssClasses.DOTS}>
                    {markKeys.map((mark) => {
                        const activeResult = SliderFoundation.isMarkActive(props, currentValue, Number(mark));
                        if (!activeResult) {
                            return null;
                        }
                        const dotDOM = (
                            <span
                                key={mark}
                                className={clsx(`${prefixCls}-dot`, {
                                    [`${prefixCls}-dot-active`]: activeResult === 'active',
                                })}
                                style={{ [stylePos]: `calc(${markPercent(mark) * 100}% - 2px)` }}
                                // Tooltip would otherwise inject tabIndex 0
                                tabIndex={-1}
                                onClick={foundation.handleWrapClick}
                            />
                        );
                        return tooltipOnMark ? (
                            <Tooltip key={mark} content={marks[mark]}>
                                {dotDOM}
                            </Tooltip>
                        ) : (
                            dotDOM
                        );
                    })}
                </div>
            )}
            <div>
                {renderHandle('min')}
                {range && renderHandle('max')}
            </div>
            {showMarkLabel && markKeys.length > 0 && (
                <div className={cssClasses.MARKS + reverse}>
                    {markKeys.map((mark) =>
                        SliderFoundation.isMarkActive(props, currentValue, Number(mark)) ? (
                            <span key={mark} className={`${prefixCls}-mark${reverse}`} style={{ [stylePos]: `${markPercent(mark) * 100}%` }} onClick={() => foundation.handleMarkClick(Number(mark))}>
                                {marks[mark]}
                            </span>
                        ) : null
                    )}
                </div>
            )}
            <div
                className={clsx(`${prefixCls}-boundary`, {
                    [`${prefixCls}-boundary-show`]: showBoundary && state.showBoundary,
                })}
            >
                <span className={`${prefixCls}-boundary-min`}>{min}</span>
                <span className={`${prefixCls}-boundary-max`}>{max}</span>
            </div>
        </div>
    );

    // deep comparison: a literal array is a new value on every render
    useDidUpdate(
        props.value,
        (value) => {
            // a Form reset: back to the default position, nothing to report
            if (value === undefined) {
                foundation.resetValue();
                return;
            }
            foundation.handleValueChange(value);
            props.onAfterChange(value);
        },
        isEqual
    );

    return vertical ? slider : <div className={prefixCls}>{slider}</div>;
}
