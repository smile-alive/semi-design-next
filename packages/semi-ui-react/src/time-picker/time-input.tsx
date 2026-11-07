import type React from 'react';
import { useEffect, useEffectEvent, useRef } from 'react';
import clsx from 'clsx';
import TimeInputFoundation, { type TimeInputAdapter, type TimeInputState } from '@fibrae/semi-foundation/components/time-picker/input-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { IconClock } from '@fibrae/semi-icons-react';
import type { BaseProps } from '../_base/base-component';
import useFoundation from '../_base/use-foundation';
import Input, { type InputHandle } from '../input';
import type { TimePickerProps } from './time-picker';

type Foundation = TimeInputFoundation<TimeInputProps, React.FocusEvent<HTMLDivElement>>;
type Adapter = TimeInputAdapter<TimeInputProps, React.FocusEvent<HTMLDivElement>>;

export type TimeInputProps = Pick<
    TimePickerProps,
    | 'aria-describedby'
    | 'aria-errormessage'
    | 'aria-invalid'
    | 'aria-labelledby'
    | 'aria-required'
    | 'autoFocus'
    | 'borderless'
    | 'clearIcon'
    | 'disabled'
    | 'focusOnOpen'
    | 'id'
    | 'inputReadOnly'
    | 'insetLabel'
    | 'insetLabelId'
    | 'placeholder'
    | 'prefix'
    | 'prefixCls'
    | 'preventScroll'
    | 'showClear'
    | 'size'
    | 'type'
    | 'validateStatus'
    | 'value'
    | 'onFocus'
> &
    BaseProps & {
        'aria-controls'?: React.AriaAttributes['aria-controls'];
        'aria-expanded'?: React.AriaAttributes['aria-expanded'];
        'aria-haspopup'?: React.AriaAttributes['aria-haspopup'];
        'aria-label'?: React.AriaAttributes['aria-label'];
        role?: React.AriaRole;
        invalid?: boolean;
        locale: Locale['TimePicker'];
        name?: string;
        onBlur?: React.FocusEventHandler<HTMLDivElement>;
        onChange?: (value: string) => void;
    };

/** The Input that TimePicker shows as its trigger; keeps the caret in place while the text is re-formatted */
export default function TimeInput(props: TimeInputProps) {
    const { prefixCls, placeholder, inputReadOnly, type, locale, validateStatus, value, invalid, focusOnOpen, onChange, onFocus, onBlur, ...rest } = props;

    const inputRef = useRef<InputHandle>(null);

    const [foundation] = useFoundation<Foundation, Adapter, TimeInputProps, TimeInputState>(
        TimeInputFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyChange: (value) => base.getProps().onChange?.(value),
            notifyFocus: (e) => base.getProps().onFocus?.(e),
            notifyBlur: (e) => base.getProps().onBlur?.(e),
            getInputNode: () => inputRef.current?.input ?? null,
        })
    );

    const inputCls = clsx(`${prefixCls}-input`, {
        [`${prefixCls}-input-invalid`]: invalid,
        [`${prefixCls}-input-readonly`]: inputReadOnly,
    });

    const focusOnMount = useEffectEvent(() => {
        const inputNode = inputRef.current?.input;
        if (props.focusOnOpen && inputNode) {
            inputNode.focus({ preventScroll: props.preventScroll });
            inputNode.select();
        }
    });

    useEffect(() => {
        const frame = requestAnimationFrame(() => focusOnMount());
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div className={`${prefixCls}-input-wrap`}>
            <Input
                {...rest}
                ref={inputRef}
                className={inputCls}
                placeholder={placeholder || locale.placeholder[type]}
                readOnly={Boolean(inputReadOnly)}
                value={value as string}
                // the host's own values are forwarded; global Input defaults must not add the rest
                addonAfter={null}
                addonBefore={null}
                hideSuffix
                insetLabel={rest.insetLabel ?? null}
                validateStatus={invalid ? 'error' : validateStatus}
                prefix={rest.prefix ?? null}
                suffix={<IconClock />}
                onBlur={foundation.handleBlur}
                onChange={foundation.handleChange}
                onFocus={foundation.handleFocus}
            />
        </div>
    );
}
