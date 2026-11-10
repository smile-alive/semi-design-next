import { type JSX, Show, mergeProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/audio-player/constants';
import SeekFoundation, { type SeekAdapter, type SeekBaseProps, type SeekBaseState } from '@fibrae/semi-foundation/components/video-player/seek-foundation';
import { formatTime } from '@fibrae/semi-foundation/components/video-player/utils';
import { toCssLength, focusWithoutRing } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/audio-player/audio-player.scss';
import { useFoundation } from '../../base/index';
import Tooltip from '../tooltip';
import type { AudioPlayerTheme } from './interface';

interface FoundationProps extends SeekBaseProps {
    onChange?: (value: number) => void;
}

type Foundation = SeekFoundation<FoundationProps>;
type Adapter = SeekAdapter<FoundationProps>;

interface AudioSliderProps {
    value?: number;
    onChange?: (value: number) => void;
    max?: number;
    vertical?: boolean;
    /** Only applies when vertical */
    height?: number | string;
    showTooltip?: boolean;
    theme?: AudioPlayerTheme;
    label: string;
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

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, SeekBaseState>(
        SeekFoundation,
        props,
        () => SeekFoundation.getInitialState(),
        () => ({
            getSliderRef: () => track ?? null,
            notifyChange: (value) => props.onChange?.(value),
            // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
            focusOnPress: () => {
                if (input) focusWithoutRing(input, { preventScroll: true });
            },
        })
    );

    // the duration is 0 until the metadata loads
    const percent = () => (props.max ? (props.value / props.max) * 100 : 0);

    const previewStyle = (): JSX.CSSProperties => {
        const info = state().movingInfo;
        return { translate: info ? SeekFoundation.getPreviewTranslate(info.offset, props.vertical) : undefined };
    };

    const renderSlider = (triggerProps?: JSX.HTMLAttributes<HTMLDivElement>) => (
        <div
            {...triggerProps}
            class={clsx(`${prefixCls}-slider-wrapper`, {
                [`${prefixCls}-slider-wrapper-vertical`]: props.vertical,
                [`${prefixCls}-slider-wrapper-horizontal`]: !props.vertical,
                [`${prefixCls}-slider-wrapper-dragging`]: state().isDragging,
            })}
            // the range input inside is the control: -1 stops the wrapping Tooltip from making this div a second Tab stop
            tabIndex={-1}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            // keeps the press from moving focus from the input to this div
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={foundation.handlePointerEnter}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
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
                onFocus={foundation.handleFocus}
                onKeyDown={foundation.clearPreview}
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

    const previewTime = () => formatTime(state().movingInfo?.value ?? props.value);

    return (
        <Show when={props.showTooltip} fallback={renderSlider()}>
            <Tooltip autoAdjustOverflow content={previewTime()} position={props.vertical ? 'right' : 'top'} style={previewStyle()}>
                {(getTriggerProps) => renderSlider(getTriggerProps({ tabIndex: -1 }))}
            </Tooltip>
        </Show>
    );
}
