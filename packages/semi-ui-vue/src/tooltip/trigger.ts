import { type CSSProperties, type VNode, Text, normalizeStyle } from 'vue';
import { cssClasses, canRoleCarryPopupState, isBlockDisplay, wrapsSpecialTrigger } from '@fibrae/semi-foundation/tooltip/constants';
import elementType from '../_base/element-type';
import type { TooltipProps } from './interface';

type Attrs = Record<string, unknown>;

export interface TriggerBinding {
    /** The trigger renders inside a wrapper span that receives the trigger attributes. */
    wrapped: boolean;
    wrapperAttrs: Attrs;
    /** Merged into the child VNode by `<component :is>`; the child's own values win. */
    childAttrs: Attrs;
}

const isOn = (value: unknown) => value === '' || value === true;

export function canCarryPopupState(node: VNode) {
    if (node.props?.role) return canRoleCarryPopupState(node.props.role as string);
    if (typeof node.type === 'string') return node.type === 'button' || (node.type === 'a' && Boolean(node.props?.href));
    return elementType(node) === 'Button' || elementType(node) === 'IconButton';
}

/** The popup's open state and whether its node is in the document */
interface PopupState {
    visible: boolean;
    inserted: boolean;
}

function ariaAttrs(node: VNode | undefined, props: TooltipProps, popupId: string, popup: PopupState): Attrs {
    // An IDREF to a popup that is not in the document yet (or never, under condition false) points at nothing.
    if (props.role === 'tooltip') return popup.inserted ? { 'aria-describedby': popupId } : {};
    if (props.role === 'dialog' && (!node || canCarryPopupState(node))) {
        return {
            'aria-expanded': String(popup.visible),
            'aria-haspopup': 'dialog',
            ...(popup.inserted && { 'aria-controls': popupId }),
        };
    }
    return {};
}

// The trigger's own description stays, followed by the popup's; null (Slider) still opts out.
function joinedDescription(aria: Attrs, own?: Attrs | null): Attrs {
    const description = own?.['aria-describedby'];
    return description && aria['aria-describedby'] ? { 'aria-describedby': `${description} ${aria['aria-describedby']}` } : {};
}

// Capture phase, so the tooltip handler runs before the trigger's own keydown listener
function triggerAttrs(aria: Attrs, popupId: string, keydown: EventListener | undefined, own: Attrs | null): Attrs {
    const defaults: Attrs = { ...aria, tabindex: own?.tabIndex ?? 0 };
    const attrs = Object.fromEntries(Object.entries(defaults).filter(([key]) => own?.[key] === undefined));
    return { ...attrs, ...joinedDescription(aria, own), 'data-popupid': popupId, onKeydownCapture: keydown };
}

export default function bindTrigger(nodes: VNode[], props: TooltipProps, popupId: string, popup: PopupState, keydown?: EventListener): TriggerBinding {
    const wrapperClass = [`${cssClasses.PREFIX}-trigger-wrapper`, props.wrapperClassName];
    const node = nodes.length === 1 && nodes[0].type !== Text ? nodes[0] : undefined;
    if (!node) {
        return {
            wrapped: true,
            wrapperAttrs: {
                ...triggerAttrs(ariaAttrs(undefined, props, popupId, popup), popupId, keydown, null),
                class: wrapperClass,
                style: { display: nodes.length > 1 ? 'inline-block' : undefined },
            },
            childAttrs: {},
        };
    }

    const disabled = isOn(node.props?.disabled);
    // Button ignores loading while disabled
    const loading = !disabled && isOn(node.props?.loading) && ['Button', 'IconButton'].includes(elementType(node) ?? '');
    const special = Boolean(props.wrapWhenSpecial && (disabled || loading));
    const wrapped = special && wrapsSpecialTrigger(props.trigger, loading);
    if (!wrapped) {
        return {
            wrapped,
            wrapperAttrs: {},
            childAttrs: {
                ...triggerAttrs(ariaAttrs(node, props, popupId, popup), popupId, keydown, node.props),
                style: special && props.trigger === 'custom' ? { pointerEvents: 'none' } : undefined,
            },
        };
    }

    const aria = ariaAttrs(node, props, popupId, popup);
    const display = (normalizeStyle(node.props?.style) as CSSProperties | undefined)?.display ?? '';

    return {
        wrapped,
        wrapperAttrs: {
            ...triggerAttrs(loading ? {} : aria, popupId, keydown, null),
            ...(loading && { tabindex: -1 }),
            class: wrapperClass,
            style: {
                display: 'inline-block',
                width: isOn(node.props?.block) || isBlockDisplay(display) ? '100%' : undefined,
                cursor: disabled ? 'not-allowed' : undefined,
            },
        },
        childAttrs: {
            ...(loading && { ...aria, ...joinedDescription(aria, node.props) }),
            style: { pointerEvents: 'none' },
        },
    };
}
