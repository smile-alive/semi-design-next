import type React from 'react';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import { formatTime, getPointerRatio } from '@fibrae/semi-foundation/video-player/utils';
import '@fibrae/semi-foundation/audio-player/audio-player.scss';
import Tooltip from '../tooltip';
import type { AudioPlayerTheme } from './index';

interface AudioSliderProps {
    value?: number;
    onChange?: (value: number) => void;
    max?: number;
    vertical?: boolean;
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

export default function AudioSlider({ value = 0, onChange, max = 100, vertical = false, height = 4, showTooltip = true, theme = 'dark', label, getValueText }: AudioSliderProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [movingInfo, setMovingInfo] = useState<{ progress: number; offset: number } | null>(null);

    const percent = max ? (value / max) * 100 : 0;

    const handlePointerPosition = (e: React.MouseEvent, { seek }: { seek: boolean }) => {
        if (!sliderRef.current) return;
        const { total, ratio } = getPointerRatio(sliderRef.current.getBoundingClientRect(), e, vertical);
        // isDragging set by this press is not readable until the next render
        if (seek && (isDragging || e.type === 'pointerdown')) {
            onChange?.(ratio * max);
        }
        setMovingInfo({ progress: ratio, offset: (ratio - 0.5) * total });
    };

    const sliderContent = (
        // the range input inside is the control: -1 stops the wrapping Tooltip from making this div a second Tab stop
        <div
            className={clsx(`${prefixCls}-slider-wrapper`, {
                [`${prefixCls}-slider-wrapper-vertical`]: vertical,
                [`${prefixCls}-slider-wrapper-horizontal`]: !vertical,
                [`${prefixCls}-slider-wrapper-dragging`]: isDragging,
            })}
            tabIndex={-1}
            // follows pointerup and pointercancel, and also fires when the slider leaves the page mid-drag
            onLostPointerCapture={() => setIsDragging(false)}
            // keeps the press from moving focus from the input to this div
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={(e) => handlePointerPosition(e, { seek: false })}
            // the slider keeps the pointer from the press on, so the moves and the release reach it even outside it
            onPointerDown={(e) => {
                if (isSecondaryPress(e)) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
                if (inputRef.current) focusWithoutRing(inputRef.current, { preventScroll: true });
                setIsDragging(true);
                handlePointerPosition(e, { seek: true });
            }}
            onPointerMove={(e) => handlePointerPosition(e, { seek: true })}
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
                // the preview belongs to the pointer; a keyboard use shows the value
                onFocus={(e) => {
                    if (e.currentTarget.matches(':focus-visible')) setMovingInfo(null);
                }}
                onKeyDown={() => setMovingInfo(null)}
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
        <Tooltip
            // the popup is anchored to the slider's center, so only a translate moves it to the pointer
            style={{
                translate: movingInfo ? (vertical ? `0 ${-movingInfo.offset}px` : `${movingInfo.offset}px 0`) : undefined,
            }}
            autoAdjustOverflow
            content={formatTime(movingInfo ? movingInfo.progress * max : value)}
            position={vertical ? 'right' : 'top'}
        >
            {sliderContent}
        </Tooltip>
    ) : (
        sliderContent
    );
}
