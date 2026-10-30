import TypographyNumeralPart from './numeral.svelte';
import TypographyParagraphPart from './paragraph.svelte';
import TypographyTextPart from './text.svelte';
import TypographyTitlePart from './title.svelte';
import TypographyBase from './typography.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const Typography: typeof TypographyBase & {
    Text: typeof TypographyTextPart;
    Title: typeof TypographyTitlePart;
    Paragraph: typeof TypographyParagraphPart;
    Numeral: typeof TypographyNumeralPart;
} = Object.assign(TypographyBase, { Text: TypographyTextPart, Title: TypographyTitlePart, Paragraph: TypographyParagraphPart, Numeral: TypographyNumeralPart });
export { default as TypographyText } from './text.svelte';
export { default as TypographyTitle } from './title.svelte';
export { default as TypographyParagraph } from './paragraph.svelte';
export { default as TypographyNumeral } from './numeral.svelte';
export type { TypographyProps, TypographyTitleProps, TypographyTextProps, TypographyParagraphProps, TypographyNumeralProps, TypographyCopyableConfig, TypographyCopyActionProps, TypographyEllipsisTooltipProps, ShowTooltip as TypographyShowTooltip, Ellipsis as TypographyEllipsis } from './interface.js';
