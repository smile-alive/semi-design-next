import type React from 'react';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, DEFAULT_CONTROLS_LIST, DEFAULT_PLAYBACK_RATE, numbers, strings, type VideoControl } from '@fibrae/semi-foundation/components/video-player/constants';
import VideoPlayerFoundation, { type VideoPlayerAdapter, type VideoPlayerState } from '@fibrae/semi-foundation/components/video-player/foundation';
import type { Marker } from '@fibrae/semi-foundation/components/video-player/progress-foundation';
import { formatTime } from '@fibrae/semi-foundation/components/video-player/utils';
import type { Locale } from '@fibrae/semi-foundation/locale';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/video-player/video-player.scss';
import { IconPlay, IconPause, IconVolume1, IconVolume2, IconRestart, IconFlipHorizontal, IconMinimize, IconMaximize, IconMute, IconPlayCircle, IconMiniPlayer } from '@fibrae/semi-icons-react';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useMergedRef } from '../../hooks/index';
import type { MediaEventKeys } from '../../utils/index';
import AudioSlider from '../audio-player/audio-slider';
import Button from '../button';
import Dropdown from '../dropdown';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import ErrorSVG from './error-svg';
import VideoProgress from './video-progress';

type Foundation = VideoPlayerFoundation<VideoPlayerProps>;
type Adapter = VideoPlayerAdapter<VideoPlayerProps>;

const prefixCls = cssClasses.PREFIX;
const controlsCls = cssClasses.PREFIX_CONTROLS;

export interface VideoPlayerOption<T> {
    label: string;
    value: T;
}

export type VideoPlayerMarker = Marker;

export type VideoPlayerTheme = 'dark' | 'light';

export type { VideoControl, VideoPlayerState };

export interface VideoPlayerProps extends ElementProps<'div', MediaEventKeys> {
    autoPlay?: boolean;
    captionsSrc?: string;
    className?: string;
    clickToPlay?: boolean;
    controlsList?: VideoControl[];
    crossOrigin?: React.MediaHTMLAttributes<HTMLVideoElement>['crossOrigin'];
    defaultPlaybackRate?: number;
    defaultQuality?: string;
    defaultRoute?: string;
    height?: number | string;
    loop?: boolean;
    markers?: VideoPlayerMarker[];
    muted?: boolean;
    /** The next button shows only when this is set and `controlsList` includes `next` */
    onNext?: () => void;
    onPause?: () => void;
    onPlay?: () => void;
    onQualityChange?: (quality: string) => void;
    onRateChange?: (rate: number) => void;
    onRouteChange?: (route: string) => void;
    onVolumeChange?: (volume: number) => void;
    playbackRateList?: VideoPlayerOption<number>[];
    poster?: string;
    qualityList?: VideoPlayerOption<string>[];
    /** Attached to the native video element */
    ref?: React.Ref<HTMLVideoElement>;
    routeList?: VideoPlayerOption<string>[];
    seekTime?: number;
    src?: string;
    style?: React.CSSProperties;
    theme?: VideoPlayerTheme;
    volume?: number;
    width?: number | string;
}

const defaultProps = {
    autoPlay: false,
    clickToPlay: true,
    defaultPlaybackRate: numbers.DEFAULT_PLAYBACK_RATE,
    controlsList: DEFAULT_CONTROLS_LIST,
    loop: false,
    muted: false,
    playbackRateList: DEFAULT_PLAYBACK_RATE,
    seekTime: numbers.DEFAULT_SEEK_TIME,
    theme: strings.DARK,
    volume: numbers.DEFAULT_VOLUME,
} satisfies Partial<VideoPlayerProps>;

