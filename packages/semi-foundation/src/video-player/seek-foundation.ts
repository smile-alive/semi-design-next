import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import { getPointerRatio } from './utils';

/** The fields read from a framework's mouse or pointer event over the track */
export interface SeekPointerEvent {
    button: number;
    clientX: number;
    clientY: number;
}

export interface SeekBaseProps {
    max: number;
    /** The track runs bottom to top */
    vertical?: boolean;
}

export interface SeekBaseState {
    isDragging: boolean;
    /** The position under the pointer, for the preview tooltip */
    movingInfo: { progress: number; offset: number; value: number } | null;
}

export interface SeekAdapter<P extends SeekBaseProps = SeekBaseProps, S extends SeekBaseState = SeekBaseState> extends DefaultAdapter<P, S> {
    getSliderRef: () => HTMLDivElement | null;
    notifyChange: (value: number) => void;
    /** For a track whose control is another element than the pressed one (a hidden native range) */
    focusOnPress?: () => void;
}

/** A track that seeks to the pointer: press and drag, plus a preview of the hovered position */
export default class SeekFoundation<P extends SeekBaseProps = SeekBaseProps, S extends SeekBaseState = SeekBaseState> extends BaseFoundation<SeekAdapter<P, S>, P, S> {
    protected seek(value: number) {
        this.adapter.notifyChange(value);
    }

    static getInitialState(): SeekBaseState {
        return { isDragging: false, movingInfo: null };
    }

    /** The track keeps the pointer from the press on, so the moves and the release reach it even outside it */
    handlePointerDown = (e: SeekPointerEvent & { currentTarget: Element; pointerId: number }) => {
        if (isSecondaryPress(e)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        this.adapter.focusOnPress?.();
        this.setState({ isDragging: true } as Pick<S, 'isDragging'>);
        this.handlePointerPosition(e, { seek: true });
    };

    /** Follows pointerup and pointercancel, and also fires when the track leaves the page mid-drag */
    handleLostPointerCapture = () => {
        this.setState({ isDragging: false } as Pick<S, 'isDragging'>);
    };

    /** Tracks the pointer over the track for the tooltip; `seek` also moves the playhead while dragging or on the press. */
    handlePointerPosition = (e: SeekPointerEvent, { seek }: { seek: boolean }) => {
        const isDragging = this.getState('isDragging');
        const { max, vertical } = this.getProps();
        const sliderRef = this.adapter.getSliderRef();
        if (!sliderRef) return;
        const { total, offset, ratio } = getPointerRatio(sliderRef.getBoundingClientRect(), e, Boolean(vertical));
        const value = ratio * max;

        if (seek && isDragging) {
            this.seek(value);
        }

        // from the track's center to where the handle sits at this ratio, so the preview stays over the dragged handle
        this.setState({ movingInfo: { progress: ratio, offset: offset - total / 2, value } } as Pick<S, 'movingInfo'>);
    };

    /** A keyboard focus shows the playhead's value, not the last hovered one */
    handleFocus = (e: { currentTarget: Element }) => {
        if (e.currentTarget.matches(':focus-visible')) {
            this.clearPreview();
        }
    };

    /** The preview belongs to the pointer; keyboard use shows the value itself */
    clearPreview = () => {
        this.setState({ movingInfo: null } as Pick<S, 'movingInfo'>);
    };
}
