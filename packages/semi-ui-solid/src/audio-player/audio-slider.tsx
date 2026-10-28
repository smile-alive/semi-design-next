import { type JSX, Show, createSignal, mergeProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import { formatTime, getPointerRatio } from '@fibrae/semi-foundation/video-player/utils';
import '@fibrae/semi-foundation/audio-player/audio-player.scss';
import Tooltip from '../tooltip';
import type { AudioPlayerTheme } from './interface';

interface AudioSliderProps {
    value?: number;
    onChange?: (value: number) => void;
    max?: number;
    vertical?: boolean;
    /** Only applies when vertical */
    height?: number | string;
    showTooltip?: boolean;
    theme?: AudioPlayerTheme;
    /** Accessible name of the slider */
    label: string;
    /** Spoken form of a value, announced instead of the bare number */
    getValueText: (value: number) => string;
}

const prefixCls = cssClasses.PREFIX;
// $size-audio-player-slider-dot
const dotSize = 16;

const defaultProps = {
    value: 0,
    max: 100,
    vertical: false,
    height: 4,
    showTooltip: true,
    theme: 'dark',
} satisfies Partial<AudioSliderProps>;

export default function AudioSlider(rawProps: AudioSliderProps) {
    const props = mergeProps(defaultProps, rawProps);

    let track: HTMLDivElement | undefined;
    let input: HTMLInputElement | undefined;
    const [isDragging, setIsDragging] = createSignal(false);
    const [movingInfo, setMovingInfo] = createSignal<{ progress: number; offset: number } | null>(null);

    // the duration is 0 until the metadata loads
    const percent = () => (props.max ? (props.value / props.max) * 100 : 0);

    const handlePointerPosition = (event: MouseEvent, seek: boolean) => {
        if (!track) {
            return;
        }
        const { total, ratio } = getPointerRatio(track.getBoundingClientRect(), event, props.vertical);
        if (seek && isDragging()) {
            props.onChange?.(ratio * props.max);
        }
        // from the slider's center to where the dot sits at this ratio, so the preview stays over the dragged dot
        setMovingInfo({ progress: ratio, offset: (ratio - 0.5) * total });
    };

    // the popup is anchored to the slider's center, so only a translate moves it to the pointer; the vertical offset
    // counts up from the bottom
    const previewStyle = (): JSX.CSSProperties => {
        const info = movingInfo();
        return { translate: info ? (props.vertical ? `0 ${-info.offset}px` : `${info.offset}px 0`) : undefined };
    };

    const renderSlider = (triggerProps?: JSX.HTMLAttributes<HTMLDivElement>) => (
        <div
            {...triggerProps}
            class={clsx(`${prefixCls}-slider-wrapper`, {
                [`${prefixCls}-slider-wrapper-vertical`]: props.vertical,
                [`${prefixCls}-slider-wrapper-horizontal`]: !props.vertical,
                [`${prefixCls}-slider-wrapper-dragging`]: isDragging(),
            })}
            // the range input inside is the control: -1 stops the wrapping Tooltip from making this div a second Tab stop
            tabIndex={-1}
            // follows pointerup and pointercancel, and also fires when the slider leaves the page mid-drag
            onLostPointerCapture={() => setIsDragging(false)}
            // keeps the press from moving focus from the input to this div
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={(event) => handlePointerPosition(event, false)}
            // the slider keeps the pointer from the press on, so the moves and the release reach it even outside it
            onPointerDown={(event) => {
                if (isSecondaryPress(event)) {
                    return;
                }
                event.currentTarget.setPointerCapture(event.pointerId);
                // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
                if (input) focusWithoutRing(input, { preventScroll: true });
                setIsDragging(true);
                handlePointerPosition(event, true);
            }}
            onPointerMove={(event) => handlePointerPosition(event, true)}
        >
            <input
                ref={(node) => (input = node)}
                type="range"
                class={`${prefixCls}-slider-input`}
                aria-label={props.label}
                aria-orientation={props.vertical ? 'vertical' : undefined}
                aria-valuetext={props.getValueText(props.value)}
                min={0}
                // max before value: a range that grows and moves in one update keeps the new value
                max={props.max}
                step={1}
                value={props.value}
                onInput={(event) => props.onChange?.(Number(event.currentTarget.value))}
                // the preview belongs to the pointer; a keyboard use shows the value
                onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible')) {
                        setMovingInfo(null);
                    }
                }}
                onKeyDown={() => setMovingInfo(null)}
            />
            <div
                ref={(node) => (track = node)}
                class={clsx(`${prefixCls}-slider`, `${prefixCls}-slider-${props.theme}`, {
                    [`${prefixCls}-slider-vertical`]: props.vertical,
                    [`${prefixCls}-slider-horizontal`]: !props.vertical,
                })}
                style={props.vertical ? { height: toCssLength(props.height) } : undefined}
            >
                <div
                    class={clsx(`${prefixCls}-slider-progress`, {
                        [`${prefixCls}-slider-progress-vertical`]: props.vertical,
                        [`${prefixCls}-slider-progress-horizontal`]: !props.vertical,
                    })}
                    style={{
                        height: props.vertical ? `${percent()}%` : '100%',
                        width: props.vertical ? '100%' : `${percent()}%`,
                    }}
                />
                <div
                    class={`${prefixCls}-slider-dot`}
                    style={{
                        // centered on the end of the progress, as in VideoPlayer: at either end it covers the track's round cap
                        left: props.vertical ? '50%' : `calc(${percent()}% - ${dotSize / 2}px)`,
                        bottom: props.vertical ? `calc(${percent()}% - ${dotSize / 2}px)` : undefined,
                        top: props.vertical ? undefined : '50%',
                        transform: props.vertical ? 'translateX(-50%)' : 'translateY(-50%)',
                        'pointer-events': 'none',
                    }}
                />
            </div>
        </div>
    );

    const previewTime = () => {
        const info = movingInfo();
        return formatTime(info ? info.progress * props.max : props.value);
    };

    return (
        <Show when={props.showTooltip} fallback={renderSlider()}>
            <Tooltip autoAdjustOverflow content={previewTime()} position={props.vertical ? 'right' : 'top'} style={previewStyle()}>
                {(getTriggerProps) => renderSlider(getTriggerProps({ tabIndex: -1 }))}
            </Tooltip>
        </Show>
    );
}
