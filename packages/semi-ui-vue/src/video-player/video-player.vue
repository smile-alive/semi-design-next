<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { cssClasses, DEFAULT_PLAYBACK_RATE, numbers, strings } from '@fibrae/semi-foundation/video-player/constants';
    import VideoPlayerFoundation, { type VideoPlayerAdapter } from '@fibrae/semi-foundation/video-player/foundation';
    import { formatTime } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/video-player/video-player.scss';
    import { IconFlipHorizontal, IconMaximize, IconMiniPlayer, IconMinimize, IconMute, IconPause, IconPlay, IconPlayCircle, IconRestart, IconVolume1, IconVolume2 } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
    import AudioSlider from '../audio-player/audio-slider.vue';
    import Button from '../button';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import ControlsMenu from './controls-menu.vue';
    import type { VideoControl, VideoPlayerEmits, VideoPlayerHandle, VideoPlayerProps, VideoPlayerState } from './interface';
    import VideoProgress from './video-progress.vue';

    type Foundation = VideoPlayerFoundation<VideoPlayerProps, VideoPlayerState>;
    type Adapter = VideoPlayerAdapter<VideoPlayerProps, VideoPlayerState>;

    const props = withDefaults(defineProps<VideoPlayerProps & /* @vue-ignore */ ElementProps<'div', keyof VideoPlayerProps | EmitHandlers<VideoPlayerEmits>>>(), {
        autoPlay: () => semiDefault('VideoPlayer', 'autoPlay', false),
        captionsSrc: semiGlobalDefault('VideoPlayer', 'captionsSrc'),
        clickToPlay: () => semiDefault('VideoPlayer', 'clickToPlay', true),
        controlsList: () => semiDefault('VideoPlayer', 'controlsList', [strings.PLAY, strings.NEXT, strings.TIME, strings.VOLUME, strings.PLAYBACK_RATE, strings.QUALITY, strings.ROUTE, strings.MIRROR, strings.FULLSCREEN, strings.PICTURE_IN_PICTURE]),
        crossOrigin: semiGlobalDefault('VideoPlayer', 'crossOrigin'),
        defaultPlaybackRate: () => semiDefault('VideoPlayer', 'defaultPlaybackRate', numbers.DEFAULT_PLAYBACK_RATE),
        defaultQuality: semiGlobalDefault('VideoPlayer', 'defaultQuality'),
        defaultRoute: semiGlobalDefault('VideoPlayer', 'defaultRoute'),
        height: semiGlobalDefault('VideoPlayer', 'height'),
        loop: () => semiDefault('VideoPlayer', 'loop', false),
        markers: semiGlobalDefault('VideoPlayer', 'markers'),
        muted: () => semiDefault('VideoPlayer', 'muted', false),
        onNext: undefined,
        playbackRateList: () => semiDefault('VideoPlayer', 'playbackRateList', DEFAULT_PLAYBACK_RATE),
        poster: semiGlobalDefault('VideoPlayer', 'poster'),
        qualityList: semiGlobalDefault('VideoPlayer', 'qualityList'),
        routeList: semiGlobalDefault('VideoPlayer', 'routeList'),
        seekTime: () => semiDefault('VideoPlayer', 'seekTime', numbers.DEFAULT_SEEK_TIME),
        src: semiGlobalDefault('VideoPlayer', 'src'),
        theme: () => semiDefault('VideoPlayer', 'theme', strings.DARK),
        volume: () => semiDefault('VideoPlayer', 'volume', numbers.DEFAULT_VOLUME),
        width: semiGlobalDefault('VideoPlayer', 'width'),
    });

    const emit = defineEmits<VideoPlayerEmits>();

    const semi = useSemiGlobal();
    const localeResult = useLocale('VideoPlayer');

    const video = useTemplateRef('video');
    const root = useTemplateRef('root');

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
            getVideo: () => video.value,
            getVideoWrapper: () => root.value,
            notifyPause: () => emit('pause'),
            notifyPlay: () => emit('play'),
            notifyQualityChange: (quality) => emit('qualityChange', quality),
            notifyRateChange: (rate) => emit('rateChange', rate),
            notifyRouteChange: (route) => emit('routeChange', route),
            notifyVolumeChange: (volume) => emit('volumeChange', volume),
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

    const prefix = cssClasses.PREFIX;
    const controlsCls = cssClasses.PREFIX_CONTROLS;
    const menuButtonClass = [`${controlsCls}-menu-item`, `${controlsCls}-menu-button`];
    const onNext = computed(() => props.onNext ?? readSemiDefault(semi, 'VideoPlayer', 'onNext'));
    const locale = computed(() => localeResult.value.locale);

    // Removing src keeps the loaded video; a computed reads its previous value, so this stays a pure derivation
    const videoSrc = computed<string | undefined>((previous) => props.src ?? previous);

    const shows = (name: VideoControl) => props.controlsList.includes(name);

    const onVideoClick = () => {
        if (props.clickToPlay) foundation.handlePlayOrPause();
    };

    const volumeText = (value: number) => `${value}%`;

    useKeepAliveFoundation(foundation);

    defineExpose<VideoPlayerHandle>({
        get video() {
            return video.value;
        },
    });
</script>

