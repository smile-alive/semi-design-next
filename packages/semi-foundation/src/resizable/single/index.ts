import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { isSecondaryPress } from '../../utils/pointer';
import { type Size, type NumberSize, type Direction, type NewSize, type ResizeCallback, type ResizeStartCallback, DEFAULT_SIZE, KEYBOARD_STEP } from '../types';
import { getStringSize, getNumberSize, has, calculateNewMax, findNextSnap, snap, clamp } from '../utils';

/** The props the foundation reads */
export interface ResizableBaseProps extends SizeProps {
    grid?: [number, number];
    snap?: { x?: number[]; y?: number[] };
    snapGap?: number;
    boundElement?: 'parent' | 'window' | HTMLElement;
    boundsByDirection?: boolean;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
    lockAspectRatio?: boolean | number;
    lockAspectRatioExtraWidth?: number;
    lockAspectRatioExtraHeight?: number;
    scale?: number;
    ratio?: number | [number, number];
}

export interface ResizableBaseState {
    isResizing: boolean;
    direction: Direction;
    original: { x: number; y: number; width: number; height: number };
    width: number | string;
    height: number | string;
    backgroundStyle: { cursor?: string };
    flexBasis?: string | number;
    ariaRange?: AriaRange;
}

export interface ResizableAdapter<P extends ResizableBaseProps = ResizableBaseProps, S extends ResizableBaseState = ResizableBaseState> extends DefaultAdapter<P, S> {
    getResizable: () => HTMLDivElement | null;
    /** Returns what the callback returned: `false` cancels the resize */
    notifyResizeStart: ResizeStartCallback;
    notifyChange: ResizeCallback;
    notifyResizeEnd: ResizeCallback;
}

type SizeProps = { size?: Size; defaultSize?: Size };
type SizeState = { width?: number | string; height?: number | string; isResizing?: boolean };

export interface AriaRange {
    width: { now: number; min: number; max: number };
    height: { now: number; min: number; max: number };
}

export class ResizableFoundation<P extends ResizableBaseProps = ResizableBaseProps, S extends ResizableBaseState = ResizableBaseState> extends BaseFoundation<ResizableAdapter<P, S>, P, S> {
    #flexDirection?: 'row' | 'column';

    #lockAspectRatio = 1;
    // a key press ends before the host lays out the new size, so the end callback cannot read the DOM
    #changedSize: NumberSize | null = null;
    #resizable: HTMLElement | null = null;

    #parentLeft = 0;
    #parentTop = 0;

    #boundaryLeft = 0;
    #boundaryRight = 0;
    #boundaryTop = 0;
    #boundaryBottom = 0;

    #targetLeft = 0;
    #targetTop = 0;

