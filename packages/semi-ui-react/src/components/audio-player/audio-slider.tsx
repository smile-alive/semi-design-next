import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/audio-player/constants';
import SeekFoundation, { type SeekAdapter, type SeekBaseProps, type SeekBaseState } from '@fibrae/semi-foundation/components/video-player/seek-foundation';
import { formatTime } from '@fibrae/semi-foundation/components/video-player/utils';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import '@fibrae/semi-foundation/components/audio-player/audio-player.scss';
import useFoundation from '../../base/use-foundation';
import Tooltip from '../tooltip';
import type { AudioPlayerTheme } from './audio-player';

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
    height?: number | string;
    showTooltip?: boolean;
    theme?: AudioPlayerTheme;
    label: string;
    /** Spoken form of a value, announced instead of the bare number */
    getValueText: (value: number) => string;
}

const prefixCls = cssClasses.PREFIX;
// $size-audio-player-slider-dot
const dotSize = 16;

export default function AudioSlider({ value = 0, onChange, max = 100, vertical = false, height = 4, showTooltip = true, theme = 'dark', label, getValueText }: AudioSliderProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [foundation, { isDragging, movingInfo }] = useFoundation<Foundation, Adapter, FoundationProps, SeekBaseState>(
        SeekFoundation,
        { max, vertical, onChange },
        () => SeekFoundation.getInitialState(),
        (base) => ({
            getSliderRef: () => sliderRef.current,
            notifyChange: (next) => base.getProps().onChange?.(next),
            // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
            focusOnPress: () => {
                if (inputRef.current) focusWithoutRing(inputRef.current, { preventScroll: true });
            },
        })
    );

    const percent = max ? (value / max) * 100 : 0;

    const sliderContent = (
        // the range input inside is the control: -1 stops the wrapping Tooltip from making this div a second Tab stop
        <div
            className={clsx(`${prefixCls}-slider-wrapper`, {
                [`${prefixCls}-slider-wrapper-vertical`]: vertical,
                [`${prefixCls}-slider-wrapper-horizontal`]: !vertical,
                [`${prefixCls}-slider-wrapper-dragging`]: isDragging,
            })}
            tabIndex={-1}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            // keeps the press from moving focus from the input to this div
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={foundation.handlePointerEnter}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
        >
            <input
                ref={inputRef}
                type="range"
                className={`${prefixCls}-slider-input`}
                aria-label={label}
                aria-orientation={vertical ? 'vertical' : undefined}
                aria-valuetext={getValueText(value)}
                max={max}
                min={0}
                step={1}
                value={value}
                onChange={(e) => onChange?.(Number(e.target.value))}
                onFocus={foundation.handleFocus}
                onKeyDown={foundation.clearPreview}
            />
            <div
                ref={sliderRef}
                className={clsx(`${prefixCls}-slider`, `${prefixCls}-slider-${theme}`, {
                    [`${prefixCls}-slider-vertical`]: vertical,
                    [`${prefixCls}-slider-horizontal`]: !vertical,
                })}
                style={vertical ? { height } : undefined}
            >
                <div
                    className={clsx(`${prefixCls}-slider-progress`, {
                        [`${prefixCls}-slider-progress-vertical`]: vertical,
                        [`${prefixCls}-slider-progress-horizontal`]: !vertical,
                    })}
                    style={{
                        height: vertical ? `${percent}%` : '100%',
                        width: vertical ? '100%' : `${percent}%`,
                    }}
                />
                <div
                    className={clsx(`${prefixCls}-slider-dot`)}
                    style={{
                        // centered on the end of the progress, as in VideoPlayer: at either end it covers the track's round cap
                        left: vertical ? '50%' : `calc(${percent}% - ${dotSize / 2}px)`,
                        bottom: vertical ? `calc(${percent}% - ${dotSize / 2}px)` : undefined,
                        top: vertical ? undefined : '50%',
                        transform: vertical ? 'translateX(-50%)' : 'translateY(-50%)',
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </div>
    );

    return showTooltip ? (
        <Tooltip style={{ translate: movingInfo ? SeekFoundation.getPreviewTranslate(movingInfo.offset, vertical) : undefined }} autoAdjustOverflow content={formatTime(movingInfo ? movingInfo.value : value)} position={vertical ? 'right' : 'top'}>
            {sliderContent}
        </Tooltip>
    ) : (
        sliderContent
    );
}
