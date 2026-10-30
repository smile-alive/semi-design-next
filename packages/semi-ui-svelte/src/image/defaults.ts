import { numbers } from '@fibrae/semi-foundation/image/constants';

export const previewDefaults = {
    showTooltip: false,
    zoomStep: 0.1,
    infinite: false,
    closable: true,
    closeOnEsc: true,
    preLoad: true,
    preLoadGap: 2,
    zIndex: numbers.DEFAULT_Z_INDEX,
    maskClosable: true,
    viewerVisibleDelay: 10000,
    maxZoom: 5,
    minZoom: 0.1,
    disableDownload: false,
} as const;
