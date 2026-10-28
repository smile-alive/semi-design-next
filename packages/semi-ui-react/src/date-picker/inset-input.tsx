import type { InsetInputValue, Type, InsetInputChangeFoundationProps } from '@fibrae/semi-foundation/date-picker/input-foundation';
import Input, { type InputProps } from '../input';

export interface InsetDateInputProps extends Pick<InsetInputChangeFoundationProps, 'panel'> {
    ref: InputProps['ref'];
    insetInputValue: InsetInputValue;
    placeholder: string;
    'aria-label': string;
    onChange: (options: InsetInputChangeFoundationProps) => void;
    onFocus: InputProps['onFocus'];
}

export interface InsetTimeInputProps extends Pick<InsetInputChangeFoundationProps, 'panel'> {
    disabled: boolean;
    insetInputValue: InsetInputValue;
    placeholder: string;
    'aria-label': string;
    type: Type;
    onChange: (options: InsetInputChangeFoundationProps) => void;
    onFocus: InputProps['onFocus'];
}

export function InsetDateInput({ insetInputValue, panel, onFocus, onChange, placeholder, ref, 'aria-label': ariaLabel }: InsetDateInputProps) {
    return (
        <Input
            ref={ref}
            aria-label={ariaLabel}
            placeholder={placeholder}
            value={insetInputValue[panel].dateInput}
            // global Input defaults must not add a clear button or adornments to the panel's fields
            addonAfter={null}
            addonBefore={null}
            insetLabel={null}
            showClear={false}
            prefix={null}
            suffix={null}
            onChange={(value, event) => {
                onChange({
                    value,
                    event,
                    insetInputValue,
                    panel,
                    field: 'dateInput',
                });
            }}
            onFocus={onFocus}
        />
    );
}

export function InsetTimeInput({ insetInputValue, panel, type, onFocus, onChange, placeholder, disabled, 'aria-label': ariaLabel }: InsetTimeInputProps) {
    const _isTimeType = type.includes('Time');

    if (!_isTimeType) {
        return null;
    }

    return (
        <Input
            aria-label={ariaLabel}
            disabled={disabled}
            placeholder={placeholder}
            value={insetInputValue[panel].timeInput}
            addonAfter={null}
            addonBefore={null}
            insetLabel={null}
            showClear={false}
            prefix={null}
            suffix={null}
            onChange={(value, event) => {
                onChange({
                    value,
                    event,
                    insetInputValue,
                    panel,
                    field: 'timeInput',
                });
            }}
            onFocus={onFocus}
        />
    );
}
