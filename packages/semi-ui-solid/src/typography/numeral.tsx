import { type JSX, children, createMemo, splitProps } from 'solid-js';
import FormatNumeral from '@fibrae/semi-foundation/typography/format-numeral';
import type { ElementProps } from '../_base/element-props';
import Base, { type BaseTypographyProps } from './base';
import type { OmitTypographyProps, TypographyBaseRule, TypographyBaseSize, TypographyBaseTruncate, TypographyCommonProps, TypographyIcon } from './interface';

export interface NumeralProps extends ElementProps<'span', OmitTypographyProps>, TypographyCommonProps {
    rule?: TypographyBaseRule;
    precision?: number;
    truncate?: TypographyBaseTruncate;
    parser?: (value: string) => string;
    code?: boolean;
    icon?: TypographyIcon;
    size?: TypographyBaseSize;
}

// Elements pass through as they are: the server renders them to markup, whose text it cannot format the way the browser would
function formatNode(node: unknown, format: (value: string) => string) {
    return typeof node === 'string' || typeof node === 'number' ? format(String(node)) : node;
}

// Resolved below Base, so the nodes it creates see the size context Base provides
function FormattedChildren(props: { format: (value: string) => string; children?: JSX.Element }) {
    const resolved = children(() => props.children);
    const formatted = createMemo(() => resolved.toArray().map((node) => formatNode(node, props.format)));

    return <>{formatted()}</>;
}

export default function Numeral(props: NumeralProps) {
    const [local, rest] = splitProps(props, ['rule', 'precision', 'truncate', 'parser', 'children']);

    const format = (value: string) => new FormatNumeral(value, local.rule ?? 'text', local.precision ?? 0, local.truncate ?? 'round', local.parser).format();

    return (
        <Base {...(rest as BaseTypographyProps)} component={rest.component ?? 'span'}>
            <FormattedChildren format={format}>{local.children}</FormattedChildren>
        </Base>
    );
}
