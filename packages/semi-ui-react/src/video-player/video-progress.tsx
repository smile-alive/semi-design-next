import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/video-player/constants';
import VideoProgressFoundation, { type Marker, type MarkerListItem, type VideoProgressAdapter } from '@fibrae/semi-foundation/video-player/progress-foundation';
import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
import '@fibrae/semi-foundation/video-player/video-player.scss';
import useFoundation from '../_base/use-foundation';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';

export interface VideoProgressProps {
    value: number;
    onChange: (value: number) => void;
    max: number;
    /** Seconds an arrow key moves */
    step: number;
    showTooltip?: boolean;
    markers?: Marker[];
    bufferedValue: number;
}

export interface VideoProgressState {
    isDragging: boolean;
    movingInfo: { progress: number; offset: number; value: number } | null;
    activeIndex: number;
}

const prefixCls = cssClasses.PREFIX_PROGRESS;

export default function VideoProgress(props: VideoProgressProps) {
    const { showTooltip = true, max, value: currentValue, markers, bufferedValue } = props;

    const { locale } = useLocale('VideoPlayer');

    const sliderRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<VideoProgressFoundation<VideoProgressProps, VideoProgressState>, VideoProgressAdapter<VideoProgressProps, VideoProgressState>, VideoProgressProps, VideoProgressState>(
        VideoProgressFoundation,
        props,
        () => ({
            isDragging: false,
            movingInfo: null,
            activeIndex: -1,
        }),
        (base) => ({
            getSliderRef: () => sliderRef.current,
            getMarkersList: () => VideoProgressFoundation.getMarkersList(base.getProps().markers, base.getProps().max),
            setIsDragging: (isDragging) => base.setState({ isDragging }),
            setActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setMovingInfo: (movingInfo) => base.setState({ movingInfo }),
            notifyChange: (value) => base.getProps().onChange(value),
        })
    );

    const { movingInfo, isDragging, activeIndex } = state;
    const markersList = VideoProgressFoundation.getMarkersList(markers, max);

    const sliderContent = (
        <div
            ref={sliderRef}
            className={clsx(prefixCls, { [`${prefixCls}-dragging`]: isDragging })}
            aria-label={locale.progress}
            aria-valuemax={max}
            aria-valuemin={0}
            aria-valuenow={currentValue}
            aria-valuetext={`${formatTimeText(currentValue, locale)} / ${formatTimeText(max, locale)}`}
            role="slider"
            tabIndex={0}
            onFocus={foundation.handleFocus}
            onKeyDown={foundation.handleKeyDown}
            onLostPointerCapture={foundation.handleLostPointerCapture}
            onMouseEnter={(e) => foundation.handlePointerPosition(e, { seek: false })}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={(e) => foundation.handlePointerPosition(e, { seek: true })}
        >
            <div className={`${prefixCls}-markers`}>
                {markersList.map((marker: MarkerListItem, index: number) => (
                    <div
                        key={`${marker.start}-${index}`}
                        className={clsx(`${prefixCls}-slider`, {
                            [`${prefixCls}-slider-active`]: index === activeIndex && isDragging,
                        })}
                        style={{ left: marker.left, width: marker.width }}
                    >
                        <div className={`${prefixCls}-slider-list`} />
                        <div className={`${prefixCls}-slider-buffered`} style={{ width: VideoProgressFoundation.getValueWidth(marker, bufferedValue) }} />
                        <div className={`${prefixCls}-slider-played`} style={{ width: VideoProgressFoundation.getValueWidth(marker, currentValue) }} />
                    </div>
                ))}
            </div>
            <div className={`${prefixCls}-handle`} style={{ left: VideoProgressFoundation.getHandleLeft(currentValue, max) }} />
        </div>
    );

    // the pointer's position, or the playhead when the bar is used by keyboard
    const renderTooltipContent = () => {
        const previewValue = movingInfo ? movingInfo.value : currentValue;
        if (markersList.length > 0) {
            return (
                <>
                    <div className={`${prefixCls}-tooltip-content`}>{VideoProgressFoundation.getMarkerTitle(markersList, previewValue)}</div>
                    <div className={`${prefixCls}-tooltip-content`}>{formatTime(previewValue)}</div>
                </>
            );
        }
        return formatTime(previewValue);
    };

    return showTooltip ? (
        <Tooltip
            className={`${prefixCls}-tooltip`}
            // anchored to the bar's center, so only a translate moves it to the pointer
            style={{ translate: movingInfo ? `${movingInfo.offset}px 0` : undefined }}
            content={renderTooltipContent()}
            position="top"
            spacing={2}
        >
            {sliderContent}
        </Tooltip>
    ) : (
        sliderContent
    );
}
