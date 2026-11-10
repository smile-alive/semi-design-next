import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/video-player/constants';
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
}

const prefixCls = cssClasses.PREFIX_PROGRESS;

export default function VideoProgress(props: VideoProgressProps) {
    const { showTooltip = true, max, value: currentValue, markers, bufferedValue } = props;

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
                        <div className={`${prefixCls}-slider-buffered`} style={{ width: VideoProgressFoundation.getValueWidth(marker, bufferedValue) }} />
                        <div className={`${prefixCls}-slider-played`} style={{ width: VideoProgressFoundation.getValueWidth(marker, currentValue) }} />
                    </div>
                ))}
            </div>
            <div className={`${prefixCls}-handle`} style={{ left: VideoProgressFoundation.getHandleLeft(currentValue, max) }} />
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
