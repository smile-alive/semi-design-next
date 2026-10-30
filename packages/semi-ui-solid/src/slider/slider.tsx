import { type JSX, For, Show, createMemo, createUniqueId, onMount, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/slider/constants';
import SliderFoundation, { type SliderAdapter, type SliderProps as BasicSliderProps, type SliderState } from '@fibrae/semi-foundation/slider/foundation';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import '@fibrae/semi-foundation/slider/slider.scss';
import autofocus from '../_base/autofocus';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import { useLocale } from '../locale';
import Tooltip from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';

const prefixCls = cssClasses.PREFIX;

export interface SliderProps extends Omit<BasicSliderProps, 'className' | 'style' | 'railStyle' | 'marks' | 'onMouseUp'>, ElementProps<'div', 'defaultValue' | 'onChange' | 'onMouseUp' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'children'> {
    /** Mark labels by value; node labels go through `renderMark` */
    marks?: Record<number, string | number>;
    /** A mark's label next to the mark and, with `tooltipOnMark`, in its tooltip; called once for each place. Defaults to the label */
    renderMark?: (value: number, label: string | number) => JSX.Element;
    railStyle?: JSX.CSSProperties | string;
    autofocus?: boolean;
    onMouseUp?: (event: PointerEvent | KeyboardEvent) => void;
    /** Attached to the `.semi-slider-wrapper` div; fires for focus on either handle */
    onFocus?: JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>;
    /** Attached to the `.semi-slider-wrapper` div; fires when focus leaves both handles */
    onBlur?: JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>;
    /** Attached to the handle inputs, which are the only focusable parts */
    onKeyDown?: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent>;
}

export type { SliderState };

// the foundation types `style` and `railStyle` as objects; here they may also be strings
type FoundationProps = Omit<SliderProps, 'style' | 'railStyle'>;
type Handle = 'min' | 'max';

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
    verticalReverse: false,
} satisfies Partial<SliderProps>;

