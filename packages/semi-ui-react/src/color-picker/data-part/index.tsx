import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/color-picker/data-part-foundation';
import type { ColorFormat, HsvaColor, RgbaColor } from '@fibrae/semi-foundation/color-picker/interface';
import { IconEyedropper } from '@fibrae/semi-icons-react';
import useDidUpdate from '../../_base/use-did-update';
import useFoundation from '../../_base/use-foundation';
import Button from '../../button';
import Input from '../../input';
import InputNumber from '../../input-number';
import InputGroup from '../../input/input-group';
import useLocale from '../../locale/use-locale';
import Select from '../../select';

export interface DataPartProps extends DataPartBaseProps {}

export default function DataPart(props: DataPartProps) {
    const { currentColor, width, alpha, eyeDropper } = props;

    const { locale } = useLocale('ColorPicker');

    const [foundation, state] = useFoundation<DataPartFoundation<DataPartBaseProps>, DataPartAdapter<DataPartBaseProps>, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        () => ({
            format: props.defaultFormat,
            inputValue: DataPartFoundation.getInputValue(props.currentColor, props.defaultFormat),
        }),
        () => ({})
    );

    const { format } = state;
    const rgba = currentColor.rgba;

    const handleChange = (newColor: RgbaColor | HsvaColor | string) => {
        props.foundation.handleChange(newColor, format);
    };

    // the color the typed text produced must not rewrite the input, or its canonical text erases the next keystrokes
    useDidUpdate(props.currentColor, (currentColor, previous) => {
        if (!isEqual(currentColor, previous) && !foundation.isInputValueOf(currentColor)) {
            foundation.syncInputValue();
        }
    });

    return (
        <div className={`${cssClasses.PREFIX}-dataPart`} style={{ width }}>
            <div
                className={`${cssClasses.PREFIX}-colorDemoBlock`}
                style={{
                    minWidth: 20,
                    minHeight: 20,
                    backgroundColor: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`,
                }}
            />
            <InputGroup className={`${cssClasses.PREFIX}-inputGroup`} size="small">
                <Input
                    className={`${cssClasses.PREFIX}-colorPickerInput`}
                    aria-label={locale.color}
                    value={state.inputValue}
                    // the inputs share one compact group: the adornments and showClear are set so global Input and
                    // InputNumber defaults cannot add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    onChange={(v) => {
                        const value = foundation.getValueByInputValue(v);
                        if (value) {
                            handleChange(value);
                        }
                        foundation.handleInputValueChange(v);
                    }}
                />
                {alpha && (
                    <InputNumber
                        className={`${cssClasses.PREFIX}-colorPickerInputNumber`}
                        aria-label={locale.alpha}
                        max={100}
                        min={0}
                        value={Number(Math.round(rgba.a * 100))}
                        addonAfter={null}
                        addonBefore={null}
                        hideButtons
                        insetLabel={null}
                        showClear={false}
                        prefix={null}
                        suffix={<span className={`${cssClasses.PREFIX}-inputNumberSuffix`}>%</span>}
                        onNumberChange={(v) => props.foundation.handleAlphaChangeByHandle({ a: Number((v / 100).toFixed(2)) })}
                    />
                )}
                <Select className={`${cssClasses.PREFIX}-formatSelect`} aria-label={locale.format} value={format} optionList={['hex', 'rgba', 'hsva'].map((type) => ({ label: type, value: type }))} size="small" onSelect={(v) => foundation.handleFormatChange(v as ColorFormat)} />
            </InputGroup>

            {eyeDropper && <Button type="tertiary" aria-label={locale.eyeDropper} size="small" theme="light" icon={<IconEyedropper />} onClick={foundation.handlePickValueWithStraw} />}
        </div>
    );
}
