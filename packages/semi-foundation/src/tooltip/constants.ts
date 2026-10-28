import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-tooltip`,
} as const;

export const strings = {
    POSITION_SET: ['top', 'topLeft', 'topRight', 'left', 'leftTop', 'leftBottom', 'right', 'rightTop', 'rightBottom', 'bottom', 'bottomLeft', 'bottomRight', 'leftTopOver', 'rightTopOver', 'leftBottomOver', 'rightBottomOver'],
    TRIGGER_SET: ['hover', 'focus', 'click', 'custom', 'contextMenu'],
    STATUS_DISABLED: 'disabled',
    STATUS_LOADING: 'loading',
    LEAVE_DELAY_WARNING: "[Semi Tooltip] 'mouseLeaveDelay' cannot be less than 'mouseEnterDelay', which may cause the dropdown layer to not be hidden.",
} as const;

/** The DOM event names the trigger and popup listeners bind to */
export const TRIGGER_EVENT_NAMES = {
    mouseEnter: 'mouseenter',
    mouseLeave: 'mouseleave',
    mouseOut: 'mouseout',
    mouseOver: 'mouseover',
    click: 'click',
    // focusin / focusout bubble from descendants like React's onFocus / onBlur
    focus: 'focusin',
    blur: 'focusout',
    keydown: 'keydown',
    contextMenu: 'contextmenu',
} as const;

// ARIA allows aria-haspopup and aria-expanded only on these roles
const POPUP_TRIGGER_ROLES: ReadonlySet<string> = new Set(['button', 'link', 'menuitem', 'combobox', 'tab', 'treeitem', 'gridcell']);
const BLOCK_DISPLAYS: ReadonlySet<string | undefined> = new Set(['flex', 'block', 'table', 'flow-root', 'grid']);

export const canRoleCarryPopupState = (role: string) => POPUP_TRIGGER_ROLES.has(role);

/** Whether a wrapper around a trigger with this `display` must fill the width */
export const isBlockDisplay = (display?: string) => BLOCK_DISPLAYS.has(display);

/**
 * Whether a disabled or loading trigger gets a wrapper span that takes the pointer events: a loading Button
 * ignores the pointer and a disabled one gets no click (F4)
 */
export const wrapsSpecialTrigger = (trigger: string | undefined, loading: boolean) => trigger !== 'custom' && (loading || trigger === 'click' || trigger === 'contextMenu');

const alwaysDark = `${BASE_CLASS_PREFIX}-always-dark`;
const alwaysLight = `${BASE_CLASS_PREFIX}-always-light`;

/** The forced light and dark areas; the popup leaves the trigger's subtree, so it copies the innermost one around it */
export const COLOR_SCHEME_SELECTOR = `.${alwaysDark}, .${alwaysLight}`;

/** The class that keeps a popup in the scheme of `area`, the innermost COLOR_SCHEME_SELECTOR element around the trigger */
export const colorSchemeOf = (area?: Element | null) => (area ? (area.classList.contains(alwaysDark) ? alwaysDark : alwaysLight) : undefined);

/**
 * Where a popup opened from a trigger in `root` is inserted: the shadow root, else body, so forms, labels and inherited
 * text styles around the trigger do not reach the popup. Chromium hit-tests nothing outside the fullscreen element,
 * top-layer popups included, so a popup opened from inside it goes into it; `inFullscreen` says whether the trigger is
 * inside, since each framework reaches its trigger differently. Known limits: the popup then inherits that ancestor
 * chain's styles; the target is chosen only on insertion, so a keepDOM popup inserted before fullscreen stays in the
 * body and cannot be clicked. Upgrade: use the body once Chromium hit-tests top-layer popovers outside fullscreen, or
 * choose the target on every show once keepDOM popups are used inside fullscreen containers.
 */
export function popupTarget(root: Node | undefined, inFullscreen: (fullscreen: HTMLElement) => boolean) {
    const fullscreen = (root as Document | ShadowRoot | undefined)?.fullscreenElement;
    if (fullscreen instanceof HTMLElement && inFullscreen(fullscreen)) {
        return fullscreen;
    }
    return root instanceof ShadowRoot ? root : document.body;
}

export const numbers = {
    MOUSE_ENTER_DELAY: 50,
    MOUSE_LEAVE_DELAY: 50,
    SPACING: 8, // Values are consistent with spacing-tight in scss
    // from an edge arrow's popup corner to its center: $spacing-*_arrow_adjusted_offset-x + $width-*_arrow / 2, and
    // _offset-y + $height-*_arrow_vertical / 2 for a side arrow; the same for Tooltip and Popover
    ARROW_CENTER_INSET: 18,
} as const;
