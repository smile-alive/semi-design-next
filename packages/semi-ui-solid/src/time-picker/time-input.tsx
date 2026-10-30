import { onMount, splitProps } from 'solid-js';
import clsx from 'clsx';
import TimeInputFoundation, { type TimeInputAdapter } from '@fibrae/semi-foundation/time-picker/input-foundation';
import { IconClock } from '@fibrae/semi-icons-solid';
import useFoundation from '../_base/use-foundation';
import useRaf from '../_base/use-raf';
import useWatch from '../_base/use-watch';
import Input, { type InputProps } from '../input';

export interface TimeInputProps extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'readOnly' | 'readonly'> {
    prefixCls: string;
    value?: string;
    invalid?: boolean;
    /** Locks typing only; the clear button stays */
    inputReadOnly?: boolean;
    /** Focuses and selects the text once mounted */
    focusOnOpen?: boolean;
    onChange?: (value: string) => void;
}

type Foundation = TimeInputFoundation<TimeInputProps, Record<string, never>, FocusEvent>;
type Adapter = TimeInputAdapter<TimeInputProps, Record<string, never>, FocusEvent>;

/** The Input that TimePicker shows as its trigger; keeps the caret in place while the text is re-formatted */
export default function TimeInput(props: TimeInputProps) {
    const [local, rest] = splitProps(props, ['prefixCls', 'inputReadOnly', 'validateStatus', 'value', 'invalid', 'focusOnOpen', 'onChange', 'onFocus', 'onBlur', 'inputRef', 'prefix', 'insetLabel']);

    let input: HTMLInputElement | undefined;

    const { foundation } = useFoundation<Foundation, Adapter, TimeInputProps, Record<string, never>>(
        TimeInputFoundation,
        props,
        () => ({}),
        () => ({
            notifyChange: (value) => props.onChange?.(value),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyBlur: (e) => props.onBlur?.(e),
            getInputNode: () => input ?? null,
        })
    );

    const setInput = (node: HTMLInputElement) => {
        input = node;
        local.inputRef?.(node);
    };

    // Input writes the new text in a render effect, which runs before this one
    useWatch(() => local.value, foundation.restoreCursor);

    const requestFrame = useRaf();

    onMount(() => {
        requestFrame(() => {
            if (local.focusOnOpen && input) {
                input.focus({ preventScroll: props.preventScroll });
                input.select();
            }
        });
    });

    return (
        <div class={`${local.prefixCls}-input-wrap`}>
            <Input
                {...rest}
                inputRef={setInput}
                class={clsx(`${local.prefixCls}-input`, {
                    [`${local.prefixCls}-input-invalid`]: local.invalid,
                    [`${local.prefixCls}-input-readonly`]: local.inputReadOnly,
                })}
                readOnly={Boolean(local.inputReadOnly)}
                value={local.value}
                // the host's own values are forwarded; global Input defaults must not add the rest
                addonAfter={null}
                addonBefore={null}
                hideSuffix
                insetLabel={local.insetLabel ?? null}
                prefix={local.prefix ?? null}
                suffix={<IconClock />}
                validateStatus={local.invalid ? 'error' : local.validateStatus}
                onBlur={foundation.handleBlur}
                onChange={foundation.handleChange}
                onFocus={foundation.handleFocus}
            />
        </div>
    );
}
