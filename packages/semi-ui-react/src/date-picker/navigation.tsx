import type React from 'react';
import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
import type { PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconChevronLeft, IconChevronRight, IconDoubleChevronLeft, IconDoubleChevronRight } from '@fibrae/semi-icons-react';
import Button from '../button';
import IconButton from '../icon-button';

const prefixCls = cssClasses.NAVIGATION;

interface NavigationProps {
    monthText?: string;
    /** on the month button, whose text names the month grid */
    titleId?: string;
    density?: string;
    onMonthClick?: (e: React.MouseEvent) => void;
    onNextMonth?: () => void;
    onPrevMonth?: () => void;
    onNextYear?: () => void;
    onPrevYear?: () => void;
    shouldBimonthSwitch?: boolean;
    panelType?: PanelType;
    locale: Locale['DatePicker'];
}

/** The year and month switch buttons above a month panel */
export default function Navigation({ monthText = '', titleId, onMonthClick = noop, onNextMonth = noop, onPrevMonth = noop, onPrevYear = noop, onNextYear = noop, density, shouldBimonthSwitch, panelType, locale }: NavigationProps) {
    const btnTheme = 'borderless';
    const iconBtnSize = density === 'compact' ? 'default' : 'large';
    const buttonSize = density === 'compact' ? 'small' : 'default';

    // hidden, not removed, so the remaining icons keep their position
    const leftButtonStyle: React.CSSProperties = shouldBimonthSwitch && panelType === strings.PANEL_TYPE_RIGHT ? { visibility: 'hidden' } : {};
    const rightButtonStyle: React.CSSProperties = shouldBimonthSwitch && panelType === strings.PANEL_TYPE_LEFT ? { visibility: 'hidden' } : {};

    return (
        <div className={prefixCls}>
            <IconButton key="double-chevron-left" style={leftButtonStyle} aria-label={locale.prevYear} noHorizontalPadding size={buttonSize} theme={btnTheme} icon={<IconDoubleChevronLeft size={iconBtnSize} />} onClick={onPrevYear} />
            <IconButton key="chevron-left" style={leftButtonStyle} aria-label={locale.prevMonth} noHorizontalPadding size={buttonSize} theme={btnTheme} icon={<IconChevronLeft size={iconBtnSize} />} onClick={onPrevMonth} />
            <div className={`${prefixCls}-month`}>
                <Button id={titleId} size={buttonSize} theme={btnTheme} onClick={onMonthClick}>
                    <span>{monthText}</span>
                </Button>
            </div>
            <IconButton key="chevron-right" style={rightButtonStyle} aria-label={locale.nextMonth} noHorizontalPadding size={buttonSize} theme={btnTheme} icon={<IconChevronRight size={iconBtnSize} />} onClick={onNextMonth} />
            <IconButton key="double-chevron-right" style={rightButtonStyle} aria-label={locale.nextYear} noHorizontalPadding size={buttonSize} theme={btnTheme} icon={<IconDoubleChevronRight size={iconBtnSize} />} onClick={onNextYear} />
        </div>
    );
}
