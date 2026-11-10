import { clamp, throttle } from 'es-toolkit';
import { FocusTrapHandle, BaseFoundation, type DefaultAdapter } from '../../base/index';
import { formatLocale } from '../../locale/index';
import { ignoreExpectedMediaErrors } from './utils';

export interface VideoPlayerBaseProps {
    defaultPlaybackRate?: number;
    defaultQuality?: string;
    defaultRoute?: string;
    muted?: boolean;
    seekTime?: number;
    volume?: number;
}

export interface VideoPlayerState {
    bufferedValue: number;
    currentQuality: string;
    currentRoute: string;
    currentTime: number;
    isError: boolean;
    isFullScreen: boolean;
    isMirror: boolean;
    isPlaying: boolean;
    muted: boolean;
    notificationContent: string;
    playbackRate: number;
    showControls: boolean;
    showNotification: boolean;
    totalTime: number;
    volume: number;
}

/** The locale entries the foundation shows as notifications; `${rate}`, `${quality}` and `${route}` are placeholders */
export interface VideoPlayerNotificationLocale {
    rateChange: string;
    qualityChange: string;
    routeChange: string;
    mirror: string;
    cancelMirror: string;
    loading: string;
    stall: string;
}

export interface VideoPlayerAdapter<P extends VideoPlayerBaseProps = VideoPlayerBaseProps> extends DefaultAdapter<P, VideoPlayerState> {
    getVideo: () => HTMLVideoElement | null;
    getVideoWrapper: () => HTMLDivElement | null;
    notifyPause: () => void;
    notifyPlay: () => void;
    notifyQualityChange: (quality: string) => void;
    notifyRateChange: (rate: number) => void;
    notifyRouteChange: (route: string) => void;
    notifyVolumeChange: (volume: number) => void;
}

export default class VideoPlayerFoundation<P extends VideoPlayerBaseProps = VideoPlayerBaseProps> extends BaseFoundation<VideoPlayerAdapter<P>, P, VideoPlayerState> {
    #controlsTimer: ReturnType<typeof setTimeout> | undefined;
    #notificationTimer: ReturnType<typeof setTimeout> | undefined;
    #scrollRestoreTimer: ReturnType<typeof setTimeout> | undefined;
    #scrollPosition: { x: number; y: number } | null = null;
    // set by a stalled event: no canplay follows when the buffer was already full, so progress ends it too
    #stalled = false;
    #restoreController: AbortController | undefined;

    #clearTimer() {
        if (this.#controlsTimer) {
            clearTimeout(this.#controlsTimer);
        }
    }

