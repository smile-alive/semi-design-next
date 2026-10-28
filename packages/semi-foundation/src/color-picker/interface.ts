export interface HsvColor {
    h: number;
    s: number;
    v: number;
}

export interface HsvaColor extends HsvColor {
    a: number;
}

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface RgbaColor extends RgbColor {
    a: number;
}

export interface HslColor {
    h: number;
    s: number;
    l: number;
}

export interface HslaColor extends HslColor {
    a: number;
}

/** The text formats of the color input */
export type ColorFormat = 'hex' | 'rgba' | 'hsva';

/** The keydown fields the range handlers read; a framework's synthetic event fits */
export type RangeKeyEvent = Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'>;

/** The pointer fields the drag handlers read; a framework's synthetic event fits */
export type DragPointerEvent = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY' | 'button'> & {
    currentTarget: Element;
};
