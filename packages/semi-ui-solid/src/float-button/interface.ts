import type { JSX } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/float-button/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { ElementProps } from '../_base/element-props';
import type { BadgeProps } from '../badge';

export type FloatButtonShape = ArrayElement<typeof strings.SHAPE>;
export type FloatButtonSize = ArrayElement<typeof strings.SIZE>;
export type FloatButtonElement = HTMLButtonElement | HTMLAnchorElement;

// `type` and form* are omitted: the element is always `type="button"` or an `<a>`
export type FloatButtonOmittedKeys = 'ref' | 'onClick' | 'children' | 'type' | 'form' | 'formaction' | 'formenctype' | 'formmethod' | 'formnovalidate' | 'formtarget';

export interface FloatButtonProps extends ElementProps<'button', FloatButtonOmittedKeys> {
    shape?: FloatButtonShape;
    colorful?: boolean;
    icon?: JSX.Element;
    onClick?: JSX.EventHandlerUnion<FloatButtonElement, MouseEvent>;
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    size?: FloatButtonSize;
    badge?: BadgeProps;
    /** Attached to the root element: an `<a>` when `href` is set, otherwise a `<button>` */
    ref?: FloatButtonElement | ((element: FloatButtonElement) => void);
}
