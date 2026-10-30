import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import { type CornerDir, KEYBOARD_STEP, MIN_BOX_SIZE } from './constants';
import { fitAspect, getCropperGeometry } from './utils';

/** The props the foundation and the adapter read */
export interface CropperFoundationProps {
    src?: string;
    aspectRatio?: number;
    defaultAspectRatio?: number;
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    rotate?: number;
    showResizeBox?: boolean;
    fill?: string;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    preview?: () => HTMLElement | null;
}

export interface CropperAdapter<P extends CropperFoundationProps = CropperFoundationProps, S extends CropperState = CropperState> extends DefaultAdapter<P, S> {
    getContainer: () => HTMLElement;
    notifyZoomChange: (zoom: number) => void;
    getImg: () => HTMLImageElement;
}

interface Point {
    x: number;
    y: number;
}

export interface ImageData {
    originalWidth: number;
    originalHeight: number;
    scale: number;
}

export interface ImageDataState {
    width: number;
    height: number;
    centerPoint: Point;
}

export interface CropperBox {
    width: number;
    height: number;
    centerPoint: Point;
}

export interface ContainerData {
    width: number;
    height: number;
}

export interface CropperState {
    imgData: ImageDataState;
    cropperBox: CropperBox;
    zoom: number;
    rotate: number;
    loaded: boolean;
}

