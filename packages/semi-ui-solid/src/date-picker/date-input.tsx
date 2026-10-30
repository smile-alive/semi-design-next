import { type JSX, Show, children, mergeProps } from 'solid-js';
import clsx from 'clsx';
import { isSplitRangeInputs } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
import DateInputFoundation, { type DateInputAdapter, type DateInputFoundationProps, type InsetInputChangeFoundationProps, type InsetInputChangeProps, type InsetInputProps, type RangeInput } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { IconCalendar, IconCalendarClock, IconClear } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import Input, { type InputChangeEvent, type InputProps } from '../input';
import { InsetDateInput, InsetTimeInput } from './inset-input';

/** The range wrappers and separator forward their click, the inputs their focus */
type RangeFocusEvent = FocusEvent | MouseEvent;

type ComboboxKeys = 'role' | 'aria-label' | 'aria-labelledby' | 'aria-controls' | 'aria-expanded' | 'aria-haspopup' | 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'insetLabelId' | 'clearIcon' | 'size' | 'tabIndex';

export interface DateInputProps extends Omit<DateInputFoundationProps, 'insetLabel' | 'prefix' | 'rangeSeparatorNode' | 'inputStyle' | keyof DateInputFoundationEvents>, DateInputFoundationEvents, Pick<InputProps, ComboboxKeys> {
    locale: Locale['DatePicker'];
    placeholder?: string | string[];
    /** Text shown instead of the one formatted from `value` */
    inputValue?: string | null;
    /** For a triggerRender reading the DatePicker's state; does not take part in rendering */
    multiple?: boolean;
    block?: boolean;
    autofocus?: boolean;
    rangeInputFocus?: RangeInput | false;
    insetLabel?: JSX.Element;
    prefix?: JSX.Element;
    inputStyle?: JSX.CSSProperties | string;
    value?: Date[];
    /** The native input of a single trigger, or of the single inset date input */
    inputRef?: (element: HTMLInputElement) => void;
    rangeInputStartRef?: (element: HTMLInputElement) => void;
    rangeInputEndRef?: (element: HTMLInputElement) => void;
    showClearIgnoreDisabled?: boolean;
    /** Only affects rendering of the separator between range inputs */
    rangeSeparatorNode?: JSX.Element;
    handleInsetDateFocus?: (e: FocusEvent, rangeType: RangeInput) => void;
    handleInsetTimeFocus?: () => void;
}

interface DateInputFoundationEvents {
    onChange?: (value: string, e: InputChangeEvent) => void;
    /** Called with the text of the input, or both range inputs joined by `rangeSeparator` */
    onEnterPress?: (value: string) => void;
    onFocus?: (e: RangeFocusEvent, rangeType?: RangeInput) => void;
    onClear?: (e: MouseEvent) => void;
    onRangeClear?: (e: MouseEvent) => void;
    onRangeEndTabPress?: (e: KeyboardEvent) => void;
    onInsetInputChange?: (options: InsetInputChangeProps) => void;
}

type Foundation = DateInputFoundation;
type Adapter = DateInputAdapter;

const defaultProps = {
    borderless: false,
    showClear: true,
    type: 'date',
    inputReadOnly: false,
    prefixCls: cssClasses.PREFIX,
    rangeSeparator: strings.DEFAULT_SEPARATOR_RANGE,
} satisfies Partial<DateInputProps>;

