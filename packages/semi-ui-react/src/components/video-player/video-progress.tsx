import { type CSSProperties, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, type VideoPlayerPart } from '@fibrae/semi-foundation/components/video-player/constants';
import VideoProgressFoundation, { type Marker, type MarkerListItem, type VideoProgressAdapter, type VideoProgressBaseState } from '@fibrae/semi-foundation/components/video-player/progress-foundation';
import { formatTime, formatTimeText } from '@fibrae/semi-foundation/components/video-player/utils';
import '@fibrae/semi-foundation/components/video-player/video-player.scss';
import { useFoundation } from '../../base/index';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';

type Foundation = VideoProgressFoundation<VideoProgressProps>;
type Adapter = VideoProgressAdapter<VideoProgressProps>;

export interface VideoProgressProps {
    value: number;
    onChange: (value: number) => void;
    max: number;
    step: number;
    showTooltip?: boolean;
    markers?: Marker[];
    bufferedValue: number;
    classNames?: Partial<Record<VideoPlayerPart, string>>;
    styles?: Partial<Record<VideoPlayerPart, CSSProperties>>;
}

const prefixCls = cssClasses.PREFIX_PROGRESS;

export default function VideoProgress(props: VideoProgressProps) {
    const { showTooltip = true, max, value: currentValue, markers, bufferedValue, classNames, styles } = props;

    const { locale } = useLocale('VideoPlayer');

    const sliderRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, VideoProgressProps, VideoProgressBaseState>(
        VideoProgressFoundation,
        props,
        () => VideoProgressFoundation.getInitialState(),
        (base) => ({
            getSliderRef: () => sliderRef.current,
            notifyChange: (value) => base.getProps().onChange(value),
        })
    );

    const { movingInfo, isDragging, activeIndex } = state;
    const markersList = VideoProgressFoundation.getMarkersList(markers, max);

    const sliderContent = (
        <div
            ref={sliderRef}
            className={clsx(prefixCls, { [`${prefixCls}-dragging`]: isDragging }, classNames?.progress)}
            style={styles?.progress}
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
            onMouseEnter={foundation.handlePointerEnter}
            onPointerDown={foundation.handlePointerDown}
            onPointerMove={foundation.handlePointerMove}
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
                        <div className={clsx(`${prefixCls}-slider-buffered`, classNames?.progressBuffered)} style={{ width: VideoProgressFoundation.getValueWidth(marker, bufferedValue), ...styles?.progressBuffered }} />
                        <div className={clsx(`${prefixCls}-slider-played`, classNames?.progressPlayed)} style={{ width: VideoProgressFoundation.getValueWidth(marker, currentValue), ...styles?.progressPlayed }} />
                    </div>
                ))}
            </div>
            <div className={clsx(`${prefixCls}-handle`, classNames?.progressHandle)} style={{ left: VideoProgressFoundation.getHandleLeft(currentValue, max), ...styles?.progressHandle }} />
        </div>
    );

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
        <Tooltip className={`${prefixCls}-tooltip`} style={{ translate: movingInfo ? VideoProgressFoundation.getPreviewTranslate(movingInfo.offset) : undefined }} content={renderTooltipContent()} position="top" spacing={2}>
            {sliderContent}
        </Tooltip>
    ) : (
        sliderContent
    );
}
