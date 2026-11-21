import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-typography`,
};

export const strings = {
    WEIGHT: ['light', 'regular', 'medium', 'semibold', 'bold', 'default'],
    TYPE: ['primary', 'secondary', 'danger', 'warning', 'success', 'tertiary', 'quaternary'],
    SIZE: ['normal', 'small', 'inherit'],
    SPACING: ['normal', 'extended'],
    HEADING: [1, 2, 3, 4, 5, 6],
    RULE: ['text', 'numbers', 'bytes-decimal', 'bytes-binary', 'percentages', 'exponential'],
    TRUNCATE: ['ceil', 'floor', 'round'],
} as const;

/** Keys of `classNames` and `styles` on Typography.Text; the root element takes `className` and `style` */
export type TypographyTextPart = 'icon' | 'expand' | 'copy';

/** Keys of `classNames` and `styles` on Typography.Title; the root element takes `className` and `style` */
export type TypographyTitlePart = 'expand' | 'copy';

/** Keys of `classNames` and `styles` on Typography.Paragraph; the root element takes `className` and `style` */
export type TypographyParagraphPart = 'expand' | 'copy';

/** Keys of `classNames` and `styles` on Typography.Numeral; the root element takes `className` and `style` */
export type TypographyNumeralPart = 'icon';
