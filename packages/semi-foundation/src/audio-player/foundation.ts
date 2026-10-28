import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { ignoreExpectedMediaErrors } from '../video-player/utils';
import { DEFAULT_RATE } from './constants';

export type AudioInfo = {
    title?: string;
    cover?: string;
    src: string;
};

/** The props the foundation reads with getProp */
export interface AudioPlayerBaseProps {
    audioUrl: string | AudioInfo | (AudioInfo | string)[];
    skipDuration?: number;
}

/** The state the foundation reads and writes */
export interface AudioPlayerBaseState {
    isPlaying: boolean;
    currentIndex: number;
    totalTime: number;
    currentTime: number;
    currentRate: { label: string; value: number };
    volume: number;
    error: boolean;
}

export interface AudioPlayerAdapter<P extends AudioPlayerBaseProps = AudioPlayerBaseProps, S extends AudioPlayerBaseState = AudioPlayerBaseState> extends DefaultAdapter<P, S> {
    getAudioRef: () => HTMLAudioElement | null;
}

export default class AudioPlayerFoundation<P extends AudioPlayerBaseProps = AudioPlayerBaseProps, S extends AudioPlayerBaseState = AudioPlayerBaseState> extends BaseFoundation<AudioPlayerAdapter<P, S>, P, S> {
    #initAudioState() {
        const audioElement = this.#getAudioRef();

        this.setState({
            totalTime: audioElement?.duration || 0,
            error: false,
        });
    }

    #endHandler() {
        if (Array.isArray(this.getProp('audioUrl'))) {
            this.handleTrackChange('next');
        }
    }

    #errorHandler() {
        this.setState({
            error: true,
        });
    }

    #getAudioRef() {
        return this._adapter.getAudioRef();
    }

    #resetAudioState() {
        this.setState({ currentTime: 0, currentRate: DEFAULT_RATE }, () => {
            // after the commit, so a new track's src is on the element before play
            const audio = this.#getAudioRef();
            if (audio) {
                const { currentTime, currentRate } = this.getStates();
                audio.currentTime = currentTime;
                audio.defaultPlaybackRate = audio.playbackRate = currentRate.value;
                void ignoreExpectedMediaErrors(audio.play());
            }
        });
    }

    override init() {
        const audio = this.#getAudioRef();
        audio?.addEventListener('loadedmetadata', () => this.#initAudioState(), { signal: this.signal });
        audio?.addEventListener('error', () => this.#errorHandler(), { signal: this.signal });
        audio?.addEventListener('ended', () => this.#endHandler(), { signal: this.signal });
        // the load algorithm pauses the element without a pause event, so a new src leaves isPlaying stale
        audio?.addEventListener('loadstart', () => this.setState({ isPlaying: !audio.paused }), { signal: this.signal });
        // a server-rendered element loads before hydration mounts the player, and then loadedmetadata never reaches it
        if (audio && audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
            this.#initAudioState();
        }
    }

    // the element also plays/pauses via autoplay, system controls and track changes, so isPlaying follows its events
    handleAudioPlay = () => {
        this.setState({ isPlaying: true });
    };

    handleAudioPause = () => {
        this.setState({ isPlaying: false });
    };

    handleStatusClick() {
        const audio = this.#getAudioRef();
        if (!audio) return;
        if (audio.paused) {
            void ignoreExpectedMediaErrors(audio.play());
        } else {
            audio.pause();
        }
    }

    handleTimeUpdate() {
        const audio = this.#getAudioRef();
        if (!audio) return;
        this.setState({ currentTime: audio.currentTime });
    }

    handleTrackChange(direction: 'next' | 'prev') {
        if (!this.#getAudioRef()) return;
        const audioUrl = this.getProp('audioUrl');
        if (Array.isArray(audioUrl)) {
            if (audioUrl.length === 0) return;
            const step = direction === 'next' ? 1 : -1;
            const current = Math.min(this.getState('currentIndex'), audioUrl.length - 1);
            this.setState({
                currentIndex: (current + step + audioUrl.length) % audioUrl.length,
                error: false,
            });
        }
        this.#resetAudioState();
    }

    handleTimeChange(value: number) {
        const audio = this.#getAudioRef();
        // a live stream's Infinity duration turns a slider ratio into a non-finite value, which currentTime rejects
        if (!audio || !Number.isFinite(audio.duration) || !Number.isFinite(value)) return;
        const time = Math.min(Math.max(value, 0), audio.duration);
        audio.currentTime = time;
        this.setState({ currentTime: time });
    }

    handleSpeedChange(value: { label: string; value: number }) {
        const audio = this.#getAudioRef();
        if (!audio) return;
        // a load resets playbackRate to defaultPlaybackRate, so set both
        audio.defaultPlaybackRate = audio.playbackRate = value.value;
        this.setState({ currentRate: value });
    }

    handleSeek(direction: number) {
        const audio = this.#getAudioRef();
        if (!audio) return;
        // duration is NaN until metadata loads, and currentTime rejects non-finite values
        if (!Number.isFinite(audio.duration)) return;
        const skipDuration = this.getProp('skipDuration');
        audio.currentTime = Math.min(Math.max(audio.currentTime + direction * skipDuration, 0), audio.duration);
    }

    handleRefresh() {
        const audio = this.#getAudioRef();
        if (!audio) return;
        if (this.getState('error')) {
            audio.load();
        } else {
            audio.currentTime = 0;
            this.setState({ currentTime: 0 });
        }
    }

    handleVolumeChange(value: number) {
        const audio = this.#getAudioRef();
        if (!audio) return;
        const volume = Math.floor(value);
        audio.volume = volume / 100;
        this.setState({ volume });
    }

    /** Mutes, or restores half volume when muted */
    handleVolumeSilent() {
        this.handleVolumeChange(this.getState('volume') === 0 ? 50 : 0);
    }
}
