import type { RatioType } from './interface';

export const FOOTER_ITEMS = ['prev', 'page', 'next', 'zoomOut', 'slider', 'zoomIn', 'ratio', 'rotate', 'download'] as const;

export type FooterItemName = (typeof FOOTER_ITEMS)[number];
export type FooterButtonName = Exclude<FooterItemName, 'page' | 'slider'>;

export interface FooterButton {
    label: string;
    disabled: boolean;
    onClick: () => void;
}

/** What one footer item renders from; built once per footer render and shared by all items */
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
    buttons: Record<FooterButtonName, FooterButton>;
    onSlide: (value: number | number[]) => void;
}
