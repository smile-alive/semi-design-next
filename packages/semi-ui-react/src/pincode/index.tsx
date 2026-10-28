import type React from 'react';
import { useImperativeHandle, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/pincode/constants';
import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps, type PinCodeBaseState } from '@fibrae/semi-foundation/pincode/foundation';
import '@fibrae/semi-foundation/pincode/pincode.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import Input, { type InputProps, type InputHandle } from '../input';
import useLocale from '../locale/use-locale';

export interface PinCodeHandle {
    /** Focuses the input at `index` (0-based) with the caret after its character */
    focus: (index: number) => void;
    blur: (index: number) => void;
}

export interface PinCodeProps extends PinCodeBaseProps, ElementProps<'div', 'defaultValue' | 'onChange'> {
    className?: string;
    style?: React.CSSProperties;
    size?: InputProps['size'];
    ref?: React.Ref<PinCodeHandle>;
    /** Injected by Form; shown on every input */
    validateStatus?: InputProps['validateStatus'];
}

export interface PinCodeState extends PinCodeBaseState {}

const defaultProps = {
    count: 6,
    format: 'number',
    autoFocus: false,
} satisfies Partial<PinCodeProps>;

export default function PinCode(rawProps: PinCodeProps) {
    const props = useDefaultProps('PinCode', rawProps, defaultProps);

    const {
        ref,
        className,
        style,
        size,
        disabled,
        value,
        defaultValue,
        format,
        count,
        autoFocus,
        onChange,
        onComplete,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        // a Tooltip's tabIndex on the wrapper would add an extra tab stop
        tabIndex,
        // Form's id goes on the first input so that clicking the label focuses it
        id,
        validateStatus,
        // injected by Form; not DOM attributes, no single input can carry the name
        insetLabel,
        insetLabelId,
        name,
        onBlur,
        ...rest
    } = props as PinCodeProps &
        React.AriaAttributes & {
            onBlur?: React.FocusEventHandler<HTMLDivElement>;
            tabIndex?: number;
            id?: string;
            insetLabel?: unknown;
            insetLabelId?: unknown;
            name?: unknown;
        };

    const { locale } = useLocale('PinCode');

    const [inputs] = useState<InputHandle[]>(() => []);

    const [foundation, state] = useFoundation<PinCodeFoundation<PinCodeProps, PinCodeState>, PinCodeAdapter<PinCodeProps, PinCodeState>, PinCodeProps, PinCodeState>(
        PinCodeFoundation,
        props,
        () => ({ valueList: Array.from(props.value ?? props.defaultValue ?? ''), currentActiveIndex: 0 }),
        (base) => ({
            // resolves after commit: a controlled paste awaits the parent's new value
            onCurrentActiveIndexChange: (currentActiveIndex) => new Promise<void>((resolve) => base.setState({ currentActiveIndex }, resolve)),
            notifyValueChange: (values) => base.getProps().onChange?.(values.join('')),
            notifyComplete: (value) => base.getProps().onComplete?.(value),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputs[index]?.focus();
                } else {
                    inputs[index]?.blur();
                }
            },
            updateValueList: (valueList) => new Promise<void>((resolve) => base.setState({ valueList }, resolve)),
        })
    );

    useDidUpdate(props.value, (value) => foundation.updateValueList(Array.from(value || '')));

    useImperativeHandle(
        ref,
        () => ({
            focus: (index) => {
                inputs[index]?.focus();
                inputs[index]?.setSelectionRange(1, 1);
            },
            blur: (index) => inputs[index]?.blur(),
        }),
        [inputs]
    );

    return (
        <div
            role="group"
            {...rest}
            className={clsx(`${cssClasses.PREFIX}-wrapper`, className)}
            style={style}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            // Form's blur validation waits until focus leaves the whole code
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    onBlur?.(e);
                }
            }}
        >
            {Array.from({ length: count }, (_, index) => (
                <Input
                    key={`input-${index}`}
                    ref={(handle) => {
                        inputs[index] = handle;
                    }}
                    id={index === 0 ? id : undefined}
                    aria-describedby={ariaDescribedby}
                    aria-errormessage={ariaErrormessage}
                    aria-invalid={ariaInvalid}
                    aria-label={locale.digit.replace('${index}', String(index + 1)).replace('${count}', String(count))}
                    aria-required={ariaRequired}
                    autoFocus={autoFocus && index === 0}
                    tabIndex={tabIndex}
                    disabled={disabled}
                    // stays controlled when empty so a rejected character is not shown
                    value={state.valueList[index] ?? ''}
                    // a cell holds one character: the adornments and showClear are set so global Input defaults cannot add them
                    addonAfter={null}
                    addonBefore={null}
                    // onChange fires once with the committed character after an IME composition
                    composition
                    inputMode={format === 'number' ? 'numeric' : 'text'}
                    insetLabel={null}
                    showClear={false}
                    size={size}
                    validateStatus={validateStatus}
                    prefix={null}
                    suffix={null}
                    onBlur={() => foundation.handleCurrentActiveIndexChange(index, 'blur')}
                    onChange={(v, e) => foundation.handleCellChange(index, v, (e.nativeEvent as InputEvent).data)}
                    onFocus={() => foundation.handleCurrentActiveIndexChange(index, 'focus')}
                    onKeyDown={(e) => foundation.handleKeyDownOnSingleInput(e.nativeEvent, index)}
                    onPaste={(e) => foundation.handlePaste(e.nativeEvent, index)}
                />
            ))}
        </div>
    );
}
