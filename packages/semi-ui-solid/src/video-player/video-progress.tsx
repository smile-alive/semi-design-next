import { Index, createMemo } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/video-player/constants';
import VideoProgressFoundation, { type VideoProgressAdapter } from '@fibrae/semi-foundation/video-player/progress-foundation';
import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
import '@fibrae/semi-foundation/video-player/video-player.scss';
import useFoundation from '../_base/use-foundation';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import type { VideoProgressProps, VideoProgressState } from './interface';

type Foundation = VideoProgressFoundation<VideoProgressProps, VideoProgressState>;
type Adapter = VideoProgressAdapter<VideoProgressProps, VideoProgressState>;

const prefixCls = cssClasses.PREFIX_PROGRESS;

export default function VideoProgress(props: VideoProgressProps) {
    const locale = useLocale('VideoPlayer');

    let slider: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, VideoProgressProps, VideoProgressState>(
        VideoProgressFoundation,
        props,
        () => ({
            isDragging: false,
            movingInfo: null,
            activeIndex: -1,
        }),
        (base) => ({
            getSliderRef: () => slider ?? null,
            getMarkersList: () => VideoProgressFoundation.getMarkersList(base.getProps().markers, base.getProps().max),
            setIsDragging: (isDragging) => base.setState({ isDragging }),
            setActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setMovingInfo: (movingInfo) => base.setState({ movingInfo }),
            notifyChange: (value) => base.getProps().onChange(value),
        })
    );

    const markersList = createMemo(() => VideoProgressFoundation.getMarkersList(props.markers, props.max));

    const text = () => locale().locale;

    const moveOffset = () => {
        const info = state().movingInfo;
        return info ? `${info.offset}px 0` : undefined;
    };

    // the pointer's position, or the playhead when the bar is used by keyboard
    const renderTooltipContent = () => {
        const info = state().movingInfo;
        const previewValue = info ? info.value : props.value;
        const list = markersList();
        if (list.length > 0) {
            return (
                <>
                    <div class={`${prefixCls}-tooltip-content`}>{VideoProgressFoundation.getMarkerTitle(list, previewValue)}</div>
                    <div class={`${prefixCls}-tooltip-content`}>{formatTime(previewValue)}</div>
                </>
            );
        }
        return formatTime(previewValue);
    };

    return (
        <Tooltip
            class={`${prefixCls}-tooltip`}
            // anchored to the bar's center, so only a translate moves it to the pointer
            style={{ translate: moveOffset() }}
            content={renderTooltipContent()}
            position="top"
            spacing={2}
        >
            {(getTriggerProps) => (
                <div
                    {...getTriggerProps({ ref: (node: HTMLDivElement) => (slider = node) })}
                    class={clsx(prefixCls, { [`${prefixCls}-dragging`]: state().isDragging })}
                    aria-label={text().progress}
                    aria-valuemax={props.max}
                    aria-valuemin={0}
                    aria-valuenow={props.value}
                    aria-valuetext={`${formatTimeText(props.value, text())} / ${formatTimeText(props.max, text())}`}
                    role="slider"
                    tabIndex={0}
                    onFocus={foundation.handleFocus}
                    onKeyDown={foundation.handleKeyDown}
                    onLostPointerCapture={foundation.handleLostPointerCapture}
                    onMouseEnter={(event) => foundation.handlePointerPosition(event, { seek: false })}
                    onPointerDown={foundation.handlePointerDown}
                    onPointerMove={(event) => foundation.handlePointerPosition(event, { seek: true })}
                >
                    <div class={`${prefixCls}-markers`}>
                        <Index each={markersList()}>
                            {(marker, index) => (
                                <div
                                    class={clsx(`${prefixCls}-slider`, {
                                        [`${prefixCls}-slider-active`]: index === state().activeIndex && state().isDragging,
                                    })}
                                    style={{ left: marker().left, width: marker().width }}
                                >
                                    <div class={`${prefixCls}-slider-list`} />
                                    <div class={`${prefixCls}-slider-buffered`} style={{ width: VideoProgressFoundation.getValueWidth(marker(), props.bufferedValue) }} />
                                    <div class={`${prefixCls}-slider-played`} style={{ width: VideoProgressFoundation.getValueWidth(marker(), props.value) }} />
                                </div>
                            )}
                        </Index>
                    </div>
                    <div class={`${prefixCls}-handle`} style={{ left: VideoProgressFoundation.getHandleLeft(props.value, props.max) }} />
                </div>
            )}
        </Tooltip>
    );
}
