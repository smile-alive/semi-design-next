import { createMemo, createUniqueId, Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import CheckboxGroupFoundation, { type CheckboxGroupAdapter, type CheckboxValue } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
import { checkboxGroupClasses as css, strings } from '@fibrae/semi-foundation/checkbox/constants';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import Checkbox, { type CheckboxProps } from './checkbox';
import { CheckboxGroupContext, type CheckboxGroupContextValue } from './context';

export type CheckboxDirection = (typeof strings.DIRECTION_SET)[number];
export type CheckboxType = typeof strings.TYPE_DEFAULT | typeof strings.TYPE_CARD | typeof strings.TYPE_PURECARD;

export type { CheckboxValue };

export interface CheckboxOptionItem {
    label?: JSX.Element;
    value?: CheckboxValue;
    disabled?: boolean;
    extra?: JSX.Element;
    style?: JSX.CSSProperties | string;
    class?: string;
    onChange?: CheckboxProps['onChange'];
}

export interface CheckboxGroupProps extends ElementProps<'div', 'onChange' | 'defaultValue'> {
    defaultValue?: CheckboxValue[];
    disabled?: boolean;
    name?: string;
    options?: Array<string | CheckboxOptionItem>;
    value?: CheckboxValue[];
    onChange?: (value: CheckboxValue[]) => void;
    prefixCls?: string;
    direction?: CheckboxDirection;
    type?: CheckboxType;
}

export type CheckboxGroupState = {
    value?: CheckboxValue[];
};

type Foundation = CheckboxGroupFoundation<CheckboxGroupProps, CheckboxGroupState>;
type Adapter = CheckboxGroupAdapter<CheckboxGroupProps, CheckboxGroupState>;

const defaultProps = {
    disabled: false,
    type: strings.TYPE_DEFAULT,
    defaultValue: [],
    direction: strings.DEFAULT_DIRECTION,
} satisfies Partial<CheckboxGroupProps>;

export default function CheckboxGroup(rawProps: CheckboxGroupProps) {
    const props = useDefaultProps('CheckboxGroup', rawProps, defaultProps);

    const [local, rest] = splitProps(omitFormInjected(props), [
        'children',
        'options',
        'prefixCls',
        'direction',
        'class',
        'type',
        'disabled',
        'name',
        'value',
        'defaultValue',
        'onChange',
        // role="group" supports none of these; invalid/errormessage go to each checkbox, required is dropped
        // since on each checkbox it would mean every one is required
        'aria-errormessage',
        'aria-invalid',
        'aria-required',
        // Tooltip injects these for a dialog trigger; group supports none of them and tabIndex adds a stray Tab stop
        'aria-expanded',
        'aria-haspopup',
        'aria-controls',
        'tabIndex',
        'tabindex',
        'onBlur',
        'onFocusOut',
    ]);

    const generatedName = createUniqueId();

    const { foundation, state } = useFoundation<Foundation, Adapter, CheckboxGroupProps, CheckboxGroupState>(
        CheckboxGroupFoundation,
        props,
        // only the initial value is wanted: later changes of `value` arrive through the effect below
        (view) => ({ value: view.value || view.defaultValue }),
        (base) => ({
            updateGroupValue: (value) => base.setState({ value }),
            notifyChange: (value) => base.getProps().onChange?.(value),
        })
    );

    const prefix = () => local.prefixCls || css.PREFIX;

    const isPureCardType = () => local.type === strings.TYPE_PURECARD;

    const isCardType = () => local.type === strings.TYPE_CARD || isPureCardType();

    const view = createMemo(() => ({
        value: CheckboxGroupFoundation.deriveValue(props, state()) ?? [],
        disabled: local.disabled,
        name: local.name || generatedName,
        isCardType: isCardType(),
        isPureCardType: isPureCardType(),
        ariaInvalid: local['aria-invalid'],
        ariaErrormessage: local['aria-errormessage'],
    }));

    const context: CheckboxGroupContextValue = {
        view,
        onChange: (event) => foundation.handleChange(event),
    };

    // moving between the boxes is not leaving the group: Form's blur validation waits until focus is outside
    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, event);
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            callHandler(local.onBlur, event);
        }
    };

    // deep comparison: Tree and TreeSelect pass a new array on every render
    useWatch(
        createMemo(() => local.value, undefined, { equals: isEqual }),
        (value) => foundation.handlePropValueChange(value)
    );

    return (
        <div
            {...rest}
            class={clsx(
                {
                    [prefix()]: true,
                    [`${prefix()}-wrapper`]: true,
                    [`${prefix()}-${local.direction}`]: local.direction,
                    [`${prefix()}-${local.direction}-cardType`]: local.direction && isCardType(),
                    [`${prefix()}-${local.direction}-pureCardType`]: local.direction && isPureCardType(),
                },
                local.class
            )}
            role="group"
            onFocusOut={handleFocusOut}
        >
            <CheckboxGroupContext.Provider value={context}>
                <Show when={local.options} fallback={local.children}>
                    {(options) => (
                        <Index each={options()}>
                            {(option) => {
                                const item = () => {
                                    const current = option();
                                    return typeof current === 'string' ? { label: current, value: current } : current;
                                };
                                return (
                                    <Checkbox class={item().class} style={item().style} disabled={item().disabled || local.disabled} value={item().value} prefixCls={local.prefixCls} extra={item().extra} onChange={item().onChange}>
                                        {item().label}
                                    </Checkbox>
                                );
                            }}
                        </Index>
                    )}
                </Show>
            </CheckboxGroupContext.Provider>
        </div>
    );
}