export default class CropperFoundation extends BaseFoundation<CropperAdapter<CropperFoundationProps>, CropperFoundationProps, CropperState> {
    #imgData = {} as ImageData;
    #containerData = {} as ContainerData;
    #resizeDir: CornerDir | '' = '';
    #cropperBoxMoveStart: Point = null;
    #imgMoveStart: Point = null;
    #moveRange: {
        xMax: number;
        xMin: number;
        yMax: number;
        yMin: number;
    };
    #resizeVector = {
        paramX: 0,
        paramY: 0,
    };
    #rangeX: [number, number] = null;
    #rangeY: [number, number] = null;
    #previewImg: HTMLImageElement = null;
    #previewContainer: HTMLElement = null;
    #previewContainerInitSize: {
        width: number;
        height: number;
    };
    // restored by destroy after the preview overwrites them
    #previewOriginalStyle: { overflow: string; width: string; height: string };

    #getImgDataWhenResize(ratio: number) {
        const { imgData } = this.getStates();
        const newImgData = {
            width: imgData.width * ratio,
            height: imgData.height * ratio,
            centerPoint: {
                x: imgData.centerPoint.x * ratio,
                y: imgData.centerPoint.y * ratio,
            },
        };
        this.#imgData.scale *= ratio;
        return newImgData;
    }

    #getCropperBoxWhenResize(ratio: number, newContainerData: ContainerData) {
        const { cropperBox } = this.getStates();
        const { aspectRatio } = this.getProps();
        const tempCropperBox = {
            width: cropperBox.width * ratio,
            height: cropperBox.height * ratio,
            centerPoint: {
                x: cropperBox.centerPoint.x * ratio,
                y: cropperBox.centerPoint.y * ratio,
            },
        };
        let xMin = tempCropperBox.centerPoint.x - tempCropperBox.width / 2;
        let xMax = tempCropperBox.centerPoint.x + tempCropperBox.width / 2;
        let yMin = tempCropperBox.centerPoint.y - tempCropperBox.height / 2;
        let yMax = tempCropperBox.centerPoint.y + tempCropperBox.height / 2;
        if (aspectRatio) {
            if (xMax > newContainerData.width) {
                xMax = newContainerData.width;
                xMin = tempCropperBox.width > newContainerData.width ? 0 : newContainerData.width - tempCropperBox.width;
                tempCropperBox.width = xMax - xMin;
                tempCropperBox.height = tempCropperBox.width / aspectRatio;
                yMax = yMin + tempCropperBox.height;
            }
            if (yMax > newContainerData.height) {
                yMax = newContainerData.height;
                yMin = tempCropperBox.height > newContainerData.height ? 0 : newContainerData.height - tempCropperBox.height;
                tempCropperBox.height = yMax - yMin;
                tempCropperBox.width = tempCropperBox.height * aspectRatio;
                xMax = xMin + tempCropperBox.width;
            }
        } else {
            if (xMax > newContainerData.width) {
                xMax = newContainerData.width;
                xMin = tempCropperBox.width > newContainerData.width ? 0 : newContainerData.width - tempCropperBox.width;
            }
            if (yMax > newContainerData.height) {
                yMax = newContainerData.height;
                yMin = tempCropperBox.height > newContainerData.height ? 0 : newContainerData.height - tempCropperBox.height;
            }
        }
        return {
            width: xMax - xMin,
            height: yMax - yMin,
            centerPoint: {
                x: (xMax + xMin) / 2,
                y: (yMax + yMin) / 2,
            },
        };
    }

    #layoutImage() {
        const { originalWidth: naturalWidth, originalHeight: naturalHeight } = this.#imgData;
        const { width: containerWidth, height: containerHeight } = this.#containerData;
        let scale = 1;
        let imgWidth: number;
        let imgHeight: number;
        if (naturalWidth / containerWidth > naturalHeight / containerHeight) {
            scale = containerWidth / naturalWidth;
            imgWidth = containerWidth;
            imgHeight = naturalHeight * scale;
        } else {
            scale = containerHeight / naturalHeight;
            imgWidth = naturalWidth * scale;
            imgHeight = containerHeight;
        }
        this.#imgData.scale = scale;
        const newImgDataState: ImageDataState = {
            width: imgWidth,
            height: imgHeight,
            centerPoint: { x: containerWidth / 2, y: containerHeight / 2 },
        };
        const { defaultAspectRatio, aspectRatio } = this.getProps();
        const calcAspect = aspectRatio || defaultAspectRatio;
        const newCropperBoxState: CropperBox =
            containerWidth / containerHeight > calcAspect
                ? {
                      width: containerHeight * calcAspect,
                      height: containerHeight,
                      centerPoint: { x: containerWidth / 2, y: containerHeight / 2 },
                  }
                : {
                      width: containerWidth,
                      height: containerWidth / calcAspect,
                      centerPoint: { x: containerWidth / 2, y: containerHeight / 2 },
                  };
        this.setState({
            imgData: newImgDataState,
            cropperBox: newCropperBoxState,
            loaded: true,
        });
    }

    #renderPreview() {
        // restore the user's styles first so the size is measured unwritten
        this.#removePreview();
        const { preview, src } = this.getProps();
        const previewNode = preview?.();
        if (!previewNode) {
            return;
        }
        const img = document.createElement('img');
        this.#previewImg = img;
        this.#previewContainer = previewNode;
        const { overflow, width, height } = previewNode.style;
        this.#previewOriginalStyle = { overflow, width, height };
        img.src = src;
        // a mirror of the cropping area, not content
        img.alt = '';
        previewNode.appendChild(img);
        previewNode.style.overflow = 'hidden';
        const { width: previewWidth, height: previewHeight } = previewNode.getBoundingClientRect();
        this.#previewContainerInitSize = {
            width: previewWidth,
            height: previewHeight,
        };
    }

    #removePreview() {
        if (this.#previewImg && this.#previewContainer) {
            this.#previewImg.remove();
            Object.assign(this.#previewContainer.style, this.#previewOriginalStyle);
        }
        this.#previewImg = null;
        this.#previewContainer = null;
    }

    #getResizeVector(dir: CornerDir) {
        let paramX = 0,
            paramY = 0;
        switch (dir) {
            case 'tl':
                paramX = -1;
                paramY = -1;
                break;
            case 'tm':
                paramY = -1;
                break;
            case 'tr':
                paramX = 1;
                paramY = -1;
                break;
            case 'ml':
                paramX = -1;
                break;
            case 'mr':
                paramX = 1;
                break;
            case 'bl':
                paramX = -1;
                paramY = 1;
                break;
            case 'bm':
                paramY = 1;
                break;
            case 'br':
                paramX = 1;
                paramY = 1;
                break;
            default:
                break;
        }
        return {
            paramX,
            paramY,
        };
    }

    #computeAspectResizeRange() {
        const { cropperBox } = this.getStates();
        const { aspectRatio } = this.getProps();
        const { width: containerWidth, height: containerHeight } = this.#containerData;
        let height: number, width: number;
        const xMin = cropperBox.centerPoint.x - cropperBox.width / 2;
        const xMax = cropperBox.centerPoint.x + cropperBox.width / 2;
        const yMin = cropperBox.centerPoint.y - cropperBox.height / 2;
        const yMax = cropperBox.centerPoint.y + cropperBox.height / 2;
        switch (this.#resizeDir) {
            case 'tl':
                height = yMax;
                width = xMax;
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [xMax - width, xMax];
                this.#rangeY = [yMax - height, yMax];
                break;
            case 'tm':
                height = yMax;
                const leftHalfWidth = cropperBox.centerPoint.x;
                const rightHalfWidth = containerWidth - cropperBox.centerPoint.x;
                width = 2 * (leftHalfWidth < rightHalfWidth ? leftHalfWidth : rightHalfWidth);
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [cropperBox.centerPoint.x - width / 2, cropperBox.centerPoint.x + width / 2];
                this.#rangeY = [yMax - height, yMax];
                break;
            case 'tr':
                height = yMax;
                width = containerWidth - xMin;
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [xMin, xMin + width];
                this.#rangeY = [yMax - height, yMax];
                break;
            case 'ml':
                width = xMax;
                const topHalfHeight = cropperBox.centerPoint.y;
                const bottomHalfHeight = containerHeight - cropperBox.centerPoint.y;
                height = 2 * (topHalfHeight < bottomHalfHeight ? topHalfHeight : bottomHalfHeight);
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [xMax - width, xMax];
                this.#rangeY = [cropperBox.centerPoint.y - height / 2, cropperBox.centerPoint.y + height / 2];
                break;
            case 'mr':
                width = containerWidth - xMin;
                const topHalfHeight2 = cropperBox.centerPoint.y;
                const bottomHalfHeight2 = containerHeight - cropperBox.centerPoint.y;
                height = 2 * (topHalfHeight2 < bottomHalfHeight2 ? topHalfHeight2 : bottomHalfHeight2);
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [xMin, xMin + width];
                this.#rangeY = [cropperBox.centerPoint.y - height / 2, cropperBox.centerPoint.y + height / 2];
                break;
            case 'bl':
                height = containerHeight - yMin;
                width = xMax;
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [xMax - width, xMax];
                this.#rangeY = [yMin, yMin + height];
                break;
            case 'bm':
                height = containerHeight - yMin;
                const leftHalfWidth2 = cropperBox.centerPoint.x;
                const rightHalfWidth2 = containerWidth - cropperBox.centerPoint.x;
                width = 2 * (leftHalfWidth2 < rightHalfWidth2 ? leftHalfWidth2 : rightHalfWidth2);
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [cropperBox.centerPoint.x - width / 2, cropperBox.centerPoint.x + width / 2];
                this.#rangeY = [yMin, yMin + height];
                break;
            case 'br':
                height = containerHeight - yMin;
                width = containerWidth - xMin;
                [width, height] = fitAspect(width, height, aspectRatio);
                this.#rangeX = [xMin, xMin + width];
                this.#rangeY = [yMin, yMin + height];
                break;
            default:
                break;
        }
    }

    // The crop box lives in the container's padding box; a root border shifts its viewport coordinates, so pointer
    // positions are converted here once.
    #readContainerSize(): ContainerData {
        const container = this._adapter.getContainer();
        return { width: container.clientWidth, height: container.clientHeight };
    }

    #toContainerPoint(clientX: number, clientY: number): Point {
        const container = this._adapter.getContainer();
        const rect = container.getBoundingClientRect();
        return { x: clientX - rect.left - container.clientLeft, y: clientY - rect.top - container.clientTop };
    }

    /** `point` is in container coordinates */
    #resizeCornerWithAspect = (point: Point) => {
        const { cropperBox } = this.getStates();
        const { aspectRatio } = this.getProps();
        const newCropperBoxPos = {
            width: cropperBox.width,
            height: cropperBox.height,
            centerPoint: { ...cropperBox.centerPoint },
        };
        let offsetX: number, offsetY: number;
        if (['ml', 'mr'].includes(this.#resizeDir)) {
            offsetX = clamp(point.x, ...this.#rangeX);
        } else {
            offsetY = clamp(point.y, ...this.#rangeY);
        }
        // both sides stay at least MIN_BOX_SIZE, as on the keyboard path
        const minHeight = Math.max(MIN_BOX_SIZE, MIN_BOX_SIZE / aspectRatio);
        let collapsed = false;
        const driveHeight = (height: number) => {
            collapsed = height === 0;
            newCropperBoxPos.height = Math.max(height, minHeight);
            newCropperBoxPos.width = newCropperBoxPos.height * aspectRatio;
        };
        const driveWidth = (width: number) => {
            collapsed = width === 0;
            newCropperBoxPos.height = Math.max(width / aspectRatio, minHeight);
            newCropperBoxPos.width = newCropperBoxPos.height * aspectRatio;
        };
        switch (this.#resizeDir) {
            case 'tl':
                driveHeight(this.#rangeY[1] - offsetY);
                newCropperBoxPos.centerPoint = {
                    x: this.#rangeX[1] - newCropperBoxPos.width / 2,
                    y: this.#rangeY[1] - newCropperBoxPos.height / 2,
                };
                break;
            case 'tm':
                driveHeight(this.#rangeY[1] - offsetY);
                newCropperBoxPos.centerPoint = {
                    x: cropperBox.centerPoint.x,
                    y: this.#rangeY[1] - newCropperBoxPos.height / 2,
                };
                break;
            case 'tr':
                driveHeight(this.#rangeY[1] - offsetY);
                newCropperBoxPos.centerPoint = {
                    x: this.#rangeX[0] + newCropperBoxPos.width / 2,
                    y: this.#rangeY[1] - newCropperBoxPos.height / 2,
                };
                break;
            case 'ml':
                driveWidth(this.#rangeX[1] - offsetX);
                newCropperBoxPos.centerPoint = {
                    x: this.#rangeX[1] - newCropperBoxPos.width / 2,
                    y: cropperBox.centerPoint.y,
                };
                break;
            case 'mr':
                driveWidth(offsetX - this.#rangeX[0]);
                newCropperBoxPos.centerPoint = {
                    x: this.#rangeX[0] + newCropperBoxPos.width / 2,
                    y: cropperBox.centerPoint.y,
                };
                break;
            case 'bl':
                driveHeight(offsetY - this.#rangeY[0]);
                newCropperBoxPos.centerPoint = {
                    x: this.#rangeX[1] - newCropperBoxPos.width / 2,
                    y: this.#rangeY[0] + newCropperBoxPos.height / 2,
                };
                break;
            case 'bm':
                driveHeight(offsetY - this.#rangeY[0]);
                newCropperBoxPos.centerPoint = {
                    x: cropperBox.centerPoint.x,
                    y: this.#rangeY[0] + newCropperBoxPos.height / 2,
                };
                break;
            case 'br':
                driveHeight(offsetY - this.#rangeY[0]);
                newCropperBoxPos.centerPoint = {
                    x: this.#rangeX[0] + newCropperBoxPos.width / 2,
                    y: this.#rangeY[0] + newCropperBoxPos.height / 2,
                };
                break;
            default:
                break;
        }
        this.setState({
            cropperBox: newCropperBoxPos,
        });
        // after the state write: the new range is measured from the box just reached
        if (collapsed) {
            this.#changeDir();
            this.#computeAspectResizeRange();
        }
    };

    #changeDir() {
        let dir: string = this.#resizeDir;
        if (dir.includes('t')) {
            dir = dir.replace('t', 'b');
        } else if (dir.includes('b')) {
            dir = dir.replace('b', 't');
        }
        if (dir.includes('l')) {
            dir = dir.replace('l', 'r');
        } else if (dir.includes('r')) {
            dir = dir.replace('r', 'l');
        }
        this.#resizeDir = dir as CornerDir;
    }

    /** `point` is in container coordinates */
    #resizeCornerFree = (point: Point) => {
        const { cropperBox } = this.getStates();
        const offsetX = clamp(point.x, ...this.#rangeX);
        const offsetY = clamp(point.y, ...this.#rangeY);
        const newCropperBoxPos = {
            width: cropperBox.width,
            height: cropperBox.height,
            centerPoint: {
                x: cropperBox.centerPoint.x,
                y: cropperBox.centerPoint.y,
            },
        };
        const { paramX, paramY } = this.#resizeVector;
        // the opposite edge stays put; dragging past it flips the direction; MIN_BOX_SIZE keeps the box from collapsing
        if (paramX) {
            const fixed = cropperBox.centerPoint.x - (paramX * cropperBox.width) / 2;
            const raw = cropperBox.width + paramX * (offsetX - (fixed + paramX * cropperBox.width));
            if (raw < 0) {
                this.#resizeVector.paramX = -paramX;
            }
            newCropperBoxPos.width = Math.max(Math.abs(raw), MIN_BOX_SIZE);
            newCropperBoxPos.centerPoint.x = fixed + (this.#resizeVector.paramX * newCropperBoxPos.width) / 2;
        }
        if (paramY) {
            const fixed = cropperBox.centerPoint.y - (paramY * cropperBox.height) / 2;
            const raw = cropperBox.height + paramY * (offsetY - (fixed + paramY * cropperBox.height));
            if (raw < 0) {
                this.#resizeVector.paramY = -paramY;
            }
            newCropperBoxPos.height = Math.max(Math.abs(raw), MIN_BOX_SIZE);
            newCropperBoxPos.centerPoint.y = fixed + (this.#resizeVector.paramY * newCropperBoxPos.height) / 2;
        }

        this.setState({
            cropperBox: newCropperBoxPos,
        });
    };

    #moveBoxBy(offsetX: number, offsetY: number, range: { xMin: number; xMax: number; yMin: number; yMax: number }) {
        const { cropperBox } = this.getStates();
        this.setState({
            cropperBox: {
                width: cropperBox.width,
                height: cropperBox.height,
                centerPoint: {
                    x: clamp(cropperBox.centerPoint.x + offsetX, range.xMin, range.xMax),
                    y: clamp(cropperBox.centerPoint.y + offsetY, range.yMin, range.yMax),
                },
            },
        });
    }

    #startCornerResize(dir: CornerDir) {
        this.#resizeDir = dir;
        this.#resizeVector = this.#getResizeVector(dir);
        const { aspectRatio } = this.getProps();
        if (aspectRatio) {
            this.#computeAspectResizeRange();
        } else {
            this.#rangeX = [0, this.#containerData.width];
            this.#rangeY = [0, this.#containerData.height];
        }
    }

    #getMoveRange() {
        const { cropperBox } = this.getStates();
        const { width, height } = this.#readContainerSize();
        return {
            xMin: cropperBox.width / 2,
            xMax: width - cropperBox.width / 2,
            yMin: cropperBox.height / 2,
            yMax: height - cropperBox.height / 2,
        };
    }

    #resizeCornerBy(dx: number, dy: number) {
        const { cropperBox } = this.getStates();
        const { aspectRatio } = this.getProps();
        const left = cropperBox.centerPoint.x - cropperBox.width / 2;
        const top = cropperBox.centerPoint.y - cropperBox.height / 2;
        // the aspect path reads the height only, so a width change becomes the matching height
        const heightDelta = aspectRatio && dx ? dx / aspectRatio : dy;
        const minHeight = aspectRatio ? Math.max(MIN_BOX_SIZE, MIN_BOX_SIZE / aspectRatio) : MIN_BOX_SIZE;
        const x = Math.max(left + cropperBox.width + dx, left + MIN_BOX_SIZE);
        const y = Math.max(top + cropperBox.height + heightDelta, top + minHeight);
        this.#startCornerResize('br');
        (aspectRatio ? this.#resizeCornerWithAspect : this.#resizeCornerFree)({ x, y });
        this.handleCornerLostPointerCapture();
    }

    handleCornerPointerMove = (e: Pick<PointerEvent, 'clientX' | 'clientY' | 'preventDefault'>) => {
        if (!this.#resizeDir) {
            return;
        }
        e.preventDefault();
        const point = this.#toContainerPoint(e.clientX, e.clientY);
        if (this.getProps().aspectRatio) {
            this.#resizeCornerWithAspect(point);
        } else {
            this.#resizeCornerFree(point);
        }
    };

    /** Follows pointerup and pointercancel; also fires when the corner leaves the page mid-drag */
    handleCornerLostPointerCapture = () => {
        this.#resizeDir = '';
        this.#resizeVector = { paramX: 0, paramY: 0 };
    };

    handleCropperBoxPointerMove = ({ clientX, clientY }: Pick<PointerEvent, 'clientX' | 'clientY'>) => {
        if (!this.#cropperBoxMoveStart) {
            return;
        }
        this.#moveBoxBy(clientX - this.#cropperBoxMoveStart.x, clientY - this.#cropperBoxMoveStart.y, this.#moveRange);
        this.#cropperBoxMoveStart = {
            x: clientX,
            y: clientY,
        };
    };

    handleCropperBoxLostPointerCapture = () => {
        this.#cropperBoxMoveStart = null;
    };

    handleMaskPointerMove = ({ clientX, clientY }: Pick<PointerEvent, 'clientX' | 'clientY'>) => {
        if (!this.#imgMoveStart) {
            return;
        }
        const { imgData } = this.getStates();
        const offsetX = clientX - this.#imgMoveStart.x;
        const offsetY = clientY - this.#imgMoveStart.y;
        const newCenterPointX = imgData.centerPoint.x + offsetX;
        const newCenterPointY = imgData.centerPoint.y + offsetY;
        const newImgData = {
            width: imgData.width,
            height: imgData.height,
            centerPoint: {
                x: newCenterPointX,
                y: newCenterPointY,
            },
        };
        this.#imgMoveStart = {
            x: clientX,
            y: clientY,
        };
        this.setState({
            imgData: newImgData,
        });
    };

    handleMaskLostPointerCapture = () => {
        this.#imgMoveStart = null;
    };

    override init() {
        this.#containerData = this.#readContainerSize();
        this.#cropperBoxMoveStart = null;
        // destroy removed the preview and no image load will rebuild it
        if (this.getStates().loaded) {
            this.#renderPreview();
        }
    }

    override destroy() {
        this.#removePreview();
    }

    handleResize = () => {
        const { loaded } = this.getStates();
        if (!loaded) {
            return;
        }
        const newContainerData = this.#readContainerSize();
        const { width: oldWidth, height: oldHeight } = this.#containerData;
        if (newContainerData.width === oldWidth && newContainerData.height === oldHeight) {
            return;
        }
        // hidden: keep the layout for when it is shown again
        if (newContainerData.width === 0 || newContainerData.height === 0) {
            return;
        }
        // loaded while the container had no size: nothing to scale from
        if (oldWidth === 0 || oldHeight === 0) {
            this.#containerData = newContainerData;
            this.#layoutImage();
            return;
        }
        const ratio = Math.min(newContainerData.width / oldWidth, newContainerData.height / oldHeight);
        const newImgData = this.#getImgDataWhenResize(ratio);
        const newCropperBox = this.#getCropperBoxWhenResize(ratio, newContainerData);

        this.#containerData = newContainerData;
        this.setState({
            imgData: newImgData,
            cropperBox: newCropperBox,
        });
    };

    /**
     * Refits the crop box to a changed `aspectRatio`: height stays, width follows, and a box too big for the
     * container shrinks. It stays centered, moved only as far as the container edges require.
     */
    applyAspectRatio = () => {
        const { aspectRatio } = this.getProps();
        const { cropperBox, loaded } = this.getStates();
        const { width: containerWidth, height: containerHeight } = this.#containerData;
        if (!loaded || !aspectRatio || !containerWidth || !containerHeight) {
            return;
        }
        let height = Math.max(cropperBox.height, MIN_BOX_SIZE, MIN_BOX_SIZE / aspectRatio);
        let width = height * aspectRatio;
        if (width > containerWidth) {
            width = containerWidth;
            height = width / aspectRatio;
        }
        if (height > containerHeight) {
            height = containerHeight;
            width = height * aspectRatio;
        }
        this.setState({
            cropperBox: {
                width,
                height,
                centerPoint: {
                    x: clamp(cropperBox.centerPoint.x, width / 2, containerWidth - width / 2),
                    y: clamp(cropperBox.centerPoint.y, height / 2, containerHeight - height / 2),
                },
            },
        });
    };

    handleImageLoad = ({ target }: Pick<Event, 'target'>) => {
        if (!(target instanceof HTMLImageElement)) {
            return;
        }
        const { naturalWidth, naturalHeight } = target;
        this.#containerData = this.#readContainerSize();
        this.#imgData.originalWidth = naturalWidth;
        this.#imgData.originalHeight = naturalHeight;
        this.#layoutImage();
        this.#renderPreview();
    };

    /**
     * Brings the state to the `rotate` and `zoom` props once the image has loaded; a controlled zoom also undoes
     * wheel zooming the parent does not accept. Turns and scales around the cropper box center.
     */
    syncRotateAndZoom = ({ rotate: newRotate, zoom: newZoom }: { rotate?: number; zoom?: number } = this.getProps()) => {
        const { rotate, zoom, imgData, cropperBox, loaded } = this.getStates();
        // Object.is: a NaN prop would never match and re-render forever
        const rotateChanged = newRotate !== undefined && !Object.is(newRotate, rotate);
        const zoomChanged = newZoom !== undefined && !Object.is(newZoom, zoom);
        if (!loaded || (!rotateChanged && !zoomChanged)) {
            return;
        }
        // centerPoint y grows downward: flip it for the rotation formula
        const center = { x: cropperBox.centerPoint.x, y: -cropperBox.centerPoint.y };
        let imgCenter = { x: imgData.centerPoint.x, y: -imgData.centerPoint.y };
        let { width, height } = imgData;
        if (rotateChanged) {
            const angle = ((newRotate - rotate) * Math.PI) / 180;
            imgCenter = {
                x: (imgCenter.x - center.x) * Math.cos(angle) + (imgCenter.y - center.y) * Math.sin(angle) + center.x,
                y: -(imgCenter.x - center.x) * Math.sin(angle) + (imgCenter.y - center.y) * Math.cos(angle) + center.y,
            };
        }
        if (zoomChanged) {
            width = (width / zoom) * newZoom;
            height = (height / zoom) * newZoom;
            imgCenter = {
                x: ((imgCenter.x - center.x) / zoom) * newZoom + center.x,
                y: ((imgCenter.y - center.y) / zoom) * newZoom + center.y,
            };
        }
        this.setState({
            rotate: rotateChanged ? newRotate : rotate,
            zoom: zoomChanged ? newZoom : zoom,
            imgData: { width, height, centerPoint: { x: imgCenter.x, y: -imgCenter.y } },
        });
    };

    handleWheel = (e: Pick<WheelEvent, 'clientX' | 'clientY' | 'deltaY' | 'preventDefault'>) => {
        // a two-finger pinch would zoom the page
        e.preventDefault();
        // before the load a zoom would outlive the fit
        if (!this.getStates().loaded) {
            return;
        }
        const { imgData, zoom: currZoom } = this.getStates();
        const { maxZoom, minZoom, zoomStep } = this.getProps();

        if (e.deltaY === 0) {
            return;
        }
        const stepped = currZoom + (e.deltaY < 0 ? zoomStep : -zoomStep);
        const _zoom = Number(Math.min(maxZoom, Math.max(minZoom, stepped)).toFixed(2));
        if (_zoom === currZoom) {
            return;
        }
        const point = this.#toContainerPoint(e.clientX, e.clientY);
        const scaleCenter = {
            x: point.x,
            y: -point.y,
        };

        const currentPoint = { ...imgData.centerPoint };
        currentPoint.y = -currentPoint.y;

        const newCenterPoint = {
            x: ((currentPoint.x - scaleCenter.x) / currZoom) * _zoom + scaleCenter.x,
            y: -(((currentPoint.y - scaleCenter.y) / currZoom) * _zoom + scaleCenter.y),
        };

        const newWidth = (imgData.width / currZoom) * _zoom;
        const newHeight = (imgData.height / currZoom) * _zoom;

        const newImgDataState = {
            width: newWidth,
            height: newHeight,
            centerPoint: newCenterPoint,
        };
        this.setState({
            imgData: newImgDataState,
            zoom: _zoom,
        });

        this._adapter.notifyZoomChange(_zoom);
    };

    updatePreview = () => {
        if (!this.#previewImg) {
            return;
        }
        const { cropperBox, imgData, rotate } = this.getStates();
        const { width, height } = imgData;
        const { viewX: translateX, viewY: translateY } = getCropperGeometry(imgData, cropperBox);
        let zoom = 1;
        const { width: containerWidth, height: containerHeight } = this.#previewContainerInitSize;
        let previewWidth = containerWidth;
        let previewHeight = containerHeight;
        if (previewWidth < previewHeight) {
            zoom = containerWidth / cropperBox.width;
            let tempHeight = zoom * cropperBox.height;
            if (tempHeight > containerHeight) {
                zoom = containerHeight / cropperBox.height;
                previewWidth = zoom * cropperBox.width;
            } else {
                previewHeight = tempHeight;
            }
        } else {
            zoom = containerHeight / cropperBox.height;
            let tempWidth = zoom * cropperBox.width;
            if (tempWidth > containerWidth) {
                zoom = containerWidth / cropperBox.width;
                previewHeight = zoom * cropperBox.height;
            } else {
                previewWidth = tempWidth;
            }
        }
        this.#previewImg.style.width = `${width * zoom}px`;
        this.#previewImg.style.height = `${height * zoom}px`;
        this.#previewImg.style.transform = `translate(${translateX * zoom}px, ${translateY * zoom}px) rotate(${rotate}deg)`;
        this.#previewImg.style.transformOrigin = 'center';
        this.#previewContainer.style.width = `${previewWidth}px`;
        this.#previewContainer.style.height = `${previewHeight}px`;
    };

    // each drag surface captures the pointer so moves and release arrive outside it too
    handleCornerPointerDown = (e: Pick<PointerEvent, 'button' | 'currentTarget' | 'pointerId' | 'preventDefault'>) => {
        const currentTarget = e.currentTarget;
        if (!(currentTarget instanceof HTMLElement) || isSecondaryPress(e)) {
            return;
        }
        e.preventDefault();
        currentTarget.setPointerCapture(e.pointerId);
        this.#startCornerResize(currentTarget.dataset.dir as CornerDir);
    };

    handleCropperBoxPointerDown = (e: Pick<PointerEvent, 'button' | 'clientX' | 'clientY' | 'currentTarget' | 'pointerId' | 'target'>) => {
        if (e.target instanceof HTMLElement && e.target.dataset.dir) {
            // a press on a resize handle belongs to the handle
            return;
        }
        const { currentTarget } = e;
        if (!(currentTarget instanceof Element) || isSecondaryPress(e)) {
            return;
        }
        currentTarget.setPointerCapture(e.pointerId);
        this.#cropperBoxMoveStart = {
            x: e.clientX,
            y: e.clientY,
        };
        this.#moveRange = this.#getMoveRange();
    };

    /**
     * Moves the box with the arrow keys by KEYBOARD_STEP px; Shift moves the bottom right corner instead, through
     * the drag path, so the box keeps to the container and the aspect ratio. Only with resize handles shown, as
     * with a pointer.
     */
    handleCropperBoxKeyDown = (e: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'preventDefault' | 'shiftKey'>) => {
        // Alt/Ctrl/Meta plus an arrow is a browser or OS shortcut
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        const direction = new Map([
            ['ArrowLeft', [-1, 0]],
            ['ArrowRight', [1, 0]],
            ['ArrowUp', [0, -1]],
            ['ArrowDown', [0, 1]],
        ]).get(e.key);
        if (!direction || !this.getStates().loaded) {
            return;
        }
        const dx = direction[0] * KEYBOARD_STEP;
        const dy = direction[1] * KEYBOARD_STEP;
        if (!e.shiftKey) {
            e.preventDefault();
            this.#moveBoxBy(dx, dy, this.#getMoveRange());
        } else if (this.getProps().showResizeBox) {
            e.preventDefault();
            this.#resizeCornerBy(dx, dy);
        }
    };

    handleMaskPointerDown = (e: Pick<PointerEvent, 'button' | 'clientX' | 'clientY' | 'currentTarget' | 'pointerId' | 'target'>) => {
        const { currentTarget } = e;
        if (!(currentTarget instanceof Element) || currentTarget !== e.target || isSecondaryPress(e)) {
            return;
        }
        currentTarget.setPointerCapture(e.pointerId);
        this.#imgMoveStart = {
            x: e.clientX,
            y: e.clientY,
        };
    };

    getCropperCanvas = () => {
        if (!this.getStates().loaded) {
            throw new Error('[Semi] Cropper: getCropperCanvas called before the image loaded');
        }
        const { cropperBox, imgData, rotate, zoom } = this.getStates();
        const { fill } = this.getProps();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = this._adapter.getImg();

        const angle = (rotate * Math.PI) / 180;
        const sine = Math.abs(Math.sin(angle));
        const cosine = Math.abs(Math.cos(angle));
        const imgWidth = this.#imgData.originalWidth;
        const imgHeight = this.#imgData.originalHeight;
        const containerWidth = imgWidth * cosine + imgHeight * sine;
        const containerHeight = imgHeight * cosine + imgWidth * sine;

        // when the crop area does not intersect the bounding box, the result is a blank image
        const cropperContainerWidth = containerWidth * zoom * this.#imgData.scale;
        const cropperContainerHeight = containerHeight * zoom * this.#imgData.scale;
        const cropperContainerTop = imgData.centerPoint.y - cropperContainerHeight / 2;
        const cropperContainerLeft = imgData.centerPoint.x - cropperContainerWidth / 2;
        const cropperBoxLeft = cropperBox.centerPoint.x - cropperBox.width / 2;
        const cropperBoxTop = cropperBox.centerPoint.y - cropperBox.height / 2;
        const realZoom = zoom * this.#imgData.scale;

        const relativeCropLeft = (cropperBoxLeft - cropperContainerLeft) / realZoom;
        const relativeCropTop = (cropperBoxTop - cropperContainerTop) / realZoom;
        const relativeWidth = cropperBox.width / realZoom;
        const relativeHeight = cropperBox.height / realZoom;
        const relativeCropRight = relativeCropLeft + relativeWidth;
        const relativeCropBottom = relativeCropTop + relativeHeight;

        if (relativeCropRight < 0 || relativeCropBottom < 0 || relativeCropLeft > containerWidth || relativeCropTop > containerHeight) {
            const emptyCanvas = document.createElement('canvas');
            const ctx = emptyCanvas.getContext('2d');
            emptyCanvas.width = relativeWidth;
            emptyCanvas.height = relativeHeight;
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, relativeWidth, relativeHeight);
            return emptyCanvas;
        }

        canvas.width = containerWidth;
        canvas.height = containerHeight;
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, containerWidth, containerHeight);

        const halfWidth = containerWidth / 2;
        const halfHeight = containerHeight / 2;
        ctx.translate(halfWidth, halfHeight);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.translate(-halfWidth, -halfHeight);

        const imgX = (containerWidth - imgWidth) / 2;
        const imgY = (containerHeight - imgHeight) / 2;
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight, imgX, imgY, imgWidth, imgHeight);

        const canvas2 = document.createElement('canvas');
        const ctx2 = canvas2.getContext('2d');
        // clamp the crop area to the canvas, or pixels outside it come out with wrong colors
        let realLeft = relativeCropLeft;
        let realTop = relativeCropTop;
        let realWidth = relativeWidth;
        let realHeight = relativeHeight;

        if (relativeCropLeft < 0) {
            realLeft = 0;
        }
        if (relativeCropTop < 0) {
            realTop = 0;
        }
        if (relativeCropRight > containerWidth) {
            realWidth = containerWidth - realLeft;
        } else if (relativeCropLeft < 0) {
            realWidth = relativeCropRight;
        }

        if (relativeCropBottom > containerHeight) {
            realHeight = containerHeight - realTop;
        } else if (relativeCropTop < 0) {
            realHeight = relativeCropBottom;
        }

        canvas2.width = relativeWidth;
        canvas2.height = relativeHeight;
        ctx2.fillStyle = fill;
        ctx2.fillRect(0, 0, relativeWidth, relativeHeight);
        const imgDataResult = ctx.getImageData(realLeft, realTop, realWidth, realHeight);
        ctx2.putImageData(imgDataResult, relativeCropLeft < 0 ? -relativeCropLeft : 0, relativeCropTop < 0 ? -relativeCropTop : 0);
        return canvas2;
    };
}
