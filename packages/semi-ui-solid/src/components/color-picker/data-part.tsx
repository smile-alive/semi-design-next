import { Show } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/components/color-picker/data-part-foundation';
import type { ColorFormat } from '@fibrae/semi-foundation/components/color-picker/interface';
import { IconEyedropper } from '@fibrae/semi-icons-solid';
import useFoundation from '../../base/use-foundation';
import Button from '../button';
import Input, { InputGroup } from '../input';
import InputNumber from '../input-number';
import { useLocale } from '../locale';
import Select from '../select';

export type DataPartProps = DataPartBaseProps;

type Foundation = DataPartFoundation<DataPartBaseProps>;
type Adapter = DataPartAdapter<DataPartBaseProps>;

const FORMAT_OPTIONS = (['hex', 'rgba', 'hsva'] as const).map((format) => ({ label: format, value: format }));

export default function DataPart(props: DataPartProps) {
    const locale = useLocale('ColorPicker');

    const { foundation, state } = useFoundation<Foundation, Adapter, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        (initial) => DataPartFoundation.getInitialState(initial),
        () => ({
            notifyChange: (color, format) => props.onChange(color, format),
            notifyAlphaChange: (alpha) => props.onAlphaChange(alpha),
        })
    );

    const demoColor = () => {
        const { r, g, b, a } = props.currentColor.rgba;
        return `rgba(${r},${g},${b},${a})`;
    };

    return (
        <div class={`${cssClasses.PREFIX}-dataPart`} style={{ width: `${props.width}px` }}>
            <div class={`${cssClasses.PREFIX}-colorDemoBlock`} style={{ 'min-width': '20px', 'min-height': '20px', 'background-color': demoColor() }} />
            <InputGroup class={`${cssClasses.PREFIX}-inputGroup`} size="small">
                <Input
                    class={`${cssClasses.PREFIX}-colorPickerInput`}
                    aria-label={locale().locale.color}
                    value={state().inputValue}
                    // the inputs share one compact group: the adornments and showClear are set so global Input and
                    // InputNumber defaults cannot add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    onChange={foundation.handleInputValueChange}
                />
                <Show when={props.alpha}>
                    <InputNumber
                        class={`${cssClasses.PREFIX}-colorPickerInputNumber`}
                        aria-label={locale().locale.alpha}
                        max={100}
                        min={0}
                        value={Math.round(props.currentColor.rgba.a * 100)}
                        addonAfter={null}
                        addonBefore={null}
                        hideButtons
                        insetLabel={null}
                        showClear={false}
                        prefix={null}
                        suffix={<span class={`${cssClasses.PREFIX}-inputNumberSuffix`}>%</span>}
                        onNumberChange={foundation.handleAlphaInputChange}
                    />
                </Show>
                <Select
                    class={`${cssClasses.PREFIX}-formatSelect`}
                    aria-label={locale().locale.format}
                    value={state().format}
                    optionList={FORMAT_OPTIONS}
                    size="small"
                    // a fixed list of three formats: global Select defaults must not make it search, create or multiple, nor add a clear button or adornments
                    allowCreate={false}
                    filter={false}
                    insetLabel={null}
                    multiple={false}
                    prefix={null}
                    showClear={false}
                    suffix={null}
                    onSelect={(format) => foundation.handleFormatChange(format as ColorFormat)}
                />
            </InputGroup>
            <Show when={props.eyeDropper}>
                <Button type="tertiary" aria-label={locale().locale.eyeDropper} size="small" theme="light" icon={<IconEyedropper />} onClick={foundation.handlePickValueWithStraw} />
            </Show>
        </div>
    );
}
