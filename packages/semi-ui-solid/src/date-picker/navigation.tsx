import type { JSX } from 'solid-js';
import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
import type { PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { IconChevronLeft, IconChevronRight, IconDoubleChevronLeft, IconDoubleChevronRight } from '@fibrae/semi-icons-solid';
import Button from '../button';
import IconButton from '../icon-button';

const prefixCls = cssClasses.NAVIGATION;

interface NavigationProps {
    monthText?: string;
    /** On the month button, whose text names the month grid */
    titleId?: string;
    density?: string;
    onMonthClick?: () => void;
    onNextMonth?: () => void;
    onPrevMonth?: () => void;
    onNextYear?: () => void;
    onPrevYear?: () => void;
    shouldBimonthSwitch?: boolean;
    panelType?: PanelType;
    locale: Locale['DatePicker'];
}

/** The year and month switch buttons above a month panel */
export default function Navigation(props: NavigationProps) {
    const iconSize = () => (props.density === 'compact' ? 'default' : 'large');

    const buttonSize = () => (props.density === 'compact' ? 'small' : 'default');

    // hidden, not removed, so the remaining icons keep their position
    const hiddenOn = (panelType: PanelType): JSX.CSSProperties | undefined => (props.shouldBimonthSwitch && props.panelType === panelType ? { visibility: 'hidden' } : undefined);

    return (
        <div class={prefixCls}>
            <IconButton style={hiddenOn(strings.PANEL_TYPE_RIGHT)} aria-label={props.locale.prevYear} noHorizontalPadding size={buttonSize()} theme="borderless" icon={<IconDoubleChevronLeft size={iconSize()} />} onClick={() => props.onPrevYear?.()} />
            <IconButton style={hiddenOn(strings.PANEL_TYPE_RIGHT)} aria-label={props.locale.prevMonth} noHorizontalPadding size={buttonSize()} theme="borderless" icon={<IconChevronLeft size={iconSize()} />} onClick={() => props.onPrevMonth?.()} />
            <div class={`${prefixCls}-month`}>
                <Button id={props.titleId} size={buttonSize()} theme="borderless" onClick={() => props.onMonthClick?.()}>
                    <span>{props.monthText ?? ''}</span>
                </Button>
            </div>
            <IconButton style={hiddenOn(strings.PANEL_TYPE_LEFT)} aria-label={props.locale.nextMonth} noHorizontalPadding size={buttonSize()} theme="borderless" icon={<IconChevronRight size={iconSize()} />} onClick={() => props.onNextMonth?.()} />
            <IconButton style={hiddenOn(strings.PANEL_TYPE_LEFT)} aria-label={props.locale.nextYear} noHorizontalPadding size={buttonSize()} theme="borderless" icon={<IconDoubleChevronRight size={iconSize()} />} onClick={() => props.onNextYear?.()} />
        </div>
    );
}
