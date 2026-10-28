import Numeral from './numeral';
import Paragraph from './paragraph';
import Text from './text';
import Title from './title';
import BaseTypography from './typography';

export type TypographyType = typeof BaseTypography & {
    Text: typeof Text;
    Title: typeof Title;
    Paragraph: typeof Paragraph;
    Numeral: typeof Numeral;
};

const Typography: TypographyType = Object.assign(BaseTypography, { Text, Title, Paragraph, Numeral });

export type { TypographyProps } from './typography';
export type { CopyableProps } from './copyable';
export type { TitleProps } from './title';
export type { TextProps } from './text';
export type { ParagraphProps } from './paragraph';
export type { NumeralProps } from './numeral';
export * from './interface';
export default Typography;
