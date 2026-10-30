<script lang="ts">
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { cssClasses, DEFAULT_PLAYBACK_RATE, numbers, strings } from '@fibrae/semi-foundation/video-player/constants';
    import VideoPlayerFoundation, { type VideoPlayerAdapter, type VideoPlayerBaseProps } from '@fibrae/semi-foundation/video-player/foundation';
    import { formatTime } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/video-player/video-player.scss';
    import { IconFlipHorizontal, IconMaximize, IconMiniPlayer, IconMinimize, IconMute, IconPause, IconPlay, IconPlayCircle, IconRestart, IconVolume1, IconVolume2 } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import AudioSlider from '../audio-player/audio-slider.svelte';
    import { Button } from '../button/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import ControlsMenu from './controls-menu.svelte';
    import type { VideoControl, VideoPlayerProps, VideoPlayerState } from './interface.js';
    import VideoProgress from './video-progress.svelte';

    type Foundation = VideoPlayerFoundation<VideoPlayerBaseProps, VideoPlayerState>;
    type Adapter = VideoPlayerAdapter<VideoPlayerBaseProps, VideoPlayerState>;

    const defaults = useDefaultProps('VideoPlayer');

    let {
        autoPlay = defaults('autoPlay', false),
        captionsSrc = defaults('captionsSrc'),
        clickToPlay = defaults('clickToPlay', true),
        controlsList = defaults('controlsList', [strings.PLAY, strings.NEXT, strings.TIME, strings.VOLUME, strings.PLAYBACK_RATE, strings.QUALITY, strings.ROUTE, strings.MIRROR, strings.FULLSCREEN, strings.PICTURE_IN_PICTURE]),
        crossOrigin = defaults('crossOrigin'),
        defaultPlaybackRate = defaults('defaultPlaybackRate', numbers.DEFAULT_PLAYBACK_RATE),
        defaultQuality = defaults('defaultQuality'),
        defaultRoute = defaults('defaultRoute'),
        height = defaults('height'),
        loop = defaults('loop', false),
        markers = defaults('markers'),
        muted = defaults('muted', false),
        onNext = defaults('onNext'),
        onPause,
        onPlay,
        onQualityChange,
        onRateChange,
        onRouteChange,
        onVolumeChange,
        playbackRateList = defaults('playbackRateList', DEFAULT_PLAYBACK_RATE),
        poster = defaults('poster'),
        qualityList = defaults('qualityList'),
        routeList = defaults('routeList'),
        seekTime = defaults('seekTime', numbers.DEFAULT_SEEK_TIME),
        src = defaults('src'),
        theme = defaults('theme', strings.DARK),
        volume = defaults('volume', numbers.DEFAULT_VOLUME),
        width = defaults('width'),
        ...rest
    }: VideoPlayerProps = $props();

    const locale = useLocale('VideoPlayer');

    let video = $state<HTMLVideoElement>();
    let root = $state<HTMLDivElement>();

    // Removing src keeps the loaded video: the derivation falls back to the last src it saw
    let lastSrc: string | undefined;

    // the state props are read once, when the player mounts
    const foundationProps: VideoPlayerBaseProps = {
        get muted() {
            return muted;
        },
        get seekTime() {
            return seekTime;
        },
        get volume() {
            return volume;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, VideoPlayerBaseProps, VideoPlayerState>(
        VideoPlayerFoundation,
        foundationProps,
        () => ({
            bufferedValue: 0,
            currentQuality: defaultQuality || '',
            currentRoute: defaultRoute || '',
            currentTime: 0,
            isError: false,
            isFullScreen: false,
            isMirror: false,
            isPlaying: false,
            muted,
            notificationContent: '',
            playbackRate: defaultPlaybackRate || 1,
            showNotification: false,
            showControls: true,
            totalTime: 0,
            volume,
        }),
        (base) => ({
            getVideo: () => video ?? null,
            getVideoWrapper: () => root ?? null,
            notifyPause: () => onPause?.(),
            notifyPlay: () => onPlay?.(),
            notifyQualityChange: (quality) => onQualityChange?.(quality),
            notifyRateChange: (rate) => onRateChange?.(rate),
            notifyRouteChange: (route) => onRouteChange?.(route),
            notifyVolumeChange: (next) => onVolumeChange?.(next),
            setBufferedValue: (bufferedValue) => base.setState({ bufferedValue }),
            setCurrentTime: (currentTime) => base.setState({ currentTime }),
            setIsError: (isError) => base.setState({ isError }),
            setIsFullScreen: (isFullScreen) => base.setState({ isFullScreen }),
            setIsMirror: (isMirror) => base.setState({ isMirror }),
            setIsPlaying: (isPlaying) => base.setState({ isPlaying }),
            setMuted: (nextMuted) => base.setState({ muted: nextMuted }),
            setNotificationContent: (notificationContent) => base.setState({ notificationContent }),
            setPlaybackRate: (playbackRate) => base.setState({ playbackRate }),
            setQuality: (currentQuality) => base.setState({ currentQuality }),
            setRoute: (currentRoute) => base.setState({ currentRoute }),
            setShowControls: (showControls) => base.setState({ showControls }),
            setShowNotification: (showNotification) => base.setState({ showNotification }),
            setTotalTime: (totalTime) => base.setState({ totalTime }),
            setVolume: (nextVolume) => base.setState({ volume: nextVolume }),
        })
    );

    const prefix = cssClasses.PREFIX;
    const controlsCls = cssClasses.PREFIX_CONTROLS;
    const menuButtonClass = [`${controlsCls}-menu-item`, `${controlsCls}-menu-button`];
    const texts = $derived(locale().locale);
    const videoSrc = $derived((lastSrc = src ?? lastSrc));
    const rootStyle = $derived([width != null && `width: ${toCssLength(width)}`, height != null && `height: ${toCssLength(height)}`, rest.style].filter(Boolean).join(';') || undefined);

    const shows = (name: VideoControl) => controlsList.includes(name);

    const onVideoClick = () => {
        if (clickToPlay) {
            foundation.handlePlayOrPause();
        }
    };

    const volumeText = (value: number) => `${value}%`;

    /** The native video element; undefined before mount */
    export function getVideo() {
        return video;
    }
</script>

<div
    bind:this={root}
    {...rest}
    class={[prefix, rest.class, { [`${prefix}-mirror`]: states().isMirror }]}
    role={groupRole(rest)}
    style={rootStyle}
    onmouseenter={(event) => {
        rest.onmouseenter?.(event);
        foundation.handleMouseEnterWrapper();
    }}
    onmouseleave={(event) => {
        rest.onmouseleave?.(event);
        foundation.handleMouseLeaveWrapper();
    }}
>
    <div class={[`${prefix}-wrapper`, theme && `${prefix}-wrapper-${theme}`]}>
        <video
            autoplay={autoPlay}
            bind:this={video}
            controls={false}
            crossorigin={crossOrigin}
            {loop}
            src={videoSrc}
            oncanplay={foundation.handleCanPlay}
            onclick={onVideoClick}
            ondurationchange={foundation.handleDurationChange}
            onended={foundation.handleEnded}
            onerror={foundation.handleError}
            onloadstart={foundation.handleLoadStart}
            onpause={foundation.handleVideoPause}
            onplay={foundation.handleVideoPlay}
            onprogress={foundation.handleProgress}
            onstalled={() => foundation.handleStalled(texts)}
            ontimeupdate={foundation.handleTimeUpdate}
            onwaiting={() => foundation.handleWaiting(texts)}
        >
            <!-- without default the text track stays disabled and, with no caption switch, never shows -->
            <track default={!!captionsSrc} kind="captions" src={captionsSrc} />
        </video>
        {#if src == null}
            <div class={`${prefix}-resource-not-found`}>{texts.noResource}</div>
        {/if}
    </div>
    {#if !states().isPlaying && poster}
        <img alt={texts.poster} class={[`${prefix}-poster`, { [`${prefix}-poster-hide`]: states().currentTime > 0 && states().currentTime < states().totalTime }]} src={poster} />
    {/if}
    {#if !states().isPlaying && !states().isError}
        <div class={`${prefix}-pause`}>
            <IconPlayCircle />
        </div>
    {/if}
    {#if states().isError}
        <div class={[`${prefix}-error`, theme && `${prefix}-error-${theme}`]} role="alert">
            <div class={`${prefix}-error-svg`}>
                <svg fill="none" height="30" viewBox="0 0 41 30" width="41" xmlns="http://www.w3.org/2000/svg">
                    <path
                        clip-rule="evenodd"
                        d="M3.875 4.5C3.875 3.67157 4.54657 3 5.375 3H29.375C30.2034 3 30.875 3.67157 30.875 4.5V11.0446C30.875 11.9448 31.9714 12.3866 32.5956 11.7379L36.2647 7.92487C36.5768 7.60054 37.125 7.82146 37.125 8.27156V21.7284C37.125 22.1785 36.5768 22.3995 36.2647 22.0751L32.5956 18.2621C31.9714 17.6134 30.875 18.0552 30.875 18.9554V25.5C30.875 26.3284 30.2034 27 29.375 27H5.375C4.54657 27 3.875 26.3284 3.875 25.5V4.5ZM5.375 0C2.88972 0 0.875 2.01472 0.875 4.5V25.5C0.875 27.9853 2.88972 30 5.375 30H29.375C31.8603 30 33.875 27.9853 33.875 25.5V23.9183L34.103 24.1553C36.2876 26.4256 40.125 24.8792 40.125 21.7284V8.27156C40.125 5.12082 36.2876 3.5744 34.103 5.84475L33.875 6.08167V4.5C33.875 2.01472 31.8603 0 29.375 0H5.375ZM13.875 10.5C13.875 9.67157 13.2034 9 12.375 9C11.5466 9 10.875 9.67157 10.875 10.5V14.5C10.875 15.3284 11.5466 16 12.375 16C13.2034 16 13.875 15.3284 13.875 14.5V10.5ZM23.875 9C24.7034 9 25.375 9.67157 25.375 10.5V14.5C25.375 15.3284 24.7034 16 23.875 16C23.0466 16 22.375 15.3284 22.375 14.5V10.5C22.375 9.67157 23.0466 9 23.875 9ZM12.6231 22.3321C13.3039 21.3108 14.9319 20 18.375 20C20.192 20 21.3252 20.2374 22.1317 20.611C22.9124 20.9727 23.5161 21.5215 24.175 22.4C24.6721 23.0627 25.6123 23.1971 26.275 22.7C26.9377 22.2029 27.0721 21.2627 26.575 20.6C25.7339 19.4785 24.7706 18.5273 23.3928 17.889C22.0407 17.2626 20.424 17 18.375 17C14.0862 17 11.4461 18.6892 10.1269 20.6679C9.6674 21.3572 9.85366 22.2885 10.5429 22.7481C11.2322 23.2076 12.1635 23.0213 12.6231 22.3321Z"
                        fill="#F9F9F9"
                        fill-opacity="0.8"
                        fill-rule="evenodd"
                    />
                </svg>
            </div>
            {texts.videoError}
        </div>
    {/if}
    <div role="status">
        {#if states().showNotification && states().notificationContent}
            <div class={`${prefix}-notification`}>
                {states().notificationContent}
            </div>
        {/if}
    </div>
    <div class={[controlsCls, { [`${controlsCls}-hide`]: !states().showControls }]}>
        <VideoProgress bufferedValue={states().bufferedValue} {markers} max={states().totalTime} onChange={foundation.handleTimeChange} step={seekTime} value={states().currentTime} />
        <div class={`${controlsCls}-menu`}>
            <div class={`${controlsCls}-menu-left`}>
                {#if shows('play')}
                    <Button aria-label={states().isPlaying ? texts.pause : texts.play} class={menuButtonClass} theme="borderless" onclick={foundation.handlePlayOrPause}>
                        {#snippet icon()}
                            {#if states().isPlaying}
                                <IconPause />
                            {:else}
                                <IconPlay />
                            {/if}
                        {/snippet}
                    </Button>
                {/if}
                {#if onNext && shows('next')}
                    <Button aria-label={texts.next} class={menuButtonClass} theme="borderless" onclick={() => onNext()}>
                        {#snippet icon()}
                            <IconRestart rotate={180} />
                        {/snippet}
                    </Button>
                {/if}
                {#if shows('time')}
                    <div class={`${controlsCls}-time`}>{formatTime(states().currentTime)} / {formatTime(states().totalTime)}</div>
                {/if}
                {#if shows('volume')}
                    <Popover aria-label={texts.volume} autoAdjustOverflow class={`${controlsCls}-popover`} position="top" role="dialog">
                        {#snippet child({ props })}
                            <Button {...props} aria-label={texts.volume} class={menuButtonClass} theme="borderless" onclick={foundation.handleVolumeSilent}>
                                {#snippet icon()}
                                    {#if states().muted}
                                        <IconMute />
                                    {:else if states().volume < 50}
                                        <IconVolume1 />
                                    {:else}
                                        <IconVolume2 />
                                    {/if}
                                {/snippet}
                            </Button>
                        {/snippet}
                        {#snippet content()}
                            <div class={`${controlsCls}-volume`}>
                                <div class={`${controlsCls}-volume-title`}>{states().muted ? 0 : states().volume}%</div>
                                <AudioSlider getValueText={volumeText} height={120} label={texts.volume} max={100} onChange={foundation.handleVolumeChange} showTooltip={false} value={states().muted ? 0 : states().volume} vertical />
                            </div>
                        {/snippet}
                    </Popover>
                {/if}
                {#if shows('playbackRate')}
                    <ControlsMenu current={states().playbackRate} label={texts.playbackRate} list={playbackRateList} onSelect={(option) => foundation.handleRateChange(option, texts)} />
                {/if}
            </div>
            <div class={`${controlsCls}-menu-right`}>
                {#if qualityList?.length && shows('quality')}
                    <ControlsMenu current={states().currentQuality} label={texts.quality} list={qualityList} onSelect={(option) => foundation.handleQualityChange(option, texts)} />
                {/if}
                {#if routeList?.length && shows('route')}
                    <ControlsMenu current={states().currentRoute} label={texts.route} list={routeList} onSelect={(option) => foundation.handleRouteChange(option, texts)} />
                {/if}
                {#if shows('mirror')}
                    <Button aria-label={states().isMirror ? texts.cancelMirror : texts.mirror} class={menuButtonClass} theme="borderless" onclick={() => foundation.handleMirror(texts)}>
                        {#snippet icon()}
                            <IconFlipHorizontal />
                        {/snippet}
                    </Button>
                {/if}
                {#if shows('fullscreen')}
                    <Button aria-label={states().isFullScreen ? texts.exitFullscreen : texts.fullscreen} class={menuButtonClass} theme="borderless" onclick={foundation.handleFullscreen}>
                        {#snippet icon()}
                            {#if states().isFullScreen}
                                <IconMinimize />
                            {:else}
                                <IconMaximize />
                            {/if}
                        {/snippet}
                    </Button>
                {/if}
                {#if shows('pictureInPicture')}
                    <Button aria-label={texts.pictureInPicture} class={menuButtonClass} theme="borderless" onclick={foundation.handlePictureInPicture}>
                        {#snippet icon()}
                            <IconMiniPlayer />
                        {/snippet}
                    </Button>
                {/if}
            </div>
        </div>
    </div>
</div>
