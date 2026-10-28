import { children, createMemo, createUniqueId, Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { radioGroupClasses as css, strings } from '@fibrae/semi-foundation/radio/constants';
import type { RadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
import RadioGroupFoundation, { type RadioGroupAdapter } from '@fibrae/semi-foundation/radio/radio-group-foundation';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import isMarkup from '../_base/is-markup';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import { RadioGroupContext, type RadioGroupButtonSize, type RadioGroupContextValue, type RadioMode } from './context';
import Radio, { type RadioType } from './radio';

/** Data only; other label and extra content goes through RadioGroup's `renderLabel` and `renderExtra` */
export interface OptionItem {
    label?: string | number;
    value?: string | number | boolean;
    disabled?: boolean;
    extra?: string | number;
    style?: JSX.CSSProperties | string;
    class?: string;
    addonId?: string;
    addonStyle?: JSX.CSSProperties | string;
    addonClassName?: string;
    extraId?: string;
}
export type Options = string[] | Array<OptionItem>;

export interface RadioGroupProps extends ElementProps<'div', 'onChange' | 'defaultValue'> {
    defaultValue?: string | number | boolean;
    disabled?: boolean;
    name?: string;
    options?: Options;
    /** The label of an `options` item */
    renderLabel?: (option: OptionItem, index: number) => JSX.Element;
    /** The extra text of an `options` item; a button radio has none */
    renderExtra?: (option: OptionItem, index: number) => JSX.Element;
    value?: string | number | boolean;
    onChange?: (event: RadioChangeEvent) => void;
    direction?: (typeof strings.DIRECTION_SET)[number];
    mode?: RadioMode;
    type?: RadioType;
    buttonSize?: RadioGroupButtonSize;
    prefixCls?: string;
}

export interface RadioGroupState {
    value?: any;
}

type Foundation = RadioGroupFoundation<RadioGroupProps, RadioGroupState>;
type Adapter = RadioGroupAdapter<RadioGroupProps, RadioGroupState>;

const defaultProps = {
    disabled: false,
    direction: strings.DEFAULT_DIRECTION,
    mode: '',
    type: strings.TYPE_DEFAULT,
    buttonSize: 'middle',
} satisfies Partial<RadioGroupProps>;

// Direct text children are dropped, as React's Children.map did
function Items(props: { children?: JSX.Element }) {
    const resolved = children(() => props.children);

    return <>{resolved.toArray().filter(isMarkup)}</>;
}

export default function RadioGroup(rawProps: RadioGroupProps) {
    const props = useDefaultProps('RadioGroup', rawProps, defaultProps);

    const [local, rest] = splitProps(omitFormInjected(props), [
        'children',
        'options',
        'renderLabel',
        'renderExtra',
        'mode',
        'prefixCls',
        'class',
        'direction',
        'type',
        'buttonSize',
        'defaultValue',
        'disabled',
        'name',
        'value',
        'onChange',
        // injected by Tooltip; unsupported on radiogroup, and tabIndex adds a stray Tab stop
        'aria-expanded',
        'aria-haspopup',
        'aria-controls',
        'tabIndex',
        'tabindex',
        'onBlur',
        'onFocusOut',
    ]);

    // one name per group keeps native arrow keys and form submission from crossing groups
    const generatedName = createUniqueId();
    const syncs = new Set<() => void>();

    const { foundation, state } = useFoundation<Foundation, Adapter, RadioGroupProps, RadioGroupState>(
        RadioGroupFoundation,
        props,
        // only the initial value is wanted: later changes of `value` arrive through the effect below
        (view) => ({ value: view.value === undefined ? view.defaultValue : view.value }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyChange: (event) => base.getProps().onChange?.(event),
        })
    );

    const isDefaultRadio = () => local.type === strings.TYPE_DEFAULT;

    const prefix = () => local.prefixCls || css.PREFIX;

    const isButtonRadio = () => local.type === strings.TYPE_BUTTON;

    const isPureCardRadio = () => local.type === strings.TYPE_PURECARD;

    const isCardRadio = () => local.type === strings.TYPE_CARD || isPureCardRadio();

    const view = createMemo(() => ({
        mode: local.mode,
        radioGroup: {
            value: local.value === undefined ? state().value : local.value,
            disabled: local.disabled,
            name: local.name || generatedName,
            isButtonRadio: isButtonRadio(),
            isCardRadio: isCardRadio(),
            isPureCardRadio: isPureCardRadio(),
            buttonSize: local.buttonSize,
            prefixCls: local.prefixCls,
        },
    }));

    const context: RadioGroupContextValue = {
        view,
        onChange: (event) => foundation.handleChange(event),
        register: (sync) => {
            syncs.add(sync);
            return () => syncs.delete(sync);
        },
        sync: () => syncs.forEach((sync) => sync()),
    };

    // Form's blur validation waits until focus leaves the group
    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, event);
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            callHandler(local.onBlur, event);
        }
    };

    useWatch(
        () => local.value,
        (value) => foundation.handlePropValueChange(value as string | number | boolean)
    );

    return (
        <div
            {...rest}
            class={clsx(local.class, {
                [prefix()]: true,
                [`${prefix()}-wrapper`]: true,
                [`${prefix()}-${local.direction}`]: local.direction && !isButtonRadio(),
                [`${prefix()}-${local.direction}-default`]: local.direction && isDefaultRadio(),
                [`${prefix()}-${local.direction}-card`]: local.direction && isCardRadio(),
                [`${prefix()}-buttonRadio`]: isButtonRadio(),
            })}
            role="radiogroup"
            onFocusOut={handleFocusOut}
        >
            <RadioGroupContext.Provider value={context}>
                <Show when={local.options} fallback={<Items>{local.children}</Items>}>
                    {(options) => (
                        <Index each={options()}>
                            {(option, index) => {
                                const item = (): OptionItem => {
                                    const current = option();
                                    return typeof current === 'string' ? { label: current, value: current } : current;
                                };
                                // Radio reads each once, and skips extra for a button radio, so the render functions run only there
                                return (
                                    <Radio
                                        addonClassName={item().addonClassName}
                                        class={item().class}
                                        addonStyle={item().addonStyle}
                                        style={item().style}
                                        disabled={item().disabled || local.disabled}
                                        value={item().value}
                                        addonId={item().addonId}
                                        extraId={item().extraId}
                                        extra={local.renderExtra ? local.renderExtra(item(), index) : item().extra}
                                    >
                                        {local.renderLabel ? local.renderLabel(item(), index) : item().label}
                                    </Radio>
                                );
                            }}
                        </Index>
                    )}
                </Show>
            </RadioGroupContext.Provider>
        </div>
    );
}