export default function Slider(rawProps: SliderProps) {
    const props = useDefaultProps('Slider', rawProps, defaultProps);

    const [local, rest] = splitProps(omitFormInjected(props), [
        'class',
        'ref',
        'defaultValue',
        'disabled',
        'showMarkLabel',
        'included',
        'marks',
        'renderMark',
        'max',
        'min',
        'name',
        'range',
        'step',
        'tipFormatter',
        'value',
        'vertical',
        'onAfterChange',
        'onChange',
        'onMouseUp',
        'tooltipOnMark',
        'tooltipVisible',
        'showArrow',
        'showBoundary',
        'railStyle',
        'verticalReverse',
        'aria-label',
        'aria-labelledby',
        'aria-valuetext',
        'getAriaValueText',
        'handleDot',
        'aria-describedby',
        'aria-errormessage',
        'aria-invalid',
        // the slider role supports no aria-required
        'aria-required',
        // Tooltip's tabIndex is indistinguishable from a caller's; the handle inputs are the Tab stops
        'tabIndex',
        'id',
        'autofocus',
        'onFocus',
        'onBlur',
        'onKeyDown',
        'onFocusIn',
        'onFocusOut',
        'onMouseEnter',
        'onMouseLeave',
    ]);

    const foundationProps: FoundationProps = props;

    const config = useConfig();
    const locale = useLocale('Slider');

    const generatedId = createUniqueId();
    let slider: HTMLDivElement | undefined;
    let minInput!: HTMLInputElement;
    let maxInput: HTMLInputElement | undefined;

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<SliderFoundation<FoundationProps>, SliderAdapter<FoundationProps>, FoundationProps, SliderState>(
        SliderFoundation,
        props,
        (view) => SliderFoundation.getInitialState(view),
        () => ({
            getSliderNode: () => slider,
            notifyChange: (value) => props.onChange?.(value),
            notifyAfterChange: (value) => props.onAfterChange?.(value),
            notifyMouseUp: (event) => props.onMouseUp?.(event),
        }),
        { context: config }
    );

    const percent = createMemo(() => SliderFoundation.getMinAndMaxPercent(foundationProps, state().currentValue), undefined, { equals: isEqual });
    const tips = createMemo(() => SliderFoundation.computeHandleVisibleVal(foundationProps, state()));

    const isRTL = () => config().direction === 'rtl' && !props.vertical;

    const stylePos = () => (props.vertical ? 'top' : isRTL() ? 'right' : 'left');

    const markKeys = () => (props.marks ? Object.keys(props.marks) : []);

    const reverse = () => (props.vertical && props.verticalReverse ? '-reverse' : '');

    const markPercent = (mark: string) => (Number(mark) - props.min) / (props.max - props.min);

    const markActive = (mark: string) => SliderFoundation.isMarkActive(foundationProps, state().currentValue, Number(mark));

    // each call builds its own node, so the label and the tooltip never share one
    const markLabel = (mark: string) => {
        const label = local.marks?.[Number(mark)] ?? '';
        return local.renderMark ? local.renderMark(Number(mark), label) : label;
    };

    const trackStyle = (): JSX.CSSProperties | undefined => {
        if (!local.included) {
            return undefined;
        }
        const { min, max } = percent();
        const size = props.range ? `${Math.abs(max - min) * 100}%` : `${min * 100}%`;
        const start = props.range ? `${Math.min(min, max) * 100}%` : '0';
        return { [props.vertical ? 'height' : 'width']: size, [stylePos()]: start };
    };

    const renderHandle = (pos: Handle) => {
        const index = pos === 'min' ? 0 : 1;
        const handleValue = () => (props.range ? (state().currentValue as number[])[index] : (state().currentValue as number));
        const dot = () => (Array.isArray(local.handleDot) ? local.handleDot[index] : local.handleDot);
        const active = () => state().chooseMovePos === pos && (props.range || state().isDrag);
        const a11y = createMemo(() =>
            SliderFoundation.getHandleA11y({
                range: props.range,
                pos,
                id: local.id,
                ariaLabel: local['aria-label'],
                ariaLabelledby: local['aria-labelledby'],
                generatedId,
                endName: pos === 'min' ? locale().locale.rangeStart : locale().locale.rangeEnd,
            })
        );
        // the native range keeps its own value after an input the slider did not apply
        const syncInput = (input: HTMLInputElement) => (input.value = String(handleValue()));

        return (
            // closeOnEsc off: the slider drives this tip, which Escape cannot hide, so the key goes on to the layer below
            <Tooltip class={`${cssClasses.HANDLE}-tooltip`} closeOnEsc={false} content={tips().tipChildren[pos]} position="top" showArrow={local.showArrow} trigger="custom" visible={state().isInRenderTree && (tips().tipVisible[pos] || state().focusVisibleHandle === pos)}>
                {(getTriggerProps) => (
                    <span
                        {...getTriggerProps({
                            // the input is the control: the wrapping Tooltip would otherwise make this span a Tab stop
                            tabIndex: -1,
                            // the tip repeats the value the input already announces
                            'aria-describedby': null,
                        })}
                        class={clsx(cssClasses.HANDLE, { [`${cssClasses.HANDLE}-clicked`]: state().chooseMovePos === pos && state().isDrag })}
                        style={{ [stylePos()]: `${(pos === 'min' ? percent().min : percent().max) * 100}%`, 'z-index': active() ? 2 : 1 }}
                        onFocusIn={props.range ? undefined : foundation.syncIsInRenderTree}
                        // keeps focus on the input rather than moving it to this span
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => foundation.onHandleEnter(pos)}
                        onMouseLeave={foundation.onHandleLeave}
                        // a single slider re-checks for a hidden container whenever its tooltip would show
                        onMouseOver={props.range ? undefined : foundation.syncIsInRenderTree}
                        onPointerDown={(event) => {
                            // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
                            const input = pos === 'min' ? minInput : maxInput;
                            if (input) focusWithoutRing(input, { preventScroll: true });
                            foundation.onHandleDown(event, pos);
                        }}
                    >
                        <input
                            ref={(node) => (pos === 'min' ? (minInput = node) : (maxInput = node))}
                            id={a11y().id}
                            name={local.name}
                            type="range"
                            class={`${cssClasses.HANDLE}-input`}
                            style={props.vertical ? { 'writing-mode': 'vertical-lr' } : undefined}
                            aria-describedby={local['aria-describedby']}
                            aria-errormessage={local['aria-errormessage']}
                            aria-invalid={local['aria-invalid']}
                            aria-label={a11y().ariaLabel}
                            aria-labelledby={a11y().ariaLabelledby}
                            aria-orientation={props.vertical ? 'vertical' : undefined}
                            aria-valuetext={local.getAriaValueText ? local.getAriaValueText(handleValue(), index) : local['aria-valuetext']}
                            // matches where the handle moves; arrows are stepped by the foundation since engines map them differently
                            dir={isRTL() || (props.vertical && props.verticalReverse) ? 'rtl' : 'ltr'}
                            disabled={local.disabled}
                            max={local.max}
                            min={local.min}
                            step={local.step}
                            value={handleValue()}
                            onBlur={() => foundation.onBlur(pos)}
                            onInput={(event) => {
                                foundation.handleInputChange(Number(event.currentTarget.value), pos);
                                syncInput(event.currentTarget);
                            }}
                            onFocus={(event) => foundation.onFocus(event, pos)}
                            // the handle input is the only focusable part: it hosts the consumer's handler so that it
                            // sees value keys too, and can prevent them
                            onKeyDown={(event) => {
                                callHandler(local.onKeyDown, event);
                                foundation.handleKeyDown(event, pos);
                            }}
                            onKeyUp={foundation.handleKeyUp}
                        />
                        <Show when={dot()}>{(handleDot) => <div class={cssClasses.HANDLE_DOT} style={{ width: handleDot().size, height: handleDot().size, 'background-color': handleDot().color }} />}</Show>
                    </span>
                )}
            </Tooltip>
        );
    };

    const markDot = (mark: string, trigger?: object) => <span {...trigger} class={clsx(`${prefixCls}-dot`, { [`${prefixCls}-dot-active`]: markActive(mark) === 'active' })} style={{ [stylePos()]: `calc(${markPercent(mark) * 100}% - 2px)` }} onClick={foundation.handleWrapClick} />;

    const renderSlider = () => (
        <div
            {...rest}
            // both Show branches call this inside a tracked memo; a spread props signal would recreate the whole slider
            ref={untrack(() =>
                mergeRefs(local.ref, (node: HTMLDivElement) => {
                    slider = node;
                    forwardFocus(node, () => minInput);
                    registerTrigger(node);
                })
            )}
            class={clsx(
                `${prefixCls}-wrapper`,
                {
                    [`${prefixCls}-disabled`]: local.disabled,
                    [`${cssClasses.VERTICAL}-wrapper`]: local.vertical,
                    [`${prefixCls}-reverse`]: local.vertical && local.verticalReverse,
                },
                local.class
            )}
            onFocusIn={(event) => {
                callHandler(local.onFocusIn, event);
                callHandler(local.onFocus, event);
            }}
            onFocusOut={(event) => {
                callHandler(local.onFocusOut, event);
                // moving between handles is not leaving: Form's blur validation waits for focus outside
                if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
                    callHandler(local.onBlur, event);
                }
            }}
            onMouseEnter={(event) => {
                callHandler(local.onMouseEnter, event);
                foundation.handleWrapperEnter();
            }}
            onMouseLeave={(event) => {
                callHandler(local.onMouseLeave, event);
                foundation.handleWrapperLeave();
            }}
        >
            <div class={`${prefixCls}-rail`} style={local.railStyle} onClick={foundation.handleWrapClick} />
            <div class={cssClasses.TRACK} style={trackStyle()} onClick={foundation.handleWrapClick} />
            <Show when={markKeys().length > 0}>
                <div class={cssClasses.DOTS}>
                    <For each={markKeys()}>
                        {(mark) => (
                            <Show when={markActive(mark)}>
                                <Show when={local.tooltipOnMark} fallback={markDot(mark)}>
                                    {/* the mark tip is for the pointer only: Tooltip would otherwise make the dot a Tab stop */}
                                    <Tooltip content={markLabel(mark)}>{(getTriggerProps) => markDot(mark, getTriggerProps({ tabIndex: -1 }))}</Tooltip>
                                </Show>
                            </Show>
                        )}
                    </For>
                </div>
            </Show>
            <div>
                {renderHandle('min')}
                <Show when={props.range}>{renderHandle('max')}</Show>
            </div>
            <Show when={local.showMarkLabel && markKeys().length > 0}>
                <div class={cssClasses.MARKS + reverse()}>
                    <For each={markKeys()}>
                        {(mark) => (
                            <Show when={markActive(mark)}>
                                <span class={`${prefixCls}-mark${reverse()}`} style={{ [stylePos()]: `${markPercent(mark) * 100}%` }} onClick={() => foundation.handleMarkClick(Number(mark))}>
                                    {markLabel(mark)}
                                </span>
                            </Show>
                        )}
                    </For>
                </div>
            </Show>
            <div class={clsx(`${prefixCls}-boundary`, { [`${prefixCls}-boundary-show`]: local.showBoundary && state().showBoundary })}>
                <span class={`${prefixCls}-boundary-min`}>{local.min}</span>
                <span class={`${prefixCls}-boundary-max`}>{local.max}</span>
            </div>
        </div>
    );

    // a literal array is a new value on every change of its parts: compare by content
    useWatch(
        createMemo(() => local.value, undefined, { equals: isEqual }),
        (value) => {
            // a Form reset: back to the default position, nothing to report
            if (value === undefined) {
                foundation.resetValue();
            } else {
                foundation.handleValueChange(value);
                props.onAfterChange?.(value);
            }
        }
    );

    onMount(() => autofocus(local.autofocus, minInput));

    return (
        <Show
            when={local.vertical}
            fallback={
                <div
                    class={prefixCls}
                    // an enclosing Tooltip may take this outer div as its single child
                    ref={registerTrigger}
                >
                    {renderSlider()}
                </div>
            }
        >
            {renderSlider()}
        </Show>
    );
}
