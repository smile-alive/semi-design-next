import { BASE_CLASS_PREFIX } from '../base/constants';

const moduleName = `${BASE_CLASS_PREFIX}-cropper`;

export const cssClasses = {
    PREFIX: `${moduleName}`,
    IMG: `${moduleName}-img`,
    IMG_WRAPPER: `${moduleName}-img-wrapper`,
    CROPPER_BOX: `${moduleName}-box`,
    CROPPER_VIEW_BOX: `${moduleName}-view-box`,
    CROPPER_VIEW_BOX_ROUND: `${moduleName}-view-box-round`,
    CROPPER_IMG: `${moduleName}-view-img`,
    MASK: `${moduleName}-mask`,
    CORNER: `${moduleName}-box-corner`,
};

/** Pixels one arrow key press moves or resizes the crop box */
export const KEYBOARD_STEP = 10;
/** Smallest side in px the keyboard shrinks the crop box to */
export const MIN_BOX_SIZE = 10;

export const strings = {
    corner: ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'],
    roundCorner: ['tm', 'ml', 'mr', 'bm'],
} as const;

/** A resize handle of the crop box: t/m/b for the row, l/m/r for the column */
export type CornerDir = (typeof strings.corner)[number];
