import type { ClassValue } from 'svelte/elements';
import type { ImagePreviewPart } from '@fibrae/semi-foundation/components/image/constants';
import type { RatioType } from '../interface.js';

export const FOOTER_ITEMS = ['prev', 'page', 'next', 'zoomOut', 'slider', 'zoomIn', 'ratio', 'rotate', 'download'] as const;

export type FooterItemName = (typeof FOOTER_ITEMS)[number];
export type FooterButtonName = Exclude<FooterItemName, 'page' | 'slider'>;

export interface FooterButton {
    label: string;
    disabled: boolean;
    onClick: () => void;
}

export interface FooterView {
    showTooltip: boolean;
    curPage: number;
    totalNum: number;
    zoom: number;
    min: number;
    max: number;
    step: number;
    ratio: RatioType;
    zoomLabel: string;
    classNames?: Partial<Record<ImagePreviewPart, ClassValue>>;
    styles?: Partial<Record<ImagePreviewPart, string>>;
    buttons: Record<FooterButtonName, FooterButton>;
    onSlide: (value: number | number[]) => void;
}
