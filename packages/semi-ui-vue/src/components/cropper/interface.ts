import type { ClassValue, ImgHTMLAttributes, StyleValue } from 'vue';
import type { CropperPart } from '@fibrae/semi-foundation/components/cropper/constants';

export type CropperShape = 'rect' | 'round' | 'roundRect';

export interface CropperProps {
    src?: string;
    /** Passed to the image; `src`, the layout style and the order of `onLoad` are owned by the cropper */
    imgProps?: ImgHTMLAttributes;
    shape?: CropperShape;
    /** Controlled crop ratio */
    aspectRatio?: number;
    /** The initial width-to-height ratio of the cropping box, default is 1 */
    defaultAspectRatio?: number;
    /** Controlled zoom, applied on top of the initial scaling that fits the loaded image into the cropper */
    zoom?: number;
    /** Image rotation angle; one-way, the cropper never changes it */
    rotate?: number;
    showResizeBox?: boolean;
    classNames?: Partial<Record<CropperPart, ClassValue>>;
    styles?: Partial<Record<CropperPart, StyleValue>>;
    fill?: string;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    /** The element the cropped area is mirrored into; it is a host DOM handle, so it stays a function */
    preview?: () => HTMLElement | null | undefined;
}

export interface CropperEmits {
    /** Emitted by wheel zooming, for `v-model:zoom` */
    'update:zoom': [zoom: number];
    zoomChange: [zoom: number];
}

export interface CropperHandle {
    /** Draws the area inside the cropper box, at the image's own resolution, onto a new canvas */
    getCropperCanvas: () => HTMLCanvasElement;
}
