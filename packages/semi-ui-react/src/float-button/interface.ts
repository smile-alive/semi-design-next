import type { strings } from '@fibrae/semi-foundation/float-button/constants';
import type { ArrayElement, ElementProps } from '../_base/base';
import type { BadgeProps } from '../badge';

// `type` and form* are omitted: the element is always `type="button"` or an `<a>`
export interface FloatButtonProps extends ElementProps<'button', 'onClick' | 'content' | 'children' | 'type' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget'> {
    shape?: ArrayElement<typeof strings.SHAPE>;
    colorful?: boolean;
    style?: React.CSSProperties;
    className?: string;
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    size?: ArrayElement<typeof strings.SIZE>;
    badge?: BadgeProps;
    /** Attached to the root element: an `<a>` when `href` is set, otherwise a `<button>` */
    ref?: React.Ref<HTMLButtonElement | HTMLAnchorElement>;
}
