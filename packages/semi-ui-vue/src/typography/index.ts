import TypographyNumeral from './numeral.vue';
import TypographyParagraph from './paragraph.vue';
import TypographyText from './text.vue';
import TypographyTitle from './title.vue';
import Typography from './typography.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const TypographyWithParts: typeof Typography & {
    Text: typeof TypographyText;
    Title: typeof TypographyTitle;
    Paragraph: typeof TypographyParagraph;
    Numeral: typeof TypographyNumeral;
} = Object.assign(Typography, {
    Text: TypographyText,
    Title: TypographyTitle,
    Paragraph: TypographyParagraph,
    Numeral: TypographyNumeral,
});
export default TypographyWithParts;
export { default as TypographyText } from './text.vue';
export { default as TypographyTitle } from './title.vue';
export { default as TypographyParagraph } from './paragraph.vue';
export { default as TypographyNumeral } from './numeral.vue';
export type * from './interface';
