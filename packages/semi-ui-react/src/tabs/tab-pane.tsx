import { memo, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/tabs/constants';
import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
import CSSAnimation from '../_css-animation';
import { getPanelId, getTabId } from './ids';
import type { TabPaneProps } from './interface';
import { useTabsContext } from './tabs-context';

function TabPane({ ref, className, style, children, itemKey, tabIndex, disabled, icon, tab, closable, ...rest }: TabPaneProps) {
    const { activeKey, lazyRender, panes, tabPaneMotion: motion, tabPosition, prevActiveKey, forceDisableMotion, tabsId } = useTabsContext();

    const active = activeKey === itemKey;

    const [activated, setActivated] = useState(active);

    if (active && !activated) {
        setActivated(true);
    }

    const shouldRender = lazyRender ? activated || active : true;

    const { startClassName, hasMotion } = TabsFoundation.getPaneMotion({
        itemKey,
        activeKey,
        prevActiveKey,
        paneKeys: panes.map((pane) => pane.itemKey),
        tabPosition,
        tabPaneMotion: motion,
        forceDisableMotion,
    });

    return (
        <div
            {...rest}
            ref={ref}
            id={getPanelId(tabsId, itemKey)}
            className={clsx(className, {
                [cssClasses.TABS_PANE_INACTIVE]: !active,
                [cssClasses.TABS_PANE_ACTIVE]: active,
                [cssClasses.TABS_PANE]: true,
            })}
            style={style}
            aria-hidden={active ? 'false' : 'true'}
            aria-labelledby={getTabId(tabsId, itemKey)}
            role="tabpanel"
            tabIndex={tabIndex ? tabIndex : 0}
            x-semi-prop="children"
        >
            <CSSAnimation startClassName={startClassName} animationState={active ? 'enter' : 'leave'} motion={hasMotion}>
                {({ animationClassName, animationEventsNeedBind }) => (
                    <div className={clsx(cssClasses.TABS_PANE_MOTION_OVERLAY, animationClassName)} x-semi-prop="children" {...animationEventsNeedBind}>
                        {shouldRender && children}
                    </div>
                )}
            </CSSAnimation>
        </div>
    );
}

// memo keeps the PureComponent behaviour
export default Object.assign(memo(TabPane), { elementType: 'Tabs.TabPane' });