    get #parent(): HTMLElement | null {
        if (!this.#resizable) {
            return null;
        }
        return this.#resizable.parentNode as HTMLElement;
    }

    get #window(): Window | null {
        if (!this.#resizable) {
            return null;
        }
        if (!this.#resizable.ownerDocument) {
            return null;
        }
        return this.#resizable.ownerDocument.defaultView;
    }

    get #propSize(): Size {
        return ResizableFoundation.getPropSize(this.getProps());
    }

    get #size(): NumberSize {
        let width = 0;
        let height = 0;
        if (this.#resizable && this.#window) {
            width = this.#resizable.offsetWidth;
            height = this.#resizable.offsetHeight;
        }
        return { width, height };
    }

    #getParentSize() {
        const appendPseudo = () => {
            if (!this.#resizable || !this.#window) {
                return null;
            }
            const parent = this.#parent;
            if (!parent) {
                return null;
            }
            const pseudoEle = this.#window.document.createElement('div');
            pseudoEle.style.width = '100%';
            pseudoEle.style.height = '100%';
            pseudoEle.style.position = 'absolute';
            pseudoEle.style.transform = 'scale(0, 0)';
            pseudoEle.style.left = '0';
            pseudoEle.style.flex = '0 0 100%';
            parent.appendChild(pseudoEle);
            return pseudoEle;
        };

        const removePseudo = (pseudo: HTMLElement) => {
            const parent = this.#parent;
            if (!parent) {
                return;
            }
            parent.removeChild(pseudo);
        };
        if (!this.#parent) {
            if (!this.#window) {
                return { width: 0, height: 0 };
            }
            return { width: this.#window.innerWidth, height: this.#window.innerHeight };
        }
        const pseudoElement = appendPseudo();

        if (!pseudoElement) {
            return { width: 0, height: 0 };
        }

        let flexWrapChanged = false;
        const originalFlexWrap = this.#parent.style.flexWrap;

        if (originalFlexWrap !== 'wrap') {
            flexWrapChanged = true;
            this.#parent.style.flexWrap = 'wrap';
        }

        pseudoElement.style.position = 'relative';
        pseudoElement.style.minWidth = '100%';
        pseudoElement.style.minHeight = '100%';

        const size = {
            width: pseudoElement.offsetWidth,
            height: pseudoElement.offsetHeight,
        };

        if (flexWrapChanged) {
            this.#parent.style.flexWrap = originalFlexWrap;
        }

        removePseudo(pseudoElement);
        return size;
    }

    #getCssPropertySize(newSize: number | string, property: 'width' | 'height') {
        const propSizeValue = this.#propSize?.[property];
        const state = this.getStates();

        const isAutoSize = state[property] === 'auto' && state.original[property] === newSize && (typeof propSizeValue === 'undefined' || propSizeValue === 'auto');

        return isAutoSize ? 'auto' : newSize;
    }

    #calBoundaryMax(maxWidth?: number, maxHeight?: number) {
        const { boundsByDirection } = this.getProps();
        const { direction } = this.getStates();

        const isWidthConstrained = boundsByDirection && has('left', direction);
        const isHeightConstrained = boundsByDirection && has('top', direction);

        let maxWidthConstraint: number;
        let maxHeightConstraint: number;

        const props = this.getProps();

        if (props.boundElement === 'parent') {
            const parentElement = this.#parent;
            if (parentElement) {
                maxWidthConstraint = isWidthConstrained ? this.#boundaryRight - this.#parentLeft : parentElement.offsetWidth + (this.#parentLeft - this.#boundaryLeft);

                maxHeightConstraint = isHeightConstrained ? this.#boundaryBottom - this.#parentTop : parentElement.offsetHeight + (this.#parentTop - this.#boundaryTop);
            }
        } else if (props.boundElement === 'window' && this.#window) {
            maxWidthConstraint = isWidthConstrained ? this.#boundaryRight : this.#window.innerWidth - this.#boundaryLeft;
            maxHeightConstraint = isHeightConstrained ? this.#boundaryBottom : this.#window.innerHeight - this.#boundaryTop;
        } else if (typeof props.boundElement === 'object') {
            const boundary = props.boundElement;

            maxWidthConstraint = isWidthConstrained ? this.#boundaryRight - this.#targetLeft : boundary.offsetWidth + (this.#targetLeft - this.#boundaryLeft);
            maxHeightConstraint = isHeightConstrained ? this.#boundaryBottom - this.#targetTop : boundary.offsetHeight + (this.#targetTop - this.#boundaryTop);
        }

        // a bound element outside the box leaves no room (<= 0) and must not replace the max props
        if (maxWidthConstraint > 0 && Number.isFinite(maxWidthConstraint)) {
            maxWidth = maxWidth && maxWidth < maxWidthConstraint ? maxWidth : maxWidthConstraint;
        }
        if (maxHeightConstraint > 0 && Number.isFinite(maxHeightConstraint)) {
            maxHeight = maxHeight && maxHeight < maxHeightConstraint ? maxHeight : maxHeightConstraint;
        }

        return { maxWidth, maxHeight };
    }

    #calDirectionSize(clientX: number, clientY: number) {
        const props = this.getProps();
        const scale = props.scale || 1;
        let aspectRatio = props.ratio;
        const [resizeRatioX, resizeRatioY] = Array.isArray(aspectRatio) ? aspectRatio : [aspectRatio, aspectRatio];

        const { direction, original } = this.getStates();
        const { lockAspectRatio, lockAspectRatioExtraHeight = 0, lockAspectRatioExtraWidth = 0 } = props;

        let newWidth = original.width;
        let newHeight = original.height;

        const calculateNewWidth = (deltaX: number) => original.width + (deltaX * resizeRatioX) / scale;
        const calculateNewHeight = (deltaY: number) => original.height + (deltaY * resizeRatioY) / scale;

        if (has('top', direction)) {
            newHeight = calculateNewHeight(original.y - clientY);
            if (lockAspectRatio) {
                newWidth = (newHeight - lockAspectRatioExtraHeight) * this.#lockAspectRatio + lockAspectRatioExtraWidth;
            }
        }
        if (has('bottom', direction)) {
            newHeight = calculateNewHeight(clientY - original.y);
            if (lockAspectRatio) {
                newWidth = (newHeight - lockAspectRatioExtraHeight) * this.#lockAspectRatio + lockAspectRatioExtraWidth;
            }
        }
        if (has('right', direction)) {
            newWidth = calculateNewWidth(clientX - original.x);
            if (lockAspectRatio) {
                newHeight = (newWidth - lockAspectRatioExtraWidth) / this.#lockAspectRatio + lockAspectRatioExtraHeight;
            }
        }
        if (has('left', direction)) {
            newWidth = calculateNewWidth(original.x - clientX);
            if (lockAspectRatio) {
                newHeight = (newWidth - lockAspectRatioExtraWidth) / this.#lockAspectRatio + lockAspectRatioExtraHeight;
            }
        }

        return { newWidth, newHeight };
    }

    #calAspectRatioSize(newWidth: number, newHeight: number, max: { width?: number; height?: number }, min: { width?: number; height?: number }) {
        const { lockAspectRatio, lockAspectRatioExtraHeight = 0, lockAspectRatioExtraWidth = 0 } = this.getProps();

        const minWidth = typeof min.width === 'undefined' ? 10 : min.width;
        const maxWidth = typeof max.width === 'undefined' || max.width < 0 ? newWidth : max.width;
        const minHeight = typeof min.height === 'undefined' ? 10 : min.height;
        const maxHeight = typeof max.height === 'undefined' || max.height < 0 ? newHeight : max.height;

        if (lockAspectRatio) {
            const adjustedMinWidth = (minHeight - lockAspectRatioExtraHeight) * this.#lockAspectRatio + lockAspectRatioExtraWidth;
            const adjustedMaxWidth = (maxHeight - lockAspectRatioExtraHeight) * this.#lockAspectRatio + lockAspectRatioExtraWidth;
            const adjustedMinHeight = (minWidth - lockAspectRatioExtraWidth) / this.#lockAspectRatio + lockAspectRatioExtraHeight;
            const adjustedMaxHeight = (maxWidth - lockAspectRatioExtraWidth) / this.#lockAspectRatio + lockAspectRatioExtraHeight;

            const lockedMinWidth = Math.max(minWidth, adjustedMinWidth);
            const lockedMaxWidth = Math.min(maxWidth, adjustedMaxWidth);
            const lockedMinHeight = Math.max(minHeight, adjustedMinHeight);
            const lockedMaxHeight = Math.min(maxHeight, adjustedMaxHeight);

            newWidth = clamp(newWidth, lockedMinWidth, lockedMaxWidth);
            newHeight = clamp(newHeight, lockedMinHeight, lockedMaxHeight);
        } else {
            newWidth = clamp(newWidth, minWidth, maxWidth);
            newHeight = clamp(newHeight, minHeight, maxHeight);
        }
        return { newWidth, newHeight };
    }

    #setBoundary() {
        const props = this.getProps();

        if (props.boundElement === 'parent') {
            const parentElement = this.#parent;
            if (parentElement) {
                const parentRect = parentElement.getBoundingClientRect();
                this.#parentLeft = parentRect.left;
                this.#parentTop = parentRect.top;
            }
        }

        if (props.boundElement && typeof props.boundElement !== 'string') {
            const targetRect = props.boundElement.getBoundingClientRect();
            this.#targetLeft = targetRect.left;
            this.#targetTop = targetRect.top;
        }

        if (this.#resizable) {
            const { left, top, right, bottom } = this.#resizable.getBoundingClientRect();
            this.#boundaryLeft = left;
            this.#boundaryRight = right;
            this.#boundaryTop = top;
            this.#boundaryBottom = bottom;
        }
    }

    #getLimits() {
        const props = this.getProps();
        const parentSize = this.#getParentSize();
        const bounds = calculateNewMax(parentSize, this.#window.innerWidth, this.#window.innerHeight, props.maxWidth, props.maxHeight, props.minWidth, props.minHeight);
        const { maxWidth, maxHeight } = this.#calBoundaryMax(bounds.maxWidth, bounds.maxHeight);
        return { parentSize, minWidth: bounds.minWidth, minHeight: bounds.minHeight, maxWidth, maxHeight };
    }

    #changePosition(event: PointerEvent | KeyboardEvent, { clientX, clientY }: { clientX: number; clientY: number } = event as PointerEvent) {
        const states = this.getStates();
        const props = this.getProps();

        if (!states.isResizing || !this.#resizable || !this.#window) {
            return;
        }

        const { direction, width, height } = states;
        const { parentSize, minWidth, minHeight, maxWidth, maxHeight } = this.#getLimits();

        let { newWidth, newHeight }: NewSize = this.#calDirectionSize(clientX, clientY);

        const boundaryMax = { maxWidth, maxHeight };
        newWidth = getNumberSize(newWidth, parentSize.width, this.#window.innerWidth, this.#window.innerHeight);
        newHeight = getNumberSize(newHeight, parentSize.height, this.#window.innerWidth, this.#window.innerHeight);

        if (props.snap) {
            if (props.snap.x) {
                newWidth = findNextSnap(newWidth, props.snap.x, props.snapGap);
            }
            if (props.snap.y) {
                newHeight = findNextSnap(newHeight, props.snap.y, props.snapGap);
            }
        }

        const sizeFromAspectRatio = this.#calAspectRatioSize(newWidth, newHeight, { width: boundaryMax.maxWidth, height: boundaryMax.maxHeight }, { width: minWidth, height: minHeight });
        newWidth = sizeFromAspectRatio.newWidth;
        newHeight = sizeFromAspectRatio.newHeight;

        if (props.grid) {
            const [gridW, gridH] = Array.isArray(props.grid) ? props.grid : [props.grid, props.grid];
            const gap = props.snapGap || 0;
            const newGridWidth = snap(newWidth, gridW);
            const newGridHeight = snap(newHeight, gridH);
            newWidth = gap === 0 || Math.abs(newGridWidth - newWidth) <= gap ? newGridWidth : newWidth;
            newHeight = gap === 0 || Math.abs(newGridHeight - newHeight) <= gap ? newGridHeight : newHeight;
        }

        this.#changedSize = { width: newWidth, height: newHeight };

        const convertToCssUnit = (size: number, originalSize: number, unit: string) => {
            if (unit.endsWith('%')) {
                return `${(size / originalSize) * 100}%`;
            } else if (unit.endsWith('vw')) {
                return `${(size / this.#window.innerWidth) * 100}vw`;
            } else if (unit.endsWith('vh')) {
                return `${(size / this.#window.innerHeight) * 100}vh`;
            }
            return size;
        };

        if (typeof width === 'string') {
            newWidth = convertToCssUnit(newWidth, parentSize.width, width || '');
        }

        if (typeof height === 'string') {
            newHeight = convertToCssUnit(newHeight, parentSize.height, height || '');
        }

        const newState: { width: string | number; height: string | number; flexBasis?: string | number } = {
            width: this.#getCssPropertySize(newWidth, 'width'),
            height: this.#getCssPropertySize(newHeight, 'height'),
        };

        if (this.#flexDirection === 'row') {
            newState.flexBasis = newState.width;
        } else if (this.#flexDirection === 'column') {
            newState.flexBasis = newState.height;
        }

        const widthChanged = states.width !== newState.width;
        const heightChanged = states.height !== newState.height;
        const flexBaseChanged = states.flexBasis !== newState.flexBasis;
        const hasChanges = widthChanged || heightChanged || flexBaseChanged;

        if (hasChanges) {
            this.setState(newState);

            this._adapter.notifyChange({ width: newState.width, height: newState.height }, event, direction);
            this.#restoreControlledSize();
        }
    }

    #restoreControlledSize() {
        const { size } = this.getProps();
        if (!size) {
            return;
        }
        if (size.width !== undefined) {
            this.setState({ width: size.width });
        }
        if (size.height !== undefined) {
            this.setState({ height: size.height });
        }
    }

    #endResize(event: PointerEvent | KeyboardEvent, endSize: NumberSize = this.#size) {
        const { isResizing, direction } = this.getStates();

        if (!isResizing || !this.#resizable) {
            return;
        }

        this._adapter.notifyResizeEnd(endSize, event, direction);

        this.#restoreControlledSize();

        // the observer skipped the frames of the drag, so read the final size once it is on screen
        this.setState(
            {
                isResizing: false,
                backgroundStyle: {
                    ...this.getStates().backgroundStyle,
                    cursor: 'auto',
                },
            },
            () => this.updateAriaRange()
        );
    }

    #beginResize(e: PointerEvent | KeyboardEvent, direction: Direction, { clientX, clientY }: { clientX: number; clientY: number }) {
        this.#resizable = this._adapter.getResizable();
        if (!this.#resizable || !this.#window) {
            return false;
        }

        const props = this.getProps();
        const states = this.getStates();

        if (this._adapter.notifyResizeStart(e, direction) === false) {
            return false;
        }

        const { size } = props;
        if (size) {
            const { height, width } = size;
            const { height: currentHeight, width: currentWidth } = states;

            if (height !== undefined && height !== currentHeight) {
                this.setState({ height });
            }

            if (width !== undefined && width !== currentWidth) {
                this.setState({ width });
            }
        }

        this.#lockAspectRatio = typeof props.lockAspectRatio === 'number' ? props.lockAspectRatio : this.#size.width / this.#size.height;

        let flexBasis: string | undefined;
        const computedStyle = this.#window.getComputedStyle(this.#resizable);
        if (computedStyle.flexBasis !== 'auto') {
            const parent = this.#parent;
            if (parent) {
                const parentStyle = this.#window.getComputedStyle(parent);
                this.#flexDirection = parentStyle.flexDirection.startsWith('row') ? 'row' : 'column';
                flexBasis = computedStyle.flexBasis;
            }
        }

        this.#setBoundary();

        const state = {
            original: {
                x: clientX,
                y: clientY,
                width: this.#size.width,
                height: this.#size.height,
            },
            isResizing: true,
            backgroundStyle: {
                ...states.backgroundStyle,
                cursor: this.#window.getComputedStyle(e.target as HTMLElement).cursor || 'auto',
            },
            direction,
            flexBasis,
        };

        this.setState(state);
        return true;
    }

    static getPropSize({ size, defaultSize }: SizeProps): Size {
        return {
            width: size?.width ?? defaultSize?.width ?? DEFAULT_SIZE.width,
            height: size?.height ?? defaultSize?.height ?? DEFAULT_SIZE.height,
        };
    }

    static getSizeStyle({ size }: SizeProps, state: SizeState) {
        const getSize = (property: 'width' | 'height') => {
            const value = state[property];
            if (typeof value === 'undefined' || value === 'auto') {
                return 'auto';
            }
            return getStringSize(value);
        };
        const width = size && typeof size.width !== 'undefined' && !state.isResizing ? getStringSize(size.width) : getSize('width');
        const height = size && typeof size.height !== 'undefined' && !state.isResizing ? getStringSize(size.height) : getSize('height');
        return { width, height };
    }

    override init() {
        this.updateAriaRange();
    }

    /**
     * Reads the size and limits for aria-valuenow, -valuemin and -valuemax. A change of the limits alone goes
     * unnoticed until the next resize.
     */
    updateAriaRange() {
        // the boundary snapshot is taken when the drag starts; the box growing under the pointer must not move it
        if (this.getStates().isResizing) {
            return;
        }
        this.#resizable = this._adapter.getResizable();
        if (!this.#resizable || !this.#window) {
            return;
        }
        this.#setBoundary();
        const { parentSize, minWidth, minHeight, maxWidth, maxHeight } = this.#getLimits();
        const { width, height } = this.#size;
        // without a max the parent is the best available scale
        const ariaRange = {
            width: { now: width, min: minWidth ?? 10, max: maxWidth ?? Math.max(parentSize.width, width) },
            height: { now: height, min: minHeight ?? 10, max: maxHeight ?? Math.max(parentSize.height, height) },
        };
        if (!isEqual(ariaRange, this.getStates().ariaRange)) {
            this.setState({ ariaRange });
        }
    }

    /**
     * Keyboard resize along the axis of the edge, KEYBOARD_STEP px per press, reported like a drag.
     * Returns whether the key was handled.
     */
    resizeByKey(direction: Direction, e: KeyboardEvent) {
        // Alt/Ctrl/Meta plus an arrow is a browser or OS shortcut
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return false;
        }
        const vertical = direction === 'top' || direction === 'bottom';
        const delta = new Map(
            vertical
                ? [
                      ['ArrowUp', -KEYBOARD_STEP],
                      ['ArrowDown', KEYBOARD_STEP],
                  ]
                : [
                      ['ArrowLeft', -KEYBOARD_STEP],
                      ['ArrowRight', KEYBOARD_STEP],
                  ]
        ).get(e.key);
        if (delta === undefined) {
            return false;
        }
        if (this.#beginResize(e, direction, { clientX: 0, clientY: 0 })) {
            // a pointer displacement becomes size * ratio / scale; undo that factor for a size step
            const { ratio, scale } = this.getProps();
            const [ratioX, ratioY] = Array.isArray(ratio) ? ratio : [ratio, ratio];
            const pointerDelta = (delta * (scale || 1)) / (vertical ? ratioY : ratioX);
            this.#changePosition(e, { clientX: vertical ? 0 : pointerDelta, clientY: vertical ? pointerDelta : 0 });
            this.#endResize(e, this.#changedSize ?? this.#size);
        }
        return true;
    }

    onResizeStart = (e: PointerEvent, direction: Direction) => {
        if (!isSecondaryPress(e)) {
            this.#beginResize(e, direction, e);
        }
    };

    onResizing = (event: PointerEvent) => {
        this.#changePosition(event);
    };

    onResizeEnd = (event: PointerEvent) => {
        this.#endResize(event);
    };
}
