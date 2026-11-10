import { Index, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/pincode/constants';
import PinCodeFoundation, { type PinCodeAdapter, type PinCodeBaseProps, type PinCodeBaseState } from '@fibrae/semi-foundation/components/pincode/foundation';
import { formatLocale } from '@fibrae/semi-foundation/locale';
import '@fibrae/semi-foundation/components/pincode/pincode.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { omitFormInjected, forwardFocus, mergeRefs } from '../../utils/index';
import useConfig from '../config-provider/use-config';
import Input, { type InputSize, type ValidateStatus } from '../input';
import useLocale from '../locale/use-locale';
import { useSpecialTrigger } from '../tooltip/context';

/** `class`, `style`, `ref` and other attributes go to the role="group" wrapper; the aria states, `id` and `tabindex` to the inputs */
export interface PinCodeProps extends Omit<PinCodeBaseProps, 'autoFocus'>, ElementProps<'div', 'defaultValue' | 'onChange' | 'onFocus' | 'onBlur'> {
    autofocus?: boolean;
    size?: InputSize;
    validateStatus?: ValidateStatus;
    /** Fires as focus enters the code from outside; moving between its inputs does not fire it */
    onFocus?: (e: FocusEvent) => void;
    /** Fires as focus leaves the whole code, so Form's blur validation waits for it */
    onBlur?: (e: FocusEvent) => void;
}

export interface PinCodeState extends PinCodeBaseState {}

type Foundation = PinCodeFoundation<PinCodeProps>;
type Adapter = PinCodeAdapter<PinCodeProps>;

const defaultProps = {
    count: 6,
    format: 'number',
    autofocus: false,
} satisfies Partial<PinCodeProps>;

export default function PinCode(rawProps: PinCodeProps) {
    const props = useDefaultProps('PinCode', rawProps, defaultProps);

    const [local, rest] = splitProps(omitFormInjected(props) as PinCodeProps & { name?: unknown }, [
        'aria-describedby',
        'aria-errormessage',
        'aria-invalid',
        'aria-required',
        'autofocus',
        'class',
        'count',
        'defaultValue',
        'disabled',
        'format',
        // Form's id goes on the first input so that clicking the label focuses it
        'id',
        // injected by Form and dropped: no single input can carry the whole code's name
        'name',
        'onBlur',
        'onChange',
        'onComplete',
        'onFocus',
        'ref',
        'size',
        // a Tooltip's tabindex on the wrapper would add an extra tab stop
        'tabIndex',
        'tabindex',
        'value',
    ]);

    const locale = useLocale('PinCode');
    const config = useConfig();

    const inputs: HTMLInputElement[] = [];

    const { foundation, state } = useFoundation<Foundation, Adapter, PinCodeProps, PinCodeState>(
        PinCodeFoundation,
        props,
        (view) => PinCodeFoundation.getInitialState(view),
        () => ({
            notifyValueChange: (values) => props.onChange?.(values.join('')),
            notifyComplete: (value) => props.onComplete?.(value),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyBlur: (e) => props.onBlur?.(e),
            changeSpecificInputFocusState: (index, focusState) => {
                if (focusState === 'focus') {
                    inputs[index]?.focus();
                } else {
                    inputs[index]?.blur();
                }
            },
        }),
        { context: config }
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const digitLabel = (index: number) => formatLocale(locale().locale.digit, { index: index + 1, count: String(local.count) });

    const setRoot = (node: HTMLDivElement) => {
        // React's handle only focuses a given index; without one, the first empty cell (or the last when full) is where typing continues
        forwardFocus(node, () => {
            const cells = Array.from(node.querySelectorAll('input'));
            return cells.find((cell) => !cell.value) ?? cells.at(-1);
        });
        registerTrigger(node);
    };

    return (
        <div role="group" {...rest} ref={mergeRefs(setRoot, local.ref)} class={clsx(`${cssClasses.PREFIX}-wrapper`, local.class)} onFocusIn={foundation.handleFocus} onFocusOut={foundation.handleBlur}>
            <Index each={Array.from({ length: local.count ?? 0 })}>
                {(_, index) => (
                    <Input
                        inputRef={(node) => (inputs[index] = node)}
                        id={index === 0 ? local.id : undefined}
                        aria-describedby={local['aria-describedby']}
                        aria-errormessage={local['aria-errormessage']}
                        aria-invalid={local['aria-invalid']}
                        aria-label={digitLabel(index)}
                        aria-required={local['aria-required']}
                        autofocus={local.autofocus && index === 0}
                        tabIndex={local.tabIndex ?? local.tabindex}
                        disabled={local.disabled}
                        // stays controlled when empty so a rejected character is not shown
                        value={state().valueList[index] ?? ''}
                        // a cell holds one character: the adornments and showClear are set so global Input defaults cannot add them
                        addonAfter={null}
                        addonBefore={null}
                        // onChange fires once with the committed character after an IME composition
                        composition
                        inputMode={local.format === 'number' ? 'numeric' : 'text'}
                        insetLabel={null}
                        showClear={false}
                        size={local.size}
                        validateStatus={props.validateStatus}
                        prefix={null}
                        suffix={null}
                        onBlur={() => foundation.handleCurrentActiveIndexChange(index, 'blur')}
                        onChange={(value, e) => foundation.handleCellChange(index, value, e instanceof InputEvent || e instanceof CompositionEvent ? e.data : null)}
                        onFocus={() => foundation.handleCurrentActiveIndexChange(index, 'focus')}
                        onKeyDown={(e) => foundation.handleKeyDownOnSingleInput(e, index)}
                        onPaste={(e) => void foundation.handlePaste(e, index)}
                    />
                )}
            </Index>
        </div>
    );
}
