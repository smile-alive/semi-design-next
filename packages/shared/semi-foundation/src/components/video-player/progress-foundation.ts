import { clamp } from 'es-toolkit';
import SeekFoundation, { type SeekAdapter, type SeekBaseProps, type SeekBaseState } from './seek-foundation';

export interface MarkerListItem {
    start: number;
    end: number;
    title: string;
    width: string;
    left: string;
}

export interface Marker {
    start: number;
    title: string;
}

/** The fields read from a framework's keyboard event on the bar */
export interface ProgressKeyboardEvent {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    preventDefault: () => void;
}

export interface VideoProgressBaseProps extends SeekBaseProps {
    value: number;
    /** Seconds an arrow key moves */
    step: number;
    markers?: Marker[];
}

export interface VideoProgressBaseState extends SeekBaseState {
    activeIndex: number;
}

export type VideoProgressAdapter<P extends VideoProgressBaseProps = VideoProgressBaseProps> = SeekAdapter<P, VideoProgressBaseState>;

export default class VideoProgressFoundation<P extends VideoProgressBaseProps = VideoProgressBaseProps> extends SeekFoundation<P, VideoProgressBaseState> {
    #setActiveIndex(currentValue: number) {
        const { markers, max } = this.getProps();
        VideoProgressFoundation.getMarkersList(markers, max).forEach((marker, index) => {
            if (VideoProgressFoundation.isInMarker(marker, currentValue)) {
                this.setState({ activeIndex: index });
            }
        });
    }

    protected override seek(value: number) {
        this.#setActiveIndex(value);
        super.seek(value);
    }

    static override getInitialState(): VideoProgressBaseState {
        return { ...SeekFoundation.getInitialState(), activeIndex: -1 };
    }

    /**
     * Lays the markers out over `max` in start order, cutting those that run past it and dropping those outside it. A
     * first marker after 0 gets an untitled lead-in so the bar has a track from the beginning.
     */
    static getMarkersList(markers: Marker[] | undefined, max: number): MarkerListItem[] {
        if (!markers?.length) {
            return [{ start: 0, end: max, left: '0', title: '', width: '100%' }];
        }
        const sorted = markers.toSorted((a, b) => a.start - b.start);
        const list = sorted.flatMap((marker, index) => {
            const end = Math.min(index === sorted.length - 1 ? max : sorted[index + 1].start, max);
            if (marker.start >= max) {
                return [];
            }
            return [
                {
                    left: `${(marker.start / max) * 100}%`,
                    width: `${max ? ((end - marker.start) / max) * 100 : 100}%`,
                    end,
                    start: marker.start,
                    title: marker.title,
                },
            ];
        });
        if (list.length > 0 && list[0].start > 0) {
            list.unshift({ left: '0', width: `${(list[0].start / max) * 100}%`, end: list[0].start, start: 0, title: '' });
        }
        return list;
    }

    /** Markers abut, so an open interval keeps a value on a boundary out of both neighbours */
    static isInMarker({ start, end }: MarkerListItem, value: number) {
        return value > start && value < end;
    }

    static getMarkerTitle(list: MarkerListItem[], value: number): string | undefined {
        return list.find((marker) => VideoProgressFoundation.isInMarker(marker, value))?.title;
    }

    /** The handle's `left`; the stylesheet centers the handle on it with translate */
    static getHandleLeft(value: number, max: number) {
        return `${(max ? value / max : 0) * 100}%`;
    }

    static getValueWidth({ start, end }: MarkerListItem, value: number) {
        // the default item spans [0, 0] until the duration is known
        if (end <= start) {
            return '0%';
        }
        if (value > end) {
            return 'calc(100% - 2px)';
        } else if (value < start) {
            return '0%';
        } else {
            return `${((value - start) / (end - start)) * 100}%`;
        }
    }

    /** The APG slider keys: arrows move by `step`, PageUp and PageDown by a tenth of `max`, Home and End to the ends */
    handleKeyDown = (e: ProgressKeyboardEvent) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const { max, value, step } = this.getProps();
        const targets: Record<string, number> = {
            ArrowRight: value + step,
            ArrowUp: value + step,
            ArrowLeft: value - step,
            ArrowDown: value - step,
            PageUp: value + max / 10,
            PageDown: value - max / 10,
            Home: 0,
            End: max,
        };
        if (!Object.hasOwn(targets, e.key)) return;
        e.preventDefault();
        // the preview belongs to the pointer; the keys move the playhead it no longer follows
        this.clearPreview();
        this.adapter.notifyChange(clamp(targets[e.key], 0, max));
    };
}
