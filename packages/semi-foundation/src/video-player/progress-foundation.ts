import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import { getPointerRatio } from './utils';

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

/** The fields read from a framework's mouse or pointer event over the bar */
export interface ProgressPointerEvent {
    button: number;
    clientX: number;
    clientY: number;
    type: string;
}

/** The fields read from a framework's keyboard event on the bar */
export interface ProgressKeyboardEvent {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    preventDefault: () => void;
}

export interface VideoProgressBaseProps {
    max: number;
    value: number;
    /** Seconds an arrow key moves */
    step: number;
}

export interface VideoProgressBaseState {
    isDragging: boolean;
}

export interface VideoProgressAdapter<P extends VideoProgressBaseProps = VideoProgressBaseProps, S extends VideoProgressBaseState = VideoProgressBaseState> extends DefaultAdapter<P, S> {
    getSliderRef: () => HTMLDivElement | null;
    getMarkersList: () => MarkerListItem[];
    setIsDragging: (isDragging: boolean) => void;
    setActiveIndex: (activeIndex: number) => void;
    setMovingInfo: (movingInfo: { progress: number; offset: number; value: number } | null) => void;
    notifyChange: (value: number) => void;
}

export default class VideoProgressFoundation<P extends VideoProgressBaseProps = VideoProgressBaseProps, S extends VideoProgressBaseState = VideoProgressBaseState> extends BaseFoundation<VideoProgressAdapter<P, S>, P, S> {
    #setActiveIndex(currentValue: number) {
        const markersList = this._adapter.getMarkersList();
        markersList.forEach((marker: MarkerListItem, index: number) => {
            if (VideoProgressFoundation.isInMarker(marker, currentValue)) {
                this._adapter.setActiveIndex(index);
            }
        });
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

    /** The handle's `left`; the 8px is half the handle's width in the stylesheet */
    static getHandleLeft(value: number, max: number) {
        return `calc(${(max ? value / max : 0) * 100}% - 8px)`;
    }

    /** How much of a marker `value` covers, as a CSS width */
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
        this._adapter.setMovingInfo(null);
        this._adapter.notifyChange(clamp(targets[e.key], 0, max));
    };

    /** A keyboard focus shows the playhead's time, not the last hovered one */
    handleFocus = (e: { currentTarget: Element }) => {
        if (e.currentTarget.matches(':focus-visible')) {
            this._adapter.setMovingInfo(null);
        }
    };

    /** The bar keeps the pointer from the press on, so the moves and the release reach it even outside it */
    handlePointerDown = (e: ProgressPointerEvent & { currentTarget: Element; pointerId: number }) => {
        if (isSecondaryPress(e)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        this._adapter.setIsDragging(true);
        this.handlePointerPosition(e, { seek: true });
    };

    /** Follows pointerup and pointercancel, and also fires when the bar leaves the page mid-drag */
    handleLostPointerCapture = () => {
        this._adapter.setIsDragging(false);
    };

    /** Tracks the pointer over the bar for the tooltip; `seek` also moves the playhead while dragging or on the press. */
    handlePointerPosition(e: ProgressPointerEvent, { seek }: { seek: boolean }) {
        const { isDragging } = this.getStates();
        const { max } = this.getProps();
        const sliderRef = this._adapter.getSliderRef();
        if (!sliderRef) return;
        const rect = sliderRef.getBoundingClientRect();
        const { offset, ratio: percentage } = getPointerRatio(rect, e, false);
        const value = percentage * max;

        // the press itself seeks: the dragging state it sets is not read back until the next render
        if (seek && (isDragging || e.type === 'pointerdown')) {
            this.#setActiveIndex(value);
            this._adapter.notifyChange(value);
        }

        this._adapter.setMovingInfo({
            progress: percentage,
            offset: offset - rect.width / 2,
            value,
        });
    }
}
