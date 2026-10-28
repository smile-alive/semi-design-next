import type React from 'react';
import clsx from 'clsx';
import { type strings, cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
import type { PresetsType, PresetType } from '@fibrae/semi-foundation/date-picker/foundation';
import type { DateInputFoundationProps } from '@fibrae/semi-foundation/date-picker/input-foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import Button from '../button/index';
import Typography from '../typography/index';

const prefixCls = cssClasses.PREFIX;
const { Text } = Typography;

export interface QuickControlProps {
    presets?: PresetsType;
    presetPosition?: (typeof strings.PRESET_POSITION_SET)[number];
    onPresetClick?: (preset: PresetType, e: React.MouseEvent) => void;
    type: string;
    insetInput: DateInputFoundationProps['insetInput'];
    locale: any;
}

const noPresets: PresetsType = [];

/** The preset buttons of the DatePicker panel */
export default function QuickControl({ presets = noPresets, onPresetClick = noop, type, presetPosition = 'bottom', insetInput, locale }: QuickControlProps) {
    if (!presets.length) {
        return null;
    }

    const isTypeRange = type === 'dateRange' || type === 'dateTimeRange';
    const isPanelTopAndBottom = presetPosition === 'top' || presetPosition === 'bottom';
    const isTopAndBottomRange = isPanelTopAndBottom && isTypeRange;
    const isTopAndBottomMonth = isPanelTopAndBottom && (type === 'month' || type === 'year');
    const isPlain = !isTopAndBottomRange && !isTopAndBottomMonth;
    const base = `${prefixCls}-quick-control-${presetPosition}`;

    const wrapperCls = clsx(`${prefixCls}-quick-control`, {
        [`${prefixCls}-quick-control-${type}`]: type,
        [base]: true,
    });

    const partCls = (suffix: string) =>
        clsx({
            [`${base}-content${suffix}`]: isPlain,
            [`${base}-range-content${suffix}`]: isTopAndBottomRange,
            [`${base}-month-content${suffix}`]: isTopAndBottomMonth,
        });

    return (
        <div className={wrapperCls} x-insetinput={insetInput ? 'true' : 'false'}>
            {!isPanelTopAndBottom && <div className={`${prefixCls}-quick-control-header`}>{locale.presets}</div>}
            <div className={`${base}-content-wrapper`}>
                <div className={partCls('')}>
                    {presets.map((item, index) => {
                        const preset: PresetType = typeof item === 'function' ? item() : item;
                        return (
                            <Button key={index} type="primary" size="small" onClick={(e) => onPresetClick(preset, e)}>
                                {/* a button holds phrasing content only; Button's flex box blockifies the span */}
                                <span className={partCls('-item')}>
                                    <Text className={partCls('-item-ellipsis')} ellipsis={{ showTooltip: true }}>
                                        {preset.text}
                                    </Text>
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
