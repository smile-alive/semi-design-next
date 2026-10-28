import { Show, batch, createMemo } from 'solid-js';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/color-picker/data-part-foundation';
import type { ColorFormat } from '@fibrae/semi-foundation/color-picker/interface';
import { IconEyedropper } from '@fibrae/semi-icons-solid';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
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
        (initial) => ({
            format: initial.defaultFormat,
            inputValue: DataPartFoundation.getInputValue(initial.currentColor, initial.defaultFormat),
        }),
        () => ({})
    );

    // an equal color object, such as a fresh controlled value, must not rewrite what is being typed
    const currentColor = createMemo(() => props.currentColor, undefined, { equals: isEqual });

    const demoColor = () => {
        const { r, g, b, a } = currentColor().rgba;
        return `rgba(${r},${g},${b},${a})`;
    };

    // one commit: the sync effect must see the typed text, or it rewrites it with the canonical text of its own color
    const handleTextChange = (text: string) =>
        batch(() => {
            const value = foundation.getValueByInputValue(text);
            if (value) {
                props.foundation.handleChange(value, state().format);
            }
            foundation.handleInputValueChange(text);
        });

    // the color the typed text produced must not rewrite the input, or its canonical text erases the next keystrokes
    useWatch(currentColor, (color) => {
        if (!foundation.isInputValueOf(color)) {
            foundation.syncInputValue();
        }
    });

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
                    onChange={handleTextChange}
                />
                <Show when={props.alpha}>
                    <InputNumber
                        class={`${cssClasses.PREFIX}-colorPickerInputNumber`}
                        aria-label={locale().locale.alpha}
                        max={100}
                        min={0}
                        value={Math.round(currentColor().rgba.a * 100)}
                        addonAfter={null}
                        addonBefore={null}
                        hideButtons
                        insetLabel={null}
                        showClear={false}
                        prefix={null}
                        suffix={<span class={`${cssClasses.PREFIX}-inputNumberSuffix`}>%</span>}
                        onNumberChange={(percent) => props.foundation.handleAlphaChangeByHandle({ a: Number((percent / 100).toFixed(2)) })}
                    />
                </Show>
                <Select class={`${cssClasses.PREFIX}-formatSelect`} aria-label={locale().locale.format} value={state().format} optionList={FORMAT_OPTIONS} size="small" onSelect={(format) => foundation.handleFormatChange(format as ColorFormat)} />
            </InputGroup>
            <Show when={props.eyeDropper}>
                <Button type="tertiary" aria-label={locale().locale.eyeDropper} size="small" theme="light" icon={<IconEyedropper />} onClick={foundation.handlePickValueWithStraw} />
            </Show>
        </div>
    );
}