<template>
    <div ref="root" :class="[prefix, { [`${prefix}-mirror`]: state.isMirror }]" :role="groupRole($attrs)" :style="{ width: toCssLength(props.width), height: toCssLength(props.height) }" @mouseenter="foundation.handleMouseEnterWrapper" @mouseleave="foundation.handleMouseLeaveWrapper">
        <div :class="[`${prefix}-wrapper`, { [`${prefix}-wrapper-${props.theme}`]: props.theme }]">
            <video
                ref="video"
                :autoplay="props.autoPlay"
                :controls="false"
                :crossorigin="props.crossOrigin"
                :loop="props.loop"
                :src="videoSrc"
                @canplay="foundation.handleCanPlay"
                @click="onVideoClick"
                @durationchange="foundation.handleDurationChange"
                @ended="foundation.handleEnded"
                @error="foundation.handleError"
                @loadstart="foundation.handleLoadStart"
                @pause="foundation.handleVideoPause"
                @play="foundation.handleVideoPlay"
                @progress="foundation.handleProgress"
                @stalled="foundation.handleStalled(locale)"
                @timeupdate="foundation.handleTimeUpdate"
                @waiting="foundation.handleWaiting(locale)"
            >
                <!-- without default the text track stays disabled and, with no caption switch, never shows -->
                <track :default="!!props.captionsSrc" kind="captions" :src="props.captionsSrc" />
            </video>
            <div v-if="props.src == null" :class="`${prefix}-resource-not-found`">{{ locale.noResource }}</div>
        </div>
        <img v-if="!state.isPlaying && props.poster" :alt="locale.poster" :class="[`${prefix}-poster`, { [`${prefix}-poster-hide`]: state.currentTime > 0 && state.currentTime < state.totalTime }]" :src="props.poster" />
        <div v-if="!state.isPlaying && !state.isError" :class="`${prefix}-pause`">
            <IconPlayCircle />
        </div>
        <div v-if="state.isError" :class="[`${prefix}-error`, { [`${prefix}-error-${props.theme}`]: props.theme }]" role="alert">
            <div :class="`${prefix}-error-svg`">
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
            {{ locale.videoError }}
        </div>
        <div role="status">
            <div v-if="state.showNotification && state.notificationContent" :class="`${prefix}-notification`">
                {{ state.notificationContent }}
            </div>
        </div>
        <div :class="[controlsCls, { [`${controlsCls}-hide`]: !state.showControls }]">
            <VideoProgress :bufferedValue="state.bufferedValue" :markers="props.markers" :max="state.totalTime" :step="props.seekTime" :value="state.currentTime" @change="foundation.handleTimeChange" />
            <div :class="`${controlsCls}-menu`">
                <div :class="`${controlsCls}-menu-left`">
                    <Button v-if="shows('play')" :aria-label="state.isPlaying ? locale.pause : locale.play" :class="menuButtonClass" theme="borderless" @click="foundation.handlePlayOrPause">
                        <template #icon>
                            <IconPause v-if="state.isPlaying" />
                            <IconPlay v-else />
                        </template>
                    </Button>
                    <Button v-if="onNext && shows('next')" :aria-label="locale.next" :class="menuButtonClass" theme="borderless" @click="onNext()">
                        <template #icon>
                            <IconRestart :rotate="180" />
                        </template>
                    </Button>
                    <div v-if="shows('time')" :class="`${controlsCls}-time`">{{ formatTime(state.currentTime) }} / {{ formatTime(state.totalTime) }}</div>
                    <Popover v-if="shows('volume')" :ariaLabel="locale.volume" autoAdjustOverflow :class="`${controlsCls}-popover`" position="top" role="dialog">
                        <Button :aria-label="locale.volume" :class="menuButtonClass" theme="borderless" @click="foundation.handleVolumeSilent">
                            <template #icon>
                                <IconMute v-if="state.muted" />
                                <IconVolume1 v-else-if="state.volume < 50" />
                                <IconVolume2 v-else />
                            </template>
                        </Button>
                        <template #content>
                            <div :class="`${controlsCls}-volume`">
                                <div :class="`${controlsCls}-volume-title`">{{ state.muted ? 0 : state.volume }}%</div>
                                <AudioSlider :getValueText="volumeText" :height="120" :label="locale.volume" :max="100" :showTooltip="false" :value="state.muted ? 0 : state.volume" vertical @change="foundation.handleVolumeChange" />
                            </div>
                        </template>
                    </Popover>
                    <ControlsMenu v-if="shows('playbackRate')" :current="state.playbackRate" :label="locale.playbackRate" :list="props.playbackRateList" @select="foundation.handleRateChange($event, locale)" />
                </div>
                <div :class="`${controlsCls}-menu-right`">
                    <ControlsMenu v-if="props.qualityList?.length && shows('quality')" :current="state.currentQuality" :label="locale.quality" :list="props.qualityList" @select="foundation.handleQualityChange($event, locale)" />
                    <ControlsMenu v-if="props.routeList?.length && shows('route')" :current="state.currentRoute" :label="locale.route" :list="props.routeList" @select="foundation.handleRouteChange($event, locale)" />
                    <Button v-if="shows('mirror')" :aria-label="state.isMirror ? locale.cancelMirror : locale.mirror" :class="menuButtonClass" theme="borderless" @click="foundation.handleMirror(locale)">
                        <template #icon>
                            <IconFlipHorizontal />
                        </template>
                    </Button>
                    <Button v-if="shows('fullscreen')" :aria-label="state.isFullScreen ? locale.exitFullscreen : locale.fullscreen" :class="menuButtonClass" theme="borderless" @click="foundation.handleFullscreen">
                        <template #icon>
                            <IconMinimize v-if="state.isFullScreen" />
                            <IconMaximize v-else />
                        </template>
                    </Button>
                    <Button v-if="shows('pictureInPicture')" :aria-label="locale.pictureInPicture" :class="menuButtonClass" theme="borderless" @click="foundation.handlePictureInPicture">
                        <template #icon>
                            <IconMiniPlayer />
                        </template>
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
