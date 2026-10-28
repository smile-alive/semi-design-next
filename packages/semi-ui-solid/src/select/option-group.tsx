import type { JSX } from 'solid-js';
import { createToken } from '../_base/token';

export const OPTGROUP = 'Select.OptGroup';

/** Other attributes land on the group title, which renders only when `label` has content */
export interface OptionGroupProps {
    [key: string]: unknown;
    /** `Select.Option`s */
    children?: JSX.Element;
    label?: string | number;
    class?: string;
    style?: JSX.CSSProperties | string;
    id?: string;
}

/** Inside a Select an OptGroup renders nothing itself: Select reads its props and options and renders the group */
export default function OptGroup(props: OptionGroupProps) {
    return createToken(OPTGROUP, props);
}
