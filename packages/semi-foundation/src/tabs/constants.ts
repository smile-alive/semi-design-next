import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    TABS: `${BASE_CLASS_PREFIX}-tabs`,
    TABS_BAR: `${BASE_CLASS_PREFIX}-tabs-bar`,
    TABS_BAR_LINE: `${BASE_CLASS_PREFIX}-tabs-bar-line`,
    TABS_BAR_CARD: `${BASE_CLASS_PREFIX}-tabs-bar-card`,
    TABS_BAR_BUTTON: `${BASE_CLASS_PREFIX}-tabs-bar-button`,
    TABS_BAR_SLASH: `${BASE_CLASS_PREFIX}-tabs-bar-slash`,
    TABS_BAR_EXTRA: `${BASE_CLASS_PREFIX}-tabs-bar-extra`,
    TABS_TAB: `${BASE_CLASS_PREFIX}-tabs-tab`,
    TABS_TAB_ACTIVE: `${BASE_CLASS_PREFIX}-tabs-tab-active`,
    TABS_TAB_DISABLED: `${BASE_CLASS_PREFIX}-tabs-tab-disabled`,
    TABS_CONTENT: `${BASE_CLASS_PREFIX}-tabs-content`,
    TABS_PANE: `${BASE_CLASS_PREFIX}-tabs-pane`,
    TABS_PANE_INACTIVE: `${BASE_CLASS_PREFIX}-tabs-pane-inactive`,
    TABS_PANE_ACTIVE: `${BASE_CLASS_PREFIX}-tabs-pane-active`,
    TABS_PANE_MOTION_OVERLAY: `${BASE_CLASS_PREFIX}-tabs-pane-motion-overlay`,
    TABS_PANE_ANIMATE_LEFT_SHOW: `${BASE_CLASS_PREFIX}-tabs-pane-animate-leftShow`,
    TABS_PANE_ANIMATE_RIGHT_SHOW: `${BASE_CLASS_PREFIX}-tabs-pane-animate-rightShow`,
    TABS_PANE_ANIMATE_TOP_SHOW: `${BASE_CLASS_PREFIX}-tabs-pane-animate-topShow`,
    TABS_PANE_ANIMATE_BOTTOM_SHOW: `${BASE_CLASS_PREFIX}-tabs-pane-animate-bottomShow`,
};

/** Prefix of the data-tabkey attribute, which the keyboard handler uses to find sibling tabs */
export const TAB_DATA_KEY_PREFIX = 'semiTab';

export function getTabDataKey(itemKey: string) {
    return `${TAB_DATA_KEY_PREFIX}${itemKey}`;
}

export function getBarItemKey(itemKey: string) {
    return `${itemKey}-bar`;
}

export function getItemKeyByBarItemKey(barItemKey: string) {
    return barItemKey.replace(/-bar$/, '');
}

// itemKey is user text: encoded so that a space does not split the id into several IDREFs in aria-controls and
// aria-labelledby
export const getTabId = (tabsId: string, itemKey: string) => `${tabsId}-tab-${encodeURIComponent(itemKey)}`;

export const getPanelId = (tabsId: string, itemKey: string) => `${tabsId}-panel-${encodeURIComponent(itemKey)}`;
