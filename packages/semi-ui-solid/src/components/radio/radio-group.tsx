import { children, createMemo, createUniqueId, Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { radioGroupClasses as css, strings } from '@fibrae/semi-foundation/components/radio/constants';
import type { RadioChangeEvent } from '@fibrae/semi-foundation/components/radio/radio-foundation';
import RadioGroupFoundation, { type RadioGroupAdapter, type RadioGroupBaseState } from '@fibrae/semi-foundation/components/radio/radio-group-foundation';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import callHandler from '../../utils/call-handler';
import { omitFormInjected } from '../../utils/control-attrs';
import isMarkup from '../../utils/is-markup';
import { RadioGroupContext, type RadioGroupButtonSize, type RadioGroupContextValue, type RadioMode } from './context';
import Radio, { type RadioType } from './radio';

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
    renderLabel?: (option: OptionItem, index: number) => JSX.Element;
    /** The extra text of an `options` item; a button radio has none */
    renderExtra?: (option: OptionItem, index: number) => JSX.Element;
    value?: string | number | boolean;
    onChange?: (event: RadioChangeEvent) => void;
    direction?: (typeof strings.DIRECTION_SET)[number];
    mode?: RadioMode;
    type?: RadioType;
    buttonSize?: RadioGroupButtonSize;
}

export type RadioGroupState = RadioGroupBaseState;

type Foundation = RadioGroupFoundation<RadioGroupProps>;
type Adapter = RadioGroupAdapter<RadioGroupProps>;

const defaultProps = {
    disabled: false,
    direction: strings.DEFAULT_DIRECTION,
    mode: '',
    type: strings.TYPE_DEFAULT,
    buttonSize: 'middle',
} satisfies Partial<RadioGroupProps>;

const prefix = css.PREFIX;

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
        (view) => RadioGroupFoundation.getInitialState(view),
        (base) => ({
            notifyChange: (event) => base.getProps().onChange?.(event),
            notifyBlur: (event) => callHandler(local.onBlur, event),
        })
    );

    const isDefaultRadio = () => local.type === strings.TYPE_DEFAULT;

    const isButtonRadio = () => local.type === strings.TYPE_BUTTON;

    const isPureCardRadio = () => local.type === strings.TYPE_PURECARD;

    const isCardRadio = () => local.type === strings.TYPE_CARD || isPureCardRadio();

    const view = createMemo(() => ({
        mode: local.mode,
        radioGroup: {
            value: RadioGroupFoundation.deriveValue(local, state()),
            disabled: local.disabled,
            name: local.name || generatedName,
            isButtonRadio: isButtonRadio(),
            isCardRadio: isCardRadio(),
            isPureCardRadio: isPureCardRadio(),
            buttonSize: local.buttonSize,
        },
    }));

    const context: RadioGroupContextValue = {
        view,
        onChange: foundation.handleChange,
        register: (sync) => {
            syncs.add(sync);
            return () => syncs.delete(sync);
        },
        sync: () => syncs.forEach((sync) => sync()),
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, event);
        foundation.handleBlur(event);
    };

    return (
        <div
            {...rest}
            class={clsx(local.class, {
                [prefix]: true,
                [`${prefix}-wrapper`]: true,
                [`${prefix}-${local.direction}`]: local.direction && !isButtonRadio(),
                [`${prefix}-${local.direction}-default`]: local.direction && isDefaultRadio(),
                [`${prefix}-${local.direction}-card`]: local.direction && isCardRadio(),
                [`${prefix}-buttonRadio`]: isButtonRadio(),
            })}
            role="radiogroup"
            onFocusOut={handleFocusOut}
        >
            <RadioGroupContext.Provider value={context}>
                <Show when={local.options} fallback={<Items>{local.children}</Items>}>
                    {(options) => (
                        <Index each={options()}>
                            {(option, index) => {
                                const item = () => {
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
