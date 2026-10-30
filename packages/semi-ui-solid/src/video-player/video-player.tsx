import { type JSX, Show, createMemo, onCleanup, onMount, splitProps } from 'solid-js';
import clsx from 'clsx';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import { DEFAULT_PLAYBACK_RATE, cssClasses, numbers, strings } from '@fibrae/semi-foundation/video-player/constants';
import VideoPlayerFoundation, { type VideoPlayerAdapter } from '@fibrae/semi-foundation/video-player/foundation';
import { formatTime } from '@fibrae/semi-foundation/video-player/utils';
import '@fibrae/semi-foundation/video-player/video-player.scss';
import { IconFlipHorizontal, IconMaximize, IconMiniPlayer, IconMinimize, IconMute, IconPause, IconPlay, IconPlayCircle, IconRestart, IconVolume1, IconVolume2 } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import AudioSlider from '../audio-player/audio-slider';
import Button from '../button';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import ControlsMenu from './controls-menu';
import ErrorSvg from './error-svg';
import type { VideoControl, VideoPlayerProps, VideoPlayerState } from './interface';
import VideoProgress from './video-progress';

type Foundation = VideoPlayerFoundation<VideoPlayerProps, VideoPlayerState>;
type Adapter = VideoPlayerAdapter<VideoPlayerProps, VideoPlayerState>;

const prefixCls = cssClasses.PREFIX;
const controlsCls = cssClasses.PREFIX_CONTROLS;
const menuButtonClass = clsx(`${controlsCls}-menu-item`, `${controlsCls}-menu-button`);

const defaultProps = {
    autoPlay: false,
    clickToPlay: true,
    defaultPlaybackRate: numbers.DEFAULT_PLAYBACK_RATE,
    controlsList: [strings.PLAY, strings.NEXT, strings.TIME, strings.VOLUME, strings.PLAYBACK_RATE, strings.QUALITY, strings.ROUTE, strings.MIRROR, strings.FULLSCREEN, strings.PICTURE_IN_PICTURE],
    loop: false,
    muted: false,
    playbackRateList: DEFAULT_PLAYBACK_RATE,
    seekTime: numbers.DEFAULT_SEEK_TIME,
    theme: strings.DARK,
    volume: numbers.DEFAULT_VOLUME,
} satisfies Partial<VideoPlayerProps>;