export default function VideoPlayer(rawProps: VideoPlayerProps) {
    const props = useDefaultProps('VideoPlayer', rawProps, defaultProps);

    const { locale } = useLocale('VideoPlayer');

    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // removing src keeps the loaded video
    const [src, setSrc] = useState(props.src);

    const [foundation, state] = useFoundation<Foundation, Adapter, VideoPlayerProps, VideoPlayerState>(
        VideoPlayerFoundation,
        props,
        () => VideoPlayerFoundation.getInitialState(props),
        (base) => ({
            getVideo: () => videoRef.current,
            getVideoWrapper: () => wrapperRef.current,
            notifyPause: () => base.getProps().onPause?.(),
            notifyPlay: () => base.getProps().onPlay?.(),
            notifyQualityChange: (quality) => base.getProps().onQualityChange?.(quality),
            notifyRateChange: (rate) => base.getProps().onRateChange?.(rate),
            notifyRouteChange: (route) => base.getProps().onRouteChange?.(route),
            notifyVolumeChange: (volume) => base.getProps().onVolumeChange?.(volume),
        })
    );

    if (props.src != null && props.src !== src) {
        setSrc(props.src);
    }

    const {
        ref,
        autoPlay,
        captionsSrc,
        className,
        clickToPlay,
        controlsList,
        crossOrigin,
        defaultPlaybackRate,
        defaultQuality,
        defaultRoute,
        height,
        loop,
        markers,
        muted: mutedProp,
        onMouseEnter,
        onMouseLeave,
        onNext,
        onPause,
        onPlay,
        onQualityChange,
        onRateChange,
        onRouteChange,
        onVolumeChange,
        playbackRateList,
        poster,
        qualityList,
        routeList,
        seekTime,
        src: srcProp,
        style,
        theme,
        volume: volumeProp,
        width,
        ...rest
    } = props;

    const { bufferedValue, currentQuality, currentRoute, currentTime, isError, isFullScreen, isMirror, isPlaying, muted, notificationContent, playbackRate, showNotification, showControls, totalTime, volume } = state;
    const mergedVideoRef = useMergedRef(ref, videoRef);

    const renderIconButton = (icon: React.ReactNode, onClick: () => void, name: VideoControl, label: string) => controlsList.includes(name) && <Button className={clsx(`${controlsCls}-menu-item`, `${controlsCls}-menu-button`)} aria-label={label} theme="borderless" icon={icon} onClick={onClick} />;

    const renderDropdownButton = <T extends string | number>(currentValue: T, list: VideoPlayerOption<T>[], handleChange: (option: VideoPlayerOption<T>, locale: Locale['VideoPlayer']) => void, name: VideoControl, purpose: string) => {
        const currentLabel = list.find((option) => option.value === currentValue)?.label ?? String(currentValue);
        return (
            controlsList.includes(name) && (
                <Dropdown
                    className={`${controlsCls}-popup-menu`}
                    position="top"
                    render={
                        <Dropdown.Menu>
                            {list.map((option) => (
                                <Dropdown.Item key={option.value} className={`${controlsCls}-popup-menu-item`} active={option.value === currentValue} onClick={() => handleChange(option, locale)}>
                                    {option.label}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    }
                    selectionMode="single"
                >
                    <button
                        type="button"
                        className={clsx(`${controlsCls}-menu-item`, `${controlsCls}-popup`)}
                        // the visible text alone does not say what the menu sets
                        aria-label={[purpose, currentLabel].filter(Boolean).join(' ')}
                    >
                        {currentLabel}
                    </button>
                </Dropdown>
            )
        );
    };

    const renderVolume = () =>
        controlsList.includes(strings.VOLUME) && (
            <Popover
                className={`${controlsCls}-popover`}
                // the popup holds an interactive range, which a tooltip may not contain
                aria-label={locale.volume}
                role="dialog"
                autoAdjustOverflow
                content={
                    <div className={`${controlsCls}-volume`}>
                        <div className={`${controlsCls}-volume-title`}>{muted ? 0 : volume}%</div>
                        <AudioSlider max={100} value={muted ? 0 : volume} getValueText={(value) => `${value}%`} height={120} label={locale.volume} showTooltip={false} vertical onChange={foundation.handleVolumeChange} />
                    </div>
                }
                position="top"
            >
                <Button className={clsx(`${controlsCls}-menu-item`, `${controlsCls}-menu-button`)} aria-label={locale.volume} theme="borderless" icon={muted ? <IconMute /> : volume < 50 ? <IconVolume1 /> : <IconVolume2 />} onClick={foundation.handleVolumeSilent} />
            </Popover>
        );

    return (
        <div
            role={namedRole(rest)}
            {...rest}
            ref={wrapperRef}
            className={clsx(prefixCls, className, { [`${prefixCls}-mirror`]: isMirror })}
            style={{ width, height, ...style }}
            onMouseEnter={(e) => {
                foundation.handleMouseEnterWrapper();
                onMouseEnter?.(e);
            }}
            onMouseLeave={(e) => {
                foundation.handleMouseLeaveWrapper();
                onMouseLeave?.(e);
            }}
        >
            <div className={clsx(`${prefixCls}-wrapper`, { [`${prefixCls}-wrapper-${theme}`]: theme })}>
                <video
                    ref={mergedVideoRef}
                    autoPlay={autoPlay}
                    controls={false}
                    crossOrigin={crossOrigin}
                    loop={loop}
                    src={src}
                    onCanPlay={foundation.handleCanPlay}
                    onClick={clickToPlay ? () => foundation.handlePlayOrPause() : undefined}
                    onDurationChange={foundation.handleDurationChange}
                    onEnded={foundation.handleEnded}
                    onError={foundation.handleError}
                    onLoadStart={foundation.handleLoadStart}
                    onPause={foundation.handleVideoPause}
                    onPlay={foundation.handleVideoPlay}
                    onProgress={foundation.handleProgress}
                    onStalled={() => foundation.handleStalled(locale)}
                    onTimeUpdate={foundation.handleTimeUpdate}
                    onWaiting={() => foundation.handleWaiting(locale)}
                >
                    {/* without default the text track stays disabled and, with no caption switch, never shows */}
                    <track default={!!captionsSrc} kind="captions" src={captionsSrc} />
                </video>
                {srcProp == null && <div className={`${prefixCls}-resource-not-found`}>{locale.noResource}</div>}
            </div>
            {!isPlaying && poster && (
                <img
                    className={clsx(`${prefixCls}-poster`, {
                        [`${prefixCls}-poster-hide`]: currentTime > 0 && currentTime < totalTime,
                    })}
                    alt={locale.poster}
                    src={poster}
                />
            )}
            {!isPlaying && !isError && (
                <div className={`${prefixCls}-pause`}>
                    <IconPlayCircle />
                </div>
            )}
            {isError && (
                <div className={clsx(`${prefixCls}-error`, { [`${prefixCls}-error-${theme}`]: theme })} role="alert">
                    <div className={`${prefixCls}-error-svg`}>
                        <ErrorSVG />
                    </div>
                    {locale.videoError}
                </div>
            )}
            {/* a live region announces changes only once it exists, so it stays while the notification comes and goes */}
            <div role="status">{showNotification && notificationContent && <div className={`${prefixCls}-notification`}>{notificationContent}</div>}</div>
            <div className={clsx(controlsCls, { [`${controlsCls}-hide`]: !showControls })}>
                <VideoProgress max={totalTime} step={seekTime} value={currentTime} bufferedValue={bufferedValue} markers={markers} onChange={foundation.handleTimeChange} />
                <div className={`${controlsCls}-menu`}>
                    <div className={`${controlsCls}-menu-left`}>
                        {renderIconButton(isPlaying ? <IconPause /> : <IconPlay />, foundation.handlePlayOrPause, strings.PLAY, isPlaying ? locale.pause : locale.play)}
                        {onNext && renderIconButton(<IconRestart rotate={180} />, onNext, strings.NEXT, locale.next)}
                        {controlsList.includes(strings.TIME) && (
                            <div className={`${controlsCls}-time`}>
                                {formatTime(currentTime)} / {formatTime(totalTime)}
                            </div>
                        )}
                        {renderVolume()}
                        {renderDropdownButton(playbackRate, playbackRateList, foundation.handleRateChange, strings.PLAYBACK_RATE, locale.playbackRate)}
                    </div>
                    <div className={`${controlsCls}-menu-right`}>
                        {qualityList && qualityList.length > 0 && renderDropdownButton(currentQuality, qualityList, foundation.handleQualityChange, strings.QUALITY, locale.quality)}
                        {routeList && routeList.length > 0 && renderDropdownButton(currentRoute, routeList, foundation.handleRouteChange, strings.ROUTE, locale.route)}
                        {renderIconButton(<IconFlipHorizontal />, () => foundation.handleMirror(locale), strings.MIRROR, isMirror ? locale.cancelMirror : locale.mirror)}
                        {renderIconButton(isFullScreen ? <IconMinimize /> : <IconMaximize />, foundation.handleFullscreen, strings.FULLSCREEN, isFullScreen ? locale.exitFullscreen : locale.fullscreen)}
                        {renderIconButton(<IconMiniPlayer />, foundation.handlePictureInPicture, strings.PICTURE_IN_PICTURE, locale.pictureInPicture)}
                    </div>
                </div>
            </div>
        </div>
    );
}
