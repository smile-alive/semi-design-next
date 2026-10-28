import React from 'react';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { cssClasses } from '@fibrae/semi-foundation/navigation/constants';
import { IconSidebar } from '@fibrae/semi-icons-react';
import Button, { type ButtonProps } from '../button';
import Tooltip from '../tooltip';

export interface CollapseButtonProps {
    locale?: Locale['Navigation'];
    collapseText?(isCollapsed: boolean): React.ReactNode;
    isCollapsed?: boolean;
    onClick?(nextCollapsed: boolean): void;
}

export default function CollapseButton({ locale, collapseText, isCollapsed, onClick }: CollapseButtonProps) {
    let finalCollapseText: React.ReactNode = isCollapsed ? locale?.expandText : locale?.collapseText;

    const btnProps = {
        icon: <IconSidebar />,
        type: 'tertiary',
        theme: 'borderless',
        onClick: () => onClick?.(!isCollapsed),
    } satisfies ButtonProps;

    if (typeof collapseText === 'function') {
        finalCollapseText = collapseText(isCollapsed);
    }

    // One element tree for both states: swapping the wrapper would remount the button and drop the focus it holds
    return (
        <div className={`${cssClasses.PREFIX}-collapse-btn`}>
            <Tooltip condition={isCollapsed} content={finalCollapseText} position="right">
                <Button {...btnProps} aria-label={isCollapsed ? (typeof finalCollapseText === 'string' ? finalCollapseText : locale?.expandText) : undefined}>
                    {isCollapsed ? undefined : finalCollapseText}
                </Button>
            </Tooltip>
        </div>
    );
}
