import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
import DataPartFoundation, { type DataPartAdapter, type DataPartBaseProps, type DataPartBaseState } from '@fibrae/semi-foundation/components/color-picker/data-part-foundation';
import type { ColorFormat } from '@fibrae/semi-foundation/components/color-picker/interface';
import { IconEyedropper } from '@fibrae/semi-icons-react';
import useFoundation from '../../base/use-foundation';
import Button from '../button';
import Input from '../input';
import InputNumber from '../input-number';
import InputGroup from '../input/input-group';
import useLocale from '../locale/use-locale';
import Select from '../select';

type Foundation = DataPartFoundation<DataPartBaseProps>;
type Adapter = DataPartAdapter<DataPartBaseProps>;

export interface DataPartProps extends DataPartBaseProps {}

export default function DataPart(props: DataPartProps) {
    const { currentColor, width, alpha, eyeDropper } = props;

    const { locale } = useLocale('ColorPicker');

    const [foundation, state] = useFoundation<Foundation, Adapter, DataPartBaseProps, DataPartBaseState>(
        DataPartFoundation,
        props,
        () => DataPartFoundation.getInitialState(props),
        (base) => ({
            notifyChange: (color, format) => base.getProps().onChange(color, format),
            notifyAlphaChange: (alpha) => base.getProps().onAlphaChange(alpha),
        })
    );

    const { format } = state;
    const rgba = currentColor.rgba;

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
                    onChange={foundation.handleInputValueChange}
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
                        onNumberChange={foundation.handleAlphaInputChange}
                    />
                )}
                <Select
                    className={`${cssClasses.PREFIX}-formatSelect`}
                    aria-label={locale.format}
                    multiple={false}
                    value={format}
                    // a fixed list of three formats: global Select defaults must not make it search, create or multiple, nor add a clear button or adornments
                    allowCreate={false}
                    filter={false}
                    insetLabel={null}
                    optionList={['hex', 'rgba', 'hsva'].map((type) => ({ label: type, value: type }))}
                    showClear={false}
                    size="small"
                    prefix={null}
                    suffix={null}
                    onSelect={(v) => foundation.handleFormatChange(v as ColorFormat)}
                />
            </InputGroup>

            {eyeDropper && <Button type="tertiary" aria-label={locale.eyeDropper} size="small" theme="light" icon={<IconEyedropper />} onClick={foundation.handlePickValueWithStraw} />}
        </div>
    );
}
