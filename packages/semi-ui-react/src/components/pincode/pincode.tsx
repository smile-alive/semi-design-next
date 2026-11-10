import type React from 'react';
import { useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/pincode/constants';
import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps, type PinCodeBaseState } from '@fibrae/semi-foundation/components/pincode/foundation';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import '@fibrae/semi-foundation/components/pincode/pincode.scss';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import Input, { type InputProps, type InputHandle } from '../input';
import useLocale from '../locale/use-locale';

type Foundation = PinCodeFoundation<PinCodeProps>;
type Adapter = PinCodeAdapter<PinCodeProps>;

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
        onFocus,
        ...rest
    } = props as PinCodeProps &
        React.AriaAttributes & {
            tabIndex?: number;
            id?: string;
            insetLabel?: unknown;
            insetLabelId?: unknown;
            name?: unknown;
        };

    const { locale } = useLocale('PinCode');
    const context = useConfigContext();

    const inputsRef = useRef<(InputHandle | null)[]>([]);

    const [foundation, state] = useFoundation<Foundation, Adapter, PinCodeProps, PinCodeState>(
        PinCodeFoundation,
        props,
        () => PinCodeFoundation.getInitialState(props),
        (base) => ({
            notifyValueChange: (values) => base.getProps().onChange?.(values.join('')),
            notifyComplete: (value) => base.getProps().onComplete?.(value),
            notifyFocus: (e) => base.getProps().onFocus?.(e),
            notifyBlur: (e) => base.getProps().onBlur?.(e),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputsRef.current[index]?.focus();
                } else {
                    inputsRef.current[index]?.blur();
                }
            },
        }),
        context
    );

    useImperativeHandle(
        ref,
        () => ({
            focus: (index) => {
                inputsRef.current[index]?.focus();
                inputsRef.current[index]?.setSelectionRange(1, 1);
            },
            blur: (index) => inputsRef.current[index]?.blur(),
        }),
        []
    );

    return (
        <div role="group" {...rest} className={clsx(`${cssClasses.PREFIX}-wrapper`, className)} style={style} aria-label={ariaLabel} aria-labelledby={ariaLabelledby} onBlur={foundation.handleBlur} onFocus={foundation.handleFocus}>
            {Array.from({ length: count }, (_, index) => (
                <Input
                    key={`input-${index}`}
                    ref={(handle) => {
                        inputsRef.current[index] = handle;
                    }}
                    id={index === 0 ? id : undefined}
                    aria-describedby={ariaDescribedby}
                    aria-errormessage={ariaErrormessage}
                    aria-invalid={ariaInvalid}
                    aria-label={formatLocale(locale.digit, { index: index + 1, count })}
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