export default function VideoPlayer(rawProps: VideoPlayerProps) {
    const props = useDefaultProps('VideoPlayer', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'ref',
        'autoPlay',
        'captionsSrc',
        'class',
        'clickToPlay',
        'controlsList',
        'crossOrigin',
        'defaultPlaybackRate',
        'defaultQuality',
        'defaultRoute',
        'height',
        'loop',
        'markers',
        'muted',
        'onMouseEnter',
        'onMouseLeave',
        'onNext',
        'onPause',
        'onPlay',
        'onQualityChange',
        'onRateChange',
        'onRouteChange',
        'onVolumeChange',
        'playbackRateList',
        'poster',
        'qualityList',
        'routeList',
        'seekTime',
        'src',
        'style',
        'theme',
        'volume',
        'width',
    ]);

    const locale = useLocale('VideoPlayer');

    let video: HTMLVideoElement | undefined;
    let wrapper: HTMLDivElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, VideoPlayerProps, VideoPlayerState>(
        VideoPlayerFoundation,
        props,
        () => ({
            bufferedValue: 0,
            currentQuality: props.defaultQuality || '',
            currentRoute: props.defaultRoute || '',
            currentTime: 0,
            isError: false,
            isFullScreen: false,
            isMirror: false,
            isPlaying: false,
            muted: props.muted,
            notificationContent: '',
            playbackRate: props.defaultPlaybackRate || 1,
            showNotification: false,
            showControls: true,
            totalTime: 0,
            volume: props.volume,
        }),
        (base) => ({
            getVideo: () => video ?? null,
            getVideoWrapper: () => wrapper ?? null,
            notifyPause: () => base.getProps().onPause?.(),
            notifyPlay: () => base.getProps().onPlay?.(),
            notifyQualityChange: (quality) => base.getProps().onQualityChange?.(quality),
            notifyRateChange: (rate) => base.getProps().onRateChange?.(rate),
            notifyRouteChange: (route) => base.getProps().onRouteChange?.(route),
            notifyVolumeChange: (volume) => base.getProps().onVolumeChange?.(volume),
            setBufferedValue: (bufferedValue) => base.setState({ bufferedValue }),
            setCurrentTime: (currentTime) => base.setState({ currentTime }),
            setIsError: (isError) => base.setState({ isError }),
            setIsFullScreen: (isFullScreen) => base.setState({ isFullScreen }),
            setIsMirror: (isMirror) => base.setState({ isMirror }),
            setIsPlaying: (isPlaying) => base.setState({ isPlaying }),
            setMuted: (muted) => base.setState({ muted }),
            setNotificationContent: (notificationContent) => base.setState({ notificationContent }),
            setPlaybackRate: (playbackRate) => base.setState({ playbackRate }),
            setQuality: (currentQuality) => base.setState({ currentQuality }),
            setRoute: (currentRoute) => base.setState({ currentRoute }),
            setShowControls: (showControls) => base.setState({ showControls }),
            setShowNotification: (showNotification) => base.setState({ showNotification }),
            setTotalTime: (totalTime) => base.setState({ totalTime }),
            setVolume: (volume) => base.setState({ volume }),
        })
    );

    // removing src keeps the loaded video
    const videoSrc = createMemo<string | undefined>((previous) => local.src ?? previous);

    const text = () => locale().locale;

    const rootStyle = () => mergeStyles({ width: toCssLength(local.width), height: toCssLength(local.height) }, local.style);

    const shows = (name: VideoControl) => local.controlsList.includes(name);

    const iconButton = (icon: () => JSX.Element, onClick: () => void, name: VideoControl, label: () => string) => (
        <Show when={shows(name)}>
            <Button class={menuButtonClass} aria-label={label()} theme="borderless" icon={icon()} onClick={onClick} />
        </Show>
    );

    const renderVolume = () => (
        <Show when={shows(strings.VOLUME)}>
            <Popover
                class={`${controlsCls}-popover`}
                // the popup holds an interactive range, which a tooltip may not contain
                aria-label={text().volume}
                role="dialog"
                autoAdjustOverflow
                content={
                    <div class={`${controlsCls}-volume`}>
                        <div class={`${controlsCls}-volume-title`}>{state().muted ? 0 : state().volume}%</div>
                        <AudioSlider max={100} value={state().muted ? 0 : state().volume} getValueText={(value) => `${value}%`} height={120} label={text().volume} showTooltip={false} vertical onChange={foundation.handleVolumeChange} />
                    </div>
                }
                position="top"
            >
                {(getTriggerProps) => <Button {...getTriggerProps()} class={menuButtonClass} aria-label={text().volume} theme="borderless" icon={state().muted ? <IconMute /> : state().volume < 50 ? <IconVolume1 /> : <IconVolume2 />} onClick={foundation.handleVolumeSilent} />}
            </Popover>
        </Show>
    );

    // Solid leaves JSX listeners on the element after unmount, and a playing video removed from the page still fires
    // pause, which would reach onPause
    onMount(() => {
        const controller = new AbortController();
        onCleanup(() => controller.abort());
        const handlers: Record<string, () => void> = {
            canplay: foundation.handleCanPlay,
            durationchange: foundation.handleDurationChange,
            ended: foundation.handleEnded,
            error: foundation.handleError,
            loadstart: foundation.handleLoadStart,
            pause: foundation.handleVideoPause,
            play: foundation.handleVideoPlay,
            progress: foundation.handleProgress,
            stalled: () => foundation.handleStalled(text()),
            timeupdate: foundation.handleTimeUpdate,
            waiting: () => foundation.handleWaiting(text()),
        };
        for (const [type, handler] of Object.entries(handlers)) {
            video?.addEventListener(type, handler, { signal: controller.signal });
        }
    });

    return (
        <div
            {...rest}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as VideoPlayerProps['role']}
            ref={(node) => (wrapper = node)}
            class={clsx(prefixCls, local.class, { [`${prefixCls}-mirror`]: state().isMirror })}
            style={rootStyle()}
            onMouseEnter={(event) => {
                foundation.handleMouseEnterWrapper();
                callHandler(local.onMouseEnter, event);
            }}
            onMouseLeave={(event) => {
                foundation.handleMouseLeaveWrapper();
                callHandler(local.onMouseLeave, event);
            }}
        >
            <div class={clsx(`${prefixCls}-wrapper`, { [`${prefixCls}-wrapper-${local.theme}`]: local.theme })}>
                <video
                    ref={mergeRefs(local.ref, (node: HTMLVideoElement) => (video = node))}
                    autoplay={local.autoPlay}
                    controls={false}
                    crossOrigin={local.crossOrigin}
                    loop={local.loop}
                    src={videoSrc()}
                    onClick={() => {
                        if (local.clickToPlay) {
                            foundation.handlePlayOrPause();
                        }
                    }}
                >
                    {/* without default the text track stays disabled and, with no caption switch, never shows */}
                    <track default={!!local.captionsSrc} kind="captions" src={local.captionsSrc} />
                </video>
                <Show when={local.src == null}>
                    <div class={`${prefixCls}-resource-not-found`}>{text().noResource}</div>
                </Show>
            </div>
            <Show when={!state().isPlaying && local.poster}>
                <img
                    class={clsx(`${prefixCls}-poster`, {
                        [`${prefixCls}-poster-hide`]: state().currentTime > 0 && state().currentTime < state().totalTime,
                    })}
                    alt={text().poster}
                    src={local.poster}
                />
            </Show>
            <Show when={!state().isPlaying && !state().isError}>
                <div class={`${prefixCls}-pause`}>
                    <IconPlayCircle />
                </div>
            </Show>
            <Show when={state().isError}>
                <div class={clsx(`${prefixCls}-error`, { [`${prefixCls}-error-${local.theme}`]: local.theme })} role="alert">
                    <div class={`${prefixCls}-error-svg`}>
                        <ErrorSvg />
                    </div>
                    {text().videoError}
                </div>
            </Show>
            {/* a live region announces changes only once it exists, so it stays while the notification comes and goes */}
            <div role="status">
                <Show when={state().showNotification && state().notificationContent}>
                    <div class={`${prefixCls}-notification`}>{state().notificationContent}</div>
                </Show>
            </div>
            <div class={clsx(controlsCls, { [`${controlsCls}-hide`]: !state().showControls })}>
                <VideoProgress max={state().totalTime} step={local.seekTime} value={state().currentTime} bufferedValue={state().bufferedValue} markers={local.markers} onChange={foundation.handleTimeChange} />
                <div class={`${controlsCls}-menu`}>
                    <div class={`${controlsCls}-menu-left`}>
                        {iconButton(
                            () => (state().isPlaying ? <IconPause /> : <IconPlay />),
                            foundation.handlePlayOrPause,
                            strings.PLAY,
                            () => (state().isPlaying ? text().pause : text().play)
                        )}
                        <Show when={local.onNext}>
                            {iconButton(
                                () => (
                                    <IconRestart rotate={180} />
                                ),
                                () => local.onNext?.(),
                                strings.NEXT,
                                () => text().next
                            )}
                        </Show>
                        <Show when={shows(strings.TIME)}>
                            <div class={`${controlsCls}-time`}>
                                {formatTime(state().currentTime)} / {formatTime(state().totalTime)}
                            </div>
                        </Show>
                        {renderVolume()}
                        <Show when={shows(strings.PLAYBACK_RATE)}>
                            <ControlsMenu current={state().playbackRate} label={text().playbackRate} list={local.playbackRateList} onSelect={(option) => foundation.handleRateChange(option, text())} />
                        </Show>
                    </div>
                    <div class={`${controlsCls}-menu-right`}>
                        <Show when={shows(strings.QUALITY) && local.qualityList?.length}>
                            <ControlsMenu current={state().currentQuality} label={text().quality} list={local.qualityList ?? []} onSelect={(option) => foundation.handleQualityChange(option, text())} />
                        </Show>
                        <Show when={shows(strings.ROUTE) && local.routeList?.length}>
                            <ControlsMenu current={state().currentRoute} label={text().route} list={local.routeList ?? []} onSelect={(option) => foundation.handleRouteChange(option, text())} />
                        </Show>
                        {iconButton(
                            () => (
                                <IconFlipHorizontal />
                            ),
                            () => foundation.handleMirror(text()),
                            strings.MIRROR,
                            () => (state().isMirror ? text().cancelMirror : text().mirror)
                        )}
                        {iconButton(
                            () => (state().isFullScreen ? <IconMinimize /> : <IconMaximize />),
                            foundation.handleFullscreen,
                            strings.FULLSCREEN,
                            () => (state().isFullScreen ? text().exitFullscreen : text().fullscreen)
                        )}
                        {iconButton(
                            () => (
                                <IconMiniPlayer />
                            ),
                            foundation.handlePictureInPicture,
                            strings.PICTURE_IN_PICTURE,
                            () => text().pictureInPicture
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
