import type React from 'react';
import { Children, cloneElement, isValidElement, memo } from 'react';
import FormatNumeral from '@fibrae/semi-foundation/typography/format-numeral';
import Base from './base';
import type { TypographyBaseSize, TypographyBaseRule, OmitTypographyProps, TypographyBaseTruncate, TypographyCommonProps } from './interface';

type OmitNumeralProps = OmitTypographyProps;

export interface NumeralProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, OmitNumeralProps>, TypographyCommonProps {
    rule?: TypographyBaseRule;
    precision?: number;
    truncate?: TypographyBaseTruncate;
    parser?: (value: string) => string;
    children?: React.ReactNode;
    code?: boolean;
    icon?: React.ReactNode | string;
    size?: TypographyBaseSize;
    /** Attached to the root element */
    ref?: React.Ref<HTMLSpanElement>;
}

// Children.map would drop a function child (not a valid ReactNode), so it is left to its owner, e.g. Context.Consumer
function formatNode(node: React.ReactNode, format: (value: string) => string): React.ReactNode {
    if (typeof node === 'function') {
        return node;
    }
    const formatted = Children.map(node, (item) => {
        if (typeof item === 'string' || typeof item === 'number') {
            return format(String(item));
        }
        if (isValidElement<{ children?: React.ReactNode }>(item) && 'children' in item.props) {
            return cloneElement(item, { children: formatNode(item.props.children, format) });
        }
        return item;
    });
    return formatted?.length === 1 ? formatted[0] : formatted;
}

function Numeral({ rule = 'text', precision = 0, truncate = 'round', parser, children, ...rest }: NumeralProps) {
    const format = (value: string) => new FormatNumeral(value, rule, precision, truncate, parser).format();

    return (
        <Base {...rest} component={rest.component ?? 'span'}>
            {formatNode(children, format)}
        </Base>
    );
}

export default memo(Numeral);
