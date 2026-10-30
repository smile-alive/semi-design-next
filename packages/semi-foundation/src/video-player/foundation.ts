import { clamp, throttle } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import FocusTrapHandle from '../utils/focus-handle';
import { ignoreExpectedMediaErrors } from './utils';

export interface VideoPlayerBaseProps {
    muted?: boolean;
    seekTime?: number;
    volume?: number;
}

export interface VideoPlayerBaseState {
    currentQuality: string;
    currentRoute: string;
    currentTime: number;
    isFullScreen: boolean;
    isMirror: boolean;
    isPlaying: boolean;
    muted: boolean;
    playbackRate: number;
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

export interface VideoPlayerAdapter<P extends VideoPlayerBaseProps = VideoPlayerBaseProps, S extends VideoPlayerBaseState = VideoPlayerBaseState> extends DefaultAdapter<P, S> {
    getVideo: () => HTMLVideoElement | null;
    getVideoWrapper: () => HTMLDivElement | null;
    notifyPause: () => void;
    notifyPlay: () => void;
    notifyQualityChange: (quality: string) => void;
    notifyRateChange: (rate: number) => void;
    notifyRouteChange: (route: string) => void;
    notifyVolumeChange: (volume: number) => void;
    setBufferedValue: (bufferedValue: number) => void;
    setCurrentTime: (currentTime: number) => void;
    setIsError: (isError: boolean) => void;
    setIsFullScreen: (isFullScreen: boolean) => void;
    setIsMirror: (isMirror: boolean) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setMuted: (muted: boolean) => void;
    setNotificationContent: (content: string) => void;
    setPlaybackRate: (rate: number) => void;
    setQuality: (quality: string) => void;
    setRoute: (route: string) => void;
    setShowControls: (showControls: boolean) => void;
    setShowNotification: (showNotification: boolean) => void;
    setTotalTime: (totalTime: number) => void;
    setVolume: (volume: number) => void;
}

export default class VideoPlayerFoundation<P extends VideoPlayerBaseProps = VideoPlayerBaseProps, S extends VideoPlayerBaseState = VideoPlayerBaseState> extends BaseFoundation<VideoPlayerAdapter<P, S>, P, S> {
    #controlsTimer: ReturnType<typeof setTimeout> | undefined;
    #notificationTimer: ReturnType<typeof setTimeout> | undefined;
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
        this.adapter.setShowControls(true);
        this.#clearTimer();
        this.#controlsTimer = setTimeout(() => {
            // a paused or ended player keeps its controls, as on mouseleave
            if (this.getStates().isPlaying) {
                this.adapter.setShowControls(false);
            }
        }, 3000);
    }, 200);

    // the muted flag keeps the volume and lets a muted autoplay start under the browser's autoplay policy
    #applyMuted(video: HTMLVideoElement, muted: boolean) {
        video.muted = muted;
        this.adapter.setMuted(muted);
    }

    #handleLeavePictureInPicture = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        this.adapter.setIsPlaying(!video.paused);
    };

    #handleTemporaryNotification(content: string) {
        this.#stalled = false;
        this.adapter.setNotificationContent(content);
        this.adapter.setShowNotification(true);
        clearTimeout(this.#notificationTimer);
        this.#notificationTimer = setTimeout(() => {
            this.adapter.setShowNotification(false);
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
        if (isFullScreen === this.getStates().isFullScreen) {
            return;
        }
        this.adapter.setIsFullScreen(isFullScreen);
        if (isFullScreen) {
            document.addEventListener('mousemove', this.#handleMouseMove, { signal: this.signal });
        } else {
            // fullscreen can end via Esc or the button, so restore here for both
            if (this.#scrollPosition) {
                setTimeout(() => {
                    window.scrollTo(this.#scrollPosition.x, this.#scrollPosition.y);
                    this.#scrollPosition = null;
                }, 0);
            }
            document.removeEventListener('mousemove', this.#handleMouseMove);
            // a pending call or hide timer would hide the windowed player's controls; no mouseenter follows
            this.#handleMouseMove.cancel();
            this.#clearTimer();
            this.adapter.setShowControls(true);
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

        const { currentTime } = this.getStates();
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

    override init() {
        const { volume, muted } = this.getProps();
        const { playbackRate } = this.getStates();
        const video = this.adapter.getVideo();
        if (video) {
            // the duration is NaN until the metadata loads
            this.adapter.setTotalTime(video.duration || 0);
            const initialVolume = Math.floor(volume > 0 ? volume : 0);
            video.volume = initialVolume / 100;
            this.adapter.setVolume(initialVolume);
            this.#applyMuted(video, muted || initialVolume === 0);
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
            this.adapter.setCurrentTime(time);
        }
    };

    handleTimeUpdate = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        this.adapter.setCurrentTime(video.currentTime);
    };

    handleDurationChange = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        this.adapter.setTotalTime(video.duration || 0);
    };

    handleError = () => {
        this.adapter.setIsError(true);
    };

    handleLoadStart = () => {
        this.adapter.setIsError(false);
        const video = this.adapter.getVideo();
        if (!video) return;
        // the load algorithm pauses the element without a pause event, so a new src leaves isPlaying stale
        this.adapter.setIsPlaying(!video.paused);
        this.adapter.setBufferedValue(0);
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
        this.adapter.setIsPlaying(true);
        this.adapter.notifyPlay();
        // fullscreen hides the controls only by the idle timer, which a pause leaves unarmed
        if (this.getStates().isFullScreen) {
            this.#handleMouseMove();
        }
    };

    handleVideoPause = () => {
        this.adapter.setIsPlaying(false);
        this.adapter.notifyPause();
        // a paused player keeps its controls, even when the idle timer hid them earlier
        if (this.getStates().isFullScreen) {
            this.adapter.setShowControls(true);
        }
    };

    handleCanPlay = () => {
        this.#stalled = false;
        this.adapter.setShowNotification(false);
    };

    handleWaiting = (locale: VideoPlayerNotificationLocale) => {
        this.#stalled = false;
        this.adapter.setNotificationContent(locale.loading);
        this.adapter.setShowNotification(true);
    };

    handleStalled = (locale: VideoPlayerNotificationLocale) => {
        this.#stalled = true;
        this.adapter.setNotificationContent(locale.stall);
        this.adapter.setShowNotification(true);
    };

    handleProgress = () => {
        if (this.#stalled) {
            this.#stalled = false;
            this.adapter.setShowNotification(false);
        }
        const video = this.adapter.getVideo();
        if (video && video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            this.adapter.setBufferedValue(bufferedEnd);
        }
    };

    handleEnded = () => {
        this.adapter.setIsPlaying(false);
        this.adapter.setShowControls(true);
    };

    /** From the user (the slider); init applies the initial volume without notifying */
    handleVolumeChange = (value: number) => {
        const video = this.adapter.getVideo();
        if (!video) return;
        const { volume, muted } = this.getStates();
        const next = Math.floor(value > 0 ? value : 0);
        video.volume = next / 100;
        this.adapter.setVolume(next);
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
            this.adapter.setVolume(restored);
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
        this.adapter.setPlaybackRate(rate.value);
        this.adapter.notifyRateChange(rate.value);
        // function replacers keep `$&` and `$$` in the option labels literal
        this.#handleTemporaryNotification(locale.rateChange.replace('${rate}', () => rate.label));
    };

    handleQualityChange = (quality: { label: string; value: string }, locale: VideoPlayerNotificationLocale) => {
        const changed = quality.value !== this.getStates().currentQuality;
        this.adapter.setQuality(quality.value);
        this.adapter.notifyQualityChange(quality.value);
        this.#handleTemporaryNotification(locale.qualityChange.replace('${quality}', () => quality.label));
        // choosing the current item loads nothing, so a listener would wait for an unrelated load
        if (changed) {
            this.#restorePlayPosition();
        }
    };

    handleRouteChange = (route: { label: string; value: string }, locale: VideoPlayerNotificationLocale) => {
        const changed = route.value !== this.getStates().currentRoute;
        this.adapter.setRoute(route.value);
        this.adapter.notifyRouteChange(route.value);
        this.#handleTemporaryNotification(locale.routeChange.replace('${route}', () => route.label));
        if (changed) {
            this.#restorePlayPosition();
        }
    };

    handleMirror = (locale: VideoPlayerNotificationLocale) => {
        const { isMirror } = this.getStates();
        this.adapter.setIsMirror(!isMirror);
        this.#handleTemporaryNotification(!isMirror ? locale.mirror : locale.cancelMirror);
    };

    handlePictureInPicture = () => {
        const video = this.adapter.getVideo();
        if (!video) return;
        void ignoreExpectedMediaErrors(video.requestPictureInPicture());
    };

    handleMouseEnterWrapper = () => {
        this.adapter.setShowControls(true);
    };

    handleMouseLeaveWrapper = () => {
        const { isPlaying } = this.getStates();
        if (isPlaying) {
            this.adapter.setShowControls(false);
        }
    };
}