/** The trigger input of DatePicker (two inputs for a range), or the inset inputs at the top of its panel */
export default function DateInput(rawProps: DateInputProps) {
    const props = mergeProps(defaultProps, rawProps);

    let rangeStartInput: HTMLInputElement | undefined;

    // the clear button unmounts under the focus when the value is cleared, from it or from outside
    const clearHandover = useFocusHandover<HTMLButtonElement>(() => rangeStartInput);

    const { foundation } = useFoundation<Foundation, Adapter, DateInputFoundationProps, Record<string, never>>(
        DateInputFoundation,
        props as DateInputFoundationProps,
        () => ({}),
        () => ({
            notifyChange: (value, e) => props.onChange?.(value, e),
            notifyEnter: (value) => props.onEnterPress?.(value),
            notifyClear: (e) => props.onClear?.(e),
            notifyRangeInputClear: (e) => props.onRangeClear?.(e),
            notifyRangeInputFocus: (e, rangeType) => props.onFocus?.(e, rangeType),
            notifyTabPress: (e) => props.onRangeEndTabPress?.(e),
            notifyInsetInputChange: (options) => props.onInsetInputChange?.(options),
        })
    );

    const isRenderMultipleInputs = () => isSplitRangeInputs(props.type);

    const text = () => DateInputFoundation.getShowText(props);

    const inputCls = () =>
        clsx({
            [`${props.prefixCls}-input-readonly`]: props.inputReadOnly,
            [`${props.prefixCls}-monthRange-input`]: props.type === 'monthRange',
        });

    const handleInsetInputChange = (options: InsetInputChangeFoundationProps) => foundation.handleInsetInputChange(options);

    const handleRangeInputFocus = (e: RangeFocusEvent, rangeType: RangeInput) => foundation.handleRangeInputFocus(e, rangeType);

    const getRangeInputValue = (rangeStart: string, rangeEnd: string) => `${rangeStart}${props.rangeSeparator}${rangeEnd}`;

    const setRangeStartInput = (node: HTMLInputElement) => {
        rangeStartInput = node;
        props.rangeInputStartRef?.(node);
    };

    const renderRangeInput = () => {
        const parts = () => {
            const [rangeStart = '', rangeEnd = ''] = text().split(props.rangeSeparator);
            return { rangeStart, rangeEnd };
        };
        const rangeSize = () => (props.size === 'large' ? 'default' : 'small');
        const placeholders = () => (Array.isArray(props.placeholder) ? props.placeholder : [props.placeholder, props.placeholder]);
        const prefix = children(() => props.prefix);
        const hasPrefix = () => hasContent(prefix());
        const insetLabel = children(() => (hasPrefix() ? undefined : props.insetLabel));
        const hasLabel = () => hasPrefix() || hasContent(insetLabel());
        const separatorNode = children(() => props.rangeSeparatorNode);
        const allowClear = () => DateInputFoundation.getRangeClearVisible({ start: parts().rangeStart, end: parts().rangeEnd, showClear: props.showClear, disabled: props.disabled, showClearIgnoreDisabled: props.showClearIgnoreDisabled });
        const clearIcon = children(() => (allowClear() ? props.clearIcon : undefined));

        // the label names the group around both inputs, not each input
        const comboboxProps = {
            get tabIndex() {
                return props.tabIndex;
            },
            get role() {
                return props.role;
            },
            get 'aria-controls'() {
                return props['aria-controls'];
            },
            get 'aria-expanded'() {
                return props['aria-expanded'];
            },
            get 'aria-haspopup'() {
                return props['aria-haspopup'];
            },
            get 'aria-describedby'() {
                return props['aria-describedby'];
            },
            get 'aria-errormessage'() {
                return props['aria-errormessage'];
            },
            get 'aria-invalid'() {
                return props['aria-invalid'];
            },
            get 'aria-required'() {
                return props['aria-required'];
            },
        };

        const focusStartFromAffix = (e: MouseEvent) => {
            if (!props.disabled && !props.rangeInputFocus) {
                handleRangeInputFocus(e, 'rangeStart');
            }
        };

        const focusFromWrapper = (rangeType: RangeInput) => (e: MouseEvent) => {
            if (!props.disabled) {
                handleRangeInputFocus(e, rangeType);
            }
        };

        return (
            <>
                <Show when={hasLabel()}>
                    {/* the id is what a Form inset label's aria-labelledby points at */}
                    <div id={hasPrefix() ? undefined : props.insetLabelId} class={`${props.prefixCls}-range-input-prefix`} x-semi-prop="prefix,insetLabel" onClick={focusStartFromAffix}>
                        {hasPrefix() ? prefix() : insetLabel()}
                    </div>
                </Show>
                <div
                    class={clsx(inputCls(), `${props.prefixCls}-range-input-wrapper-start`, `${props.prefixCls}-range-input-wrapper`, {
                        [`${props.prefixCls}-range-input-wrapper-active`]: props.rangeInputFocus === 'rangeStart' && !props.disabled,
                        [`${props.prefixCls}-range-input-wrapper-start-with-prefix`]: hasLabel(),
                        [`${props.prefixCls}-borderless`]: props.borderless,
                    })}
                    onClick={focusFromWrapper('rangeStart')}
                >
                    <Input
                        {...comboboxProps}
                        inputRef={setRangeStartInput}
                        style={props.inputStyle}
                        autofocus={props.autofocus}
                        disabled={props.disabled}
                        placeholder={placeholders()[0]}
                        readOnly={props.inputReadOnly}
                        value={parts().rangeStart}
                        // the group draws its own label and clear button: global Input defaults must not add them
                        addonAfter={null}
                        addonBefore={null}
                        borderless={props.borderless}
                        insetLabel={null}
                        showClear={false}
                        size={rangeSize()}
                        prefix={null}
                        suffix={null}
                        // no onBlur: the blur callback fires when the panel closes
                        onChange={(value, e) => foundation.handleChange(getRangeInputValue(value, parts().rangeEnd), e)}
                        onEnterPress={(e) => foundation.handleRangeInputEnterPress(e, getRangeInputValue(parts().rangeStart, parts().rangeEnd))}
                        onFocus={(e) => handleRangeInputFocus(e, 'rangeStart')}
                    />
                </div>
                <span
                    class={clsx(`${cssClasses.PREFIX}-range-input-separator`, {
                        [`${cssClasses.PREFIX}-range-input-separator-active`]: Boolean(parts().rangeStart || parts().rangeEnd) && !props.disabled,
                    })}
                    onClick={focusFromWrapper('rangeStart')}
                >
                    {separatorNode() ?? props.rangeSeparator}
                </span>
                <div
                    class={clsx(inputCls(), `${props.prefixCls}-range-input-wrapper-end`, `${props.prefixCls}-range-input-wrapper`, {
                        [`${props.prefixCls}-range-input-wrapper-active`]: props.rangeInputFocus === 'rangeEnd' && !props.disabled,
                        [`${props.prefixCls}-borderless`]: props.borderless,
                    })}
                    onClick={focusFromWrapper('rangeEnd')}
                >
                    <Input
                        {...comboboxProps}
                        inputRef={props.rangeInputEndRef}
                        style={props.inputStyle}
                        disabled={props.disabled}
                        placeholder={placeholders()[1]}
                        readOnly={props.inputReadOnly}
                        value={parts().rangeEnd}
                        addonAfter={null}
                        addonBefore={null}
                        borderless={props.borderless}
                        insetLabel={null}
                        showClear={false}
                        size={rangeSize()}
                        prefix={null}
                        suffix={null}
                        onChange={(value, e) => foundation.handleChange(getRangeInputValue(parts().rangeStart, value), e)}
                        onEnterPress={(e) => foundation.handleRangeInputEnterPress(e, getRangeInputValue(parts().rangeStart, parts().rangeEnd))}
                        onFocus={(e) => handleRangeInputFocus(e, 'rangeEnd')}
                        onKeyDown={foundation.handleRangeInputEndKeyPress}
                    />
                </div>
                <Show when={allowClear()}>
                    <button ref={clearHandover} type="button" class={`${props.prefixCls}-range-input-clearbtn`} aria-label={props.locale.clearRange} onClick={foundation.handleRangeInputClearClick} onMouseDown={foundation.handleRangeInputClearMouseDown}>
                        <Show when={hasContent(clearIcon())} fallback={<IconClear />}>
                            {clearIcon()}
                        </Show>
                    </button>
                </Show>
                <div class={`${props.prefixCls}-range-input-suffix`} onClick={focusStartFromAffix}>
                    {props.type.includes('Time') ? <IconCalendarClock /> : <IconCalendar />}
                </div>
            </>
        );
    };

    const renderInputInset = () => {
        const insetInputValue = () => DateInputFoundation.getInsetInputValue(props, { value: props.value ?? [], insetInputValue: props.insetInputValue as NonNullable<DateInputProps['insetInputValue']> });
        const customPlaceholder = () => (typeof props.insetInput === 'object' ? (props.insetInput.placeholder ?? {}) : {}) as NonNullable<InsetInputProps['placeholder']>;
        const defaultPlaceholder = () => DateInputFoundation.getInsetInputPlaceholder(props);
        const names = () => DateInputFoundation.getInsetNames(props.locale, props.type);

        return (
            <div class={`${props.prefixCls}-inset-input-wrapper`} x-type={props.type}>
                <InsetDateInput
                    inputRef={props.rangeInputStartRef}
                    aria-label={names().start}
                    placeholder={customPlaceholder().dateStart ?? defaultPlaceholder().datePlaceholder}
                    insetInputValue={insetInputValue()}
                    panel="monthLeft"
                    onChange={handleInsetInputChange}
                    onFocus={(e) => props.handleInsetDateFocus?.(e, 'rangeStart')}
                />
                <InsetTimeInput
                    type={props.type}
                    aria-label={names().startTime}
                    disabled={!insetInputValue().monthLeft.dateInput}
                    placeholder={customPlaceholder().timeStart ?? defaultPlaceholder().timePlaceholder}
                    insetInputValue={insetInputValue()}
                    panel="monthLeft"
                    onChange={handleInsetInputChange}
                    onFocus={() => props.handleInsetTimeFocus?.()}
                />
                <Show when={isRenderMultipleInputs()}>
                    <div class={`${props.prefixCls}-inset-input-separator`}>{props.density === 'compact' ? '' : '-'}</div>
                    <InsetDateInput
                        inputRef={props.rangeInputEndRef}
                        aria-label={names().end}
                        placeholder={customPlaceholder().dateEnd ?? defaultPlaceholder().datePlaceholder}
                        insetInputValue={insetInputValue()}
                        panel="monthRight"
                        onChange={handleInsetInputChange}
                        onFocus={(e) => props.handleInsetDateFocus?.(e, 'rangeEnd')}
                    />
                    <InsetTimeInput
                        type={props.type}
                        aria-label={names().endTime}
                        disabled={!insetInputValue().monthRight.dateInput}
                        placeholder={customPlaceholder().timeEnd ?? defaultPlaceholder().timePlaceholder}
                        insetInputValue={insetInputValue()}
                        panel="monthRight"
                        onChange={handleInsetInputChange}
                        onFocus={() => props.handleInsetTimeFocus?.()}
                    />
                </Show>
            </div>
        );
    };

    const renderTriggerInput = () => (
        <Input
            role={props.role}
            tabIndex={props.tabIndex}
            aria-label={props['aria-label']}
            aria-labelledby={props['aria-labelledby']}
            aria-controls={props['aria-controls']}
            aria-expanded={props['aria-expanded']}
            aria-haspopup={props['aria-haspopup']}
            aria-describedby={props['aria-describedby']}
            aria-errormessage={props['aria-errormessage']}
            aria-invalid={props['aria-invalid']}
            aria-required={props['aria-required']}
            inputRef={props.inputRef}
            class={inputCls()}
            style={props.inputStyle}
            autofocus={props.autofocus}
            borderless={props.borderless}
            clearIcon={props.clearIcon}
            disabled={props.disabled}
            insetLabelId={props.insetLabelId}
            placeholder={props.type === 'monthRange' && Array.isArray(props.placeholder) ? props.placeholder[0] + props.rangeSeparator + props.placeholder[1] : (props.placeholder as string | undefined)}
            readOnly={props.inputReadOnly}
            value={text()}
            // the host's own values are forwarded; global Input defaults must not add the rest
            addonAfter={null}
            addonBefore={null}
            hideSuffix={props.showClear}
            insetLabel={props.insetLabel ?? null}
            showClear={props.showClear}
            showClearIgnoreDisabled={props.showClearIgnoreDisabled}
            size={props.size}
            validateStatus={props.validateStatus}
            prefix={props.prefix ?? null}
            suffix={props.type.includes('Time') ? <IconCalendarClock /> : <IconCalendar />}
            onChange={foundation.handleChange}
            onClear={foundation.handleInputClear}
            onEnterPress={foundation.handleInputComplete}
            onFocus={(e) => props.onFocus?.(e)}
        />
    );

    return (
        <Show
            when={props.insetInput}
            fallback={
                <Show when={isRenderMultipleInputs()} fallback={renderTriggerInput()}>
                    {renderRangeInput()}
                </Show>
            }
        >
            {renderInputInset()}
        </Show>
    );
}
