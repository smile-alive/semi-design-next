import { For, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
import type { PresetPosition, PresetsType, PresetType } from '@fibrae/semi-foundation/date-picker/foundation';
import type { DateInputFoundationProps } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import Button from '../button';
import Text from '../typography/text';

const prefixCls = cssClasses.PREFIX;

export interface QuickControlProps {
    presets?: PresetsType;
    presetPosition?: PresetPosition;
    onPresetClick?: (preset: PresetType, e: MouseEvent) => void;
    type: string;
    insetInput: DateInputFoundationProps['insetInput'];
    locale: Locale['DatePicker'];
}

/** The preset buttons of the DatePicker panel */
export default function QuickControl(props: QuickControlProps) {
    const position = () => props.presetPosition ?? 'bottom';

    const isPanelTopAndBottom = () => position() === 'top' || position() === 'bottom';

    const isTopAndBottomRange = () => isPanelTopAndBottom() && (props.type === 'dateRange' || props.type === 'dateTimeRange');

    const isTopAndBottomMonth = () => isPanelTopAndBottom() && (props.type === 'month' || props.type === 'year');

    const isPlain = () => !isTopAndBottomRange() && !isTopAndBottomMonth();

    const base = () => `${prefixCls}-quick-control-${position()}`;

    const partCls = (suffix: string) =>
        clsx({
            [`${base()}-content${suffix}`]: isPlain(),
            [`${base()}-range-content${suffix}`]: isTopAndBottomRange(),
            [`${base()}-month-content${suffix}`]: isTopAndBottomMonth(),
        });

    return (
        <Show when={props.presets?.length}>
            <div class={clsx(`${prefixCls}-quick-control`, base(), { [`${prefixCls}-quick-control-${props.type}`]: props.type })} x-insetinput={props.insetInput ? 'true' : 'false'}>
                <Show when={!isPanelTopAndBottom()}>
                    <div class={`${prefixCls}-quick-control-header`}>{props.locale.presets}</div>
                </Show>
                <div class={`${base()}-content-wrapper`}>
                    <div class={partCls('')}>
                        <For each={props.presets}>
                            {(item) => {
                                const preset = () => (typeof item === 'function' ? item() : item);
                                return (
                                    <Button type="primary" size="small" onClick={(e) => props.onPresetClick?.(preset(), e)}>
                                        {/* a button holds phrasing content only; Button's flex box blockifies the span */}
                                        <span class={partCls('-item')}>
                                            <Text class={partCls('-item-ellipsis')} ellipsis={{ showTooltip: true }}>
                                                {preset().text}
                                            </Text>
                                        </span>
                                    </Button>
                                );
                            }}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
}