    #handleMouseMove = throttle(() => {
        this.setState({ showControls: true });
        this.#clearTimer();
        this.#controlsTimer = setTimeout(() => {
            // a paused or ended player keeps its controls, as on mouseleave
            if (this.getState('isPlaying')) {
                this.setState({ showControls: false });
            }
        }, 3000);
    }, 200);

    // the muted flag keeps the volume and lets a muted autoplay start under the browser's autoplay policy
    #applyMuted(video: HTMLVideoElement, muted: boolean) {
        video.muted = muted;
        this.setState({ muted });
    }

    #handleLeavePictureInPicture = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        this.setState({ isPlaying: !video.paused });
    };

    #handleTemporaryNotification(content: string) {
        this.#stalled = false;
        this.setState({ notificationContent: content, showNotification: true });
        clearTimeout(this.#notificationTimer);
        this.#notificationTimer = setTimeout(() => {
            this.setState({ showNotification: false });
        }, 1000);
    }

    // Known limit: a switch whose callback does not change src leaves this listener waiting for the next load, which
    // the foundation cannot tell from an unrelated one. Upgrade: have the adapter report src changes.
    #restorePlayPosition() {
        const video = this.adapter.getVideo();
        if (!video) return;
        const wasPlaying = !video.paused;
        const currentTime = video.currentTime;

        const handleLoaded = () => {
            video.currentTime = currentTime;
            if (wasPlaying) {
                void ignoreExpectedMediaErrors(video.play());
            }
        };
        // two switches before a load would otherwise both restore, the older one overriding a pause in between
        this.#restoreController?.abort();
        this.#restoreController = new AbortController();
        video.addEventListener('loadeddata', handleLoaded, { once: true, signal: AbortSignal.any([this.signal, this.#restoreController.signal]) });
    }

    #handleFullscreenChange = () => {
        const isFullScreen = this.checkFullScreen();
        // another element entering or leaving fullscreen fires this too
        if (isFullScreen === this.getState('isFullScreen')) {
            return;
        }
        this.setState({ isFullScreen });
        if (isFullScreen) {
            document.addEventListener('mousemove', this.#handleMouseMove, { signal: this.signal });
        } else {
            // fullscreen can end via Esc or the button, so restore here for both
            if (this.#scrollPosition) {
                this.#scrollRestoreTimer = setTimeout(() => {
                    window.scrollTo(this.#scrollPosition.x, this.#scrollPosition.y);
                    this.#scrollPosition = null;
                }, 0);
            }
            document.removeEventListener('mousemove', this.#handleMouseMove);
            // a pending call or hide timer would hide the windowed player's controls; no mouseenter follows
            this.#handleMouseMove.cancel();
            this.#clearTimer();
            this.setState({ showControls: true });
        }
    };

    #handleBodyKeyDown = (e: KeyboardEvent) => {
        // a modified key is a browser or system shortcut (Alt+Left is history back)
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        const target = e.target instanceof Element ? e.target : null;
        // controls that use the key themselves keep it; handling it here too would act twice
        // buttons take no arrows and the slider no Space, so shortcuts serve them; the menu sits inside in fullscreen
        const ownsKey = e.key === ' ' ? 'button, input, select, textarea' : 'input, select, textarea, [role="slider"], [role="menu"]';
        if (e.defaultPrevented || target?.closest(ownsKey)) {
            return;
        }

        const videoWrapper = this.adapter.getVideoWrapper();

        if (videoWrapper && !videoWrapper.contains(FocusTrapHandle.getActiveElement(videoWrapper))) {
            return;
        }

        const currentTime = this.getState('currentTime');
        const { seekTime } = this.getProps();
        if (![' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            return;
        }
        e.preventDefault();
        if (e.key === ' ') {
            this.handlePlayOrPause();
        } else if (e.key === 'ArrowLeft') {
            this.handleTimeChange(currentTime - seekTime);
        } else if (e.key === 'ArrowRight') {
            this.handleTimeChange(currentTime + seekTime);
        }
    };

    #registerEvent() {
        const video = this.adapter.getVideo();
        if (!video) return;
        document.addEventListener('keydown', this.#handleBodyKeyDown, { signal: this.signal });
        document.addEventListener('fullscreenchange', this.#handleFullscreenChange, { signal: this.signal });
        video.addEventListener('leavepictureinpicture', this.#handleLeavePictureInPicture, { signal: this.signal });
    }

    protected checkFullScreen() {
        const videoWrapper = this.adapter.getVideoWrapper();
        return !!videoWrapper && document.fullscreenElement === videoWrapper;
    }

    static getInitialState({ defaultPlaybackRate, defaultQuality, defaultRoute, muted, volume }: VideoPlayerBaseProps): VideoPlayerState {
        const initialVolume = Math.floor(volume > 0 ? volume : 0);
        return {
            bufferedValue: 0,
            currentQuality: defaultQuality || '',
            currentRoute: defaultRoute || '',
            currentTime: 0,
            isError: false,
            isFullScreen: false,
            isMirror: false,
            isPlaying: false,
            muted: Boolean(muted) || initialVolume === 0,
            notificationContent: '',
            playbackRate: defaultPlaybackRate || 1,
            showControls: true,
            showNotification: false,
            totalTime: 0,
            volume: initialVolume,
        };
    }

    override init() {
        const { playbackRate, volume, muted } = this.getStates();
        const video = this.adapter.getVideo();
        if (video) {
            // the duration is NaN until the metadata loads; a server-rendered element may also have failed or autoplayed before
            // hydration attached the listeners
            this.setState({ totalTime: video.duration || 0, isError: video.error != null, isPlaying: !video.paused });
            video.volume = volume / 100;
            video.muted = muted;
            // the media load algorithm resets playbackRate to defaultPlaybackRate
            video.defaultPlaybackRate = video.playbackRate = playbackRate;
            // WebKit lets the system caption preference keep a `default` track disabled, and the player has no caption switch
            const captions = video.querySelector<HTMLTrackElement>('track[default]');
            if (captions) {
                captions.track.mode = 'showing';
            }
        }
        this.#registerEvent();
        // init reruns after Activity hiding or KeepAlive deactivation, and fullscreen may have ended while no listener ran
        this.#handleFullscreenChange();
    }

    override destroy() {
        this.#handleMouseMove.cancel();
        this.#clearTimer();
        clearTimeout(this.#notificationTimer);
        clearTimeout(this.#scrollRestoreTimer);
    }

    handleTimeChange = (value: number) => {
        const video = this.adapter.getVideo();
        if (!video) return;
        // currentTime throws on a non-finite value, such as a ratio of a live stream's Infinity duration
        if (Number.isFinite(value)) {
            // the element's own clamp surfaces only via timeupdate, which never fires before metadata loads (NaN
            // duration; Infinity for live)
            const time = Number.isFinite(video.duration) ? clamp(value, 0, video.duration) : Math.max(value, 0);
            video.currentTime = time;
            this.setState({ currentTime: time });
        }
    };

    handleTimeUpdate = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        this.setState({ currentTime: video.currentTime });
    };

    handleDurationChange = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        this.setState({ totalTime: video.duration || 0 });
    };

    handleError = () => {
        this.setState({ isError: true });
    };

    handleLoadStart = () => {
        this.setState({ isError: false });
        const video = this.adapter.getVideo();
        if (!video) return;
        // the load algorithm pauses the element without a pause event, so a new src leaves isPlaying stale
        this.setState({ isPlaying: !video.paused, bufferedValue: 0 });
    };

    handlePlayOrPause = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        if (video.paused) {
            this.handlePlay();
        } else {
            this.handlePause();
        }
    };

    handlePlay() {
        const video = this.adapter.getVideo();
        if (video) {
            void ignoreExpectedMediaErrors(video.play());
        }
    }

    handlePause() {
        const video = this.adapter.getVideo();
        if (video) {
            video.pause();
        }
    }

    handleVideoPlay = () => {
        this.setState({ isPlaying: true });
        this.adapter.notifyPlay();
        // fullscreen hides the controls only by the idle timer, which a pause leaves unarmed
        if (this.getState('isFullScreen')) {
            this.#handleMouseMove();
        }
    };

    handleVideoPause = () => {
        this.setState({ isPlaying: false });
        this.adapter.notifyPause();
        // a paused player keeps its controls, even when the idle timer hid them earlier
        if (this.getState('isFullScreen')) {
            this.setState({ showControls: true });
        }
    };

    handleCanPlay = () => {
        this.#stalled = false;
        this.setState({ showNotification: false });
    };

    handleWaiting = (locale: VideoPlayerNotificationLocale) => {
        this.#stalled = false;
        this.setState({ notificationContent: locale.loading, showNotification: true });
    };

    handleStalled = (locale: VideoPlayerNotificationLocale) => {
        this.#stalled = true;
        this.setState({ notificationContent: locale.stall, showNotification: true });
    };

    handleProgress = () => {
        if (this.#stalled) {
            this.#stalled = false;
            this.setState({ showNotification: false });
        }
        const video = this.adapter.getVideo();
        if (video && video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            this.setState({ bufferedValue: bufferedEnd });
        }
    };

    handleEnded = () => {
        this.setState({ isPlaying: false, showControls: true });
    };

    /** From the user (the slider); `getInitialState` applies the initial volume without notifying */
    handleVolumeChange = (value: number) => {
        const video = this.adapter.getVideo();
        if (!video) return;
        const { volume, muted } = this.getStates();
        const next = Math.floor(value > 0 ? value : 0);
        video.volume = next / 100;
        this.setState({ volume: next });
        this.#applyMuted(video, next === 0);
        // a drag reports every pixel
        if (next !== (muted ? 0 : volume)) {
            this.adapter.notifyVolumeChange(next);
        }
    };

    /** Mutes, or unmutes to the volume before muting; to half volume when that was 0 */
    handleVolumeSilent = () => {
        const video = this.adapter.getVideo();
        const { volume, muted } = this.getStates();
        if (!video) return;
        if (muted) {
            const restored = volume > 0 ? volume : 50;
            video.volume = restored / 100;
            this.setState({ volume: restored });
            this.#applyMuted(video, false);
            this.adapter.notifyVolumeChange(restored);
        } else {
            this.#applyMuted(video, true);
            this.adapter.notifyVolumeChange(0);
        }
    };

    handleFullscreen = () => {
        const videoWrapper = this.adapter.getVideoWrapper();
        const isFullScreen = this.checkFullScreen();
        if (videoWrapper) {
            if (isFullScreen) {
                void ignoreExpectedMediaErrors(document.exitFullscreen());
            } else {
                this.#scrollPosition = {
                    x: window.scrollX,
                    y: window.scrollY,
                };
                void ignoreExpectedMediaErrors(videoWrapper.requestFullscreen());
            }
        }
    };

    handleRateChange = (rate: { label: string; value: number }, locale: VideoPlayerNotificationLocale) => {
        const video = this.adapter.getVideo();
        if (!video) return;
        video.defaultPlaybackRate = video.playbackRate = rate.value;
        this.setState({ playbackRate: rate.value });
        this.adapter.notifyRateChange(rate.value);
        this.#handleTemporaryNotification(formatLocale(locale.rateChange, { rate: rate.label }));
    };

    handleQualityChange = (quality: { label: string; value: string }, locale: VideoPlayerNotificationLocale) => {
        const changed = quality.value !== this.getState('currentQuality');
        this.setState({ currentQuality: quality.value });
        this.adapter.notifyQualityChange(quality.value);
        this.#handleTemporaryNotification(formatLocale(locale.qualityChange, { quality: quality.label }));
        // choosing the current item loads nothing, so a listener would wait for an unrelated load
        if (changed) {
            this.#restorePlayPosition();
        }
    };

    handleRouteChange = (route: { label: string; value: string }, locale: VideoPlayerNotificationLocale) => {
        const changed = route.value !== this.getState('currentRoute');
        this.setState({ currentRoute: route.value });
        this.adapter.notifyRouteChange(route.value);
        this.#handleTemporaryNotification(formatLocale(locale.routeChange, { route: route.label }));
        if (changed) {
            this.#restorePlayPosition();
        }
    };

    handleMirror = (locale: VideoPlayerNotificationLocale) => {
        const isMirror = !this.getState('isMirror');
        this.setState({ isMirror });
        this.#handleTemporaryNotification(isMirror ? locale.mirror : locale.cancelMirror);
    };

    handlePictureInPicture = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        void ignoreExpectedMediaErrors(video.requestPictureInPicture());
    };

    handleMouseEnterWrapper = () => {
        this.setState({ showControls: true });
    };

    handleMouseLeaveWrapper = () => {
        if (this.getState('isPlaying')) {
            this.setState({ showControls: false });
        }
    };
}
