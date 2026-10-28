import { Show } from 'solid-js';
import type { InsetInputChangeFoundationProps, InsetInputValue, Type } from '@fibrae/semi-foundation/date-picker/input-foundation';
import Input from '../input';

interface InsetInputBaseProps extends Pick<InsetInputChangeFoundationProps, 'panel'> {
    insetInputValue: InsetInputValue;
    placeholder: string;
    'aria-label': string;
    onChange: (options: InsetInputChangeFoundationProps) => void;
    onFocus?: (e: FocusEvent) => void;
}

export interface InsetDateInputProps extends InsetInputBaseProps {
    /** The native input */
    inputRef?: (element: HTMLInputElement) => void;
}

export interface InsetTimeInputProps extends InsetInputBaseProps {
    disabled: boolean;
    type: Type;
}

export function InsetDateInput(props: InsetDateInputProps) {
    return (
        <Input
            inputRef={props.inputRef}
            aria-label={props['aria-label']}
            placeholder={props.placeholder}
            value={props.insetInputValue[props.panel].dateInput}
            // global Input defaults must not add a clear button or adornments to the panel's fields
            addonAfter={null}
            addonBefore={null}
            insetLabel={null}
            showClear={false}
            prefix={null}
            suffix={null}
            onChange={(value, event) => props.onChange({ value, event, insetInputValue: props.insetInputValue, panel: props.panel, field: 'dateInput' })}
            onFocus={(e) => props.onFocus?.(e)}
        />
    );
}

export function InsetTimeInput(props: InsetTimeInputProps) {
    return (
        <Show when={props.type.includes('Time')}>
            <Input
                aria-label={props['aria-label']}
                disabled={props.disabled}
                placeholder={props.placeholder}
                value={props.insetInputValue[props.panel].timeInput}
                addonAfter={null}
                addonBefore={null}
                insetLabel={null}
                showClear={false}
                prefix={null}
                suffix={null}
                onChange={(value, event) => props.onChange({ value, event, insetInputValue: props.insetInputValue, panel: props.panel, field: 'timeInput' })}
                onFocus={(e) => props.onFocus?.(e)}
            />
        </Show>
    );
}
