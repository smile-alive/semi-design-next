import { type JSX, mergeProps } from 'solid-js';
import type { OtherProps } from './other/other.solid.ts';

// Not `as const`: defaults still print as the values the constants hold
const strings = { PREFIX: 'semi', SIZES: ['small', 'large'] };
const order = { ALIGN: ['end', 'start'] } as const;

type Style = JSX.CSSProperties | string;
export type Width = number | string;

interface CommonProps {
    alignBy?: (typeof order.ALIGN)[number];
    children?: JSX.Element;
    prefixCls?: string;
    sizes?: string[];
    style?: Style;
    width?: Width;
}

interface ListModeProps extends CommonProps {
    mode?: 'list';
    onPick?: (value: string) => void;
    size?: 'small';
}

interface GridModeProps extends CommonProps, OtherProps {
    mode: 'grid';
    onPick?: (value: string[]) => void;
    size?: 'small' | 'large';
    columns?: number;
}

export type ModesProps = ListModeProps | GridModeProps;

export function Modes(rawProps: ModesProps) {
    return mergeProps({ prefixCls: `${strings.PREFIX}-modes`, size: strings.SIZES[0] as 'small', sizes: [...strings.SIZES, 'huge'] }, rawProps);
}
