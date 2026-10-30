import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import { isSplitRangeInputs } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
import DateInputFoundation, { type DateInputAdapter, type DateInputFoundationProps, type RangeInput, type InsetInputChangeProps, type InsetInputChangeFoundationProps, type InsetInputProps } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconCalendar, IconCalendarClock, IconClear } from '@fibrae/semi-icons-react';
import type { BaseProps } from '../_base/base-component';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import { hasContent } from '../_utils';
import Input, { type InputHandle, type InputProps } from '../input/index';
import { InsetDateInput, InsetTimeInput } from './inset-input';

/** The foundation only forwards the event, so its own types stay free of React */
type RangeFocusEvent = React.FocusEvent<HTMLDivElement> | React.MouseEvent<HTMLElement>;

export interface DateInputProps
    extends DateInputFoundationProps, BaseProps, Pick<InputProps, 'role' | 'aria-label' | 'aria-labelledby' | 'aria-controls' | 'aria-expanded' | 'aria-haspopup' | 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required' | 'insetLabelId' | 'clearIcon' | 'size' | 'tabIndex'> {
    locale: Locale['DatePicker'];
    placeholder?: string | string[];
    block?: boolean;
    /** text shown instead of the one formatted from `value` */
    inputValue?: string;
    /** passed to the input; does not take part in rendering */
    multiple?: boolean;
    autofocus?: boolean;
    rangeInputFocus?: RangeInput | false;
    onRangeClear?: (e: React.MouseEvent<HTMLElement>) => void;
    onRangeEndTabPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleInsetDateFocus?: (e: React.FocusEvent, rangeType: RangeInput) => void;
    handleInsetTimeFocus?: () => void;
    insetLabel?: React.ReactNode;
    prefix?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
    onChange?: (value: string, e: React.MouseEvent<HTMLInputElement>) => void;
    /** called with the text of the input, or both range inputs joined by `rangeSeparator` */
    onEnterPress?: (value: string) => void;
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
    /** the range wrappers and separator forward their click, the inputs their focus */
    onFocus?: (e: RangeFocusEvent, rangeType?: RangeInput) => void;
    onClear?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onInsetInputChange?: (options: InsetInputChangeProps) => void;
    value?: Date[];
    inputRef?: React.Ref<InputHandle>;
    rangeInputStartRef?: React.Ref<InputHandle>;
    rangeInputEndRef?: React.Ref<InputHandle>;
    showClearIgnoreDisabled?: boolean;
    /** Only affects rendering of the separator between range inputs */
    rangeSeparatorNode?: React.ReactNode;
}

/** The trigger input of DatePicker (two inputs for a range), or the inset inputs at the top of its panel */
export default function DateInput(rawProps: DateInputProps) {
    const props: DateInputProps = {
        ...rawProps,
        borderless: rawProps.borderless ?? false,
        showClear: rawProps.showClear ?? true,
        onChange: rawProps.onChange ?? noop,
        onEnterPress: rawProps.onEnterPress ?? noop,
        onBlur: rawProps.onBlur ?? noop,
        onClear: rawProps.onClear ?? noop,
        onFocus: rawProps.onFocus ?? noop,
        type: rawProps.type ?? 'date',
        inputStyle: rawProps.inputStyle ?? {},
        inputReadOnly: rawProps.inputReadOnly ?? false,
        prefixCls: rawProps.prefixCls ?? cssClasses.PREFIX,
        rangeSeparator: rawProps.rangeSeparator ?? strings.DEFAULT_SEPARATOR_RANGE,
    };

    const { locale } = props;

    const rangeStartWrapperRef = useRef<HTMLDivElement>(null);

    // the clear button unmounts under the focus when the value is cleared, from it or from outside
    const clearHandover = useFocusHandover<HTMLButtonElement>(() => rangeStartWrapperRef.current?.querySelector('input'));

    const [foundation] = useFoundation<DateInputFoundation, DateInputAdapter, DateInputFoundationProps, Record<string, never>>(
        DateInputFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyChange: (value, e) => base.getProps().onChange(value, e),
            notifyEnter: (value) => base.getProps().onEnterPress(value),
            notifyClear: (e) => base.getProps().onClear(e),
            notifyRangeInputClear: (e) => base.getProps().onRangeClear(e),
            notifyRangeInputFocus: (e, rangeType) => base.getProps().onFocus(e, rangeType),
            notifyTabPress: (e) => base.getProps().onRangeEndTabPress(e),
            notifyInsetInputChange: (options) => base.getProps().onInsetInputChange(options),
        })
    );

    const isRenderMultipleInputs = isSplitRangeInputs(props.type);

    const handleInsetInputChange = (options: InsetInputChangeFoundationProps) => foundation.handleInsetInputChange(options);

    const handleRangeInputFocus = (e: RangeFocusEvent, rangeType: RangeInput) => foundation.handleRangeInputFocus(e, rangeType);

    const getRangeInputValue = (rangeStart: string, rangeEnd: string) => `${rangeStart}${props.rangeSeparator}${rangeEnd}`;

    const renderRangeInput = (text: string, suffix: React.ReactNode, inputCls: string) => {
        const {
            placeholder,
            inputStyle,
            disabled,
            inputReadOnly,
            autofocus,
            size,
            rangeInputStartRef,
            rangeInputEndRef,
            rangeInputFocus,
            prefixCls,
            rangeSeparator,
            rangeSeparatorNode,
            borderless,
            prefix,
            insetLabel,
            showClear,
            clearIcon,
            showClearIgnoreDisabled,
            insetLabelId,
            tabIndex,
            role,
            'aria-controls': ariaControls,
            'aria-expanded': ariaExpanded,
            'aria-haspopup': ariaHaspopup,
            'aria-describedby': ariaDescribedby,
            'aria-errormessage': ariaErrormessage,
            'aria-invalid': ariaInvalid,
            'aria-required': ariaRequired,
        } = props;
        // the label names the group around both inputs, not each input
        const comboboxProps = {
            tabIndex,
            role,
            'aria-controls': ariaControls,
            'aria-expanded': ariaExpanded,
            'aria-haspopup': ariaHaspopup,
            'aria-describedby': ariaDescribedby,
            'aria-errormessage': ariaErrormessage,
            'aria-invalid': ariaInvalid,
            'aria-required': ariaRequired,
        };

        const [rangeStart, rangeEnd = ''] = text.split(rangeSeparator) || [];
        const rangeSize = size === 'large' ? 'default' : 'small';
        const rangePlaceholder = Array.isArray(placeholder) ? placeholder : [placeholder, placeholder];
        const [rangeStartPlaceholder, rangeEndPlaceholder] = rangePlaceholder;
        const labelNode = hasContent(prefix) ? prefix : insetLabel;
        const inputLeftWrapperCls = clsx(`${prefixCls}-range-input-wrapper-start`, `${prefixCls}-range-input-wrapper`, {
            [`${prefixCls}-range-input-wrapper-active`]: rangeInputFocus === 'rangeStart' && !disabled,
            [`${prefixCls}-range-input-wrapper-start-with-prefix`]: hasContent(labelNode),
            [`${prefixCls}-borderless`]: borderless,
        });
        const inputRightWrapperCls = clsx(`${prefixCls}-range-input-wrapper-end`, `${prefixCls}-range-input-wrapper`, {
            [`${prefixCls}-range-input-wrapper-active`]: rangeInputFocus === 'rangeEnd' && !disabled,
            [`${prefixCls}-borderless`]: borderless,
        });
        const allowClear = DateInputFoundation.getRangeClearVisible({ start: rangeStart, end: rangeEnd, showClear, disabled, showClearIgnoreDisabled });

        return (
            <>
                {hasContent(labelNode) && (
                    // the id is what a Form inset label's aria-labelledby points at
                    <div id={hasContent(prefix) ? undefined : insetLabelId} className={`${prefixCls}-range-input-prefix`} x-semi-prop="prefix,insetLabel" onClick={(e) => !disabled && !rangeInputFocus && handleRangeInputFocus(e, 'rangeStart')}>
                        {labelNode}
                    </div>
                )}
                <div ref={rangeStartWrapperRef} className={`${inputCls} ${inputLeftWrapperCls}`} onClick={(e) => !disabled && handleRangeInputFocus(e, 'rangeStart')}>
                    <Input
                        {...comboboxProps}
                        ref={rangeInputStartRef}
                        style={inputStyle}
                        autoFocus={autofocus}
                        disabled={disabled}
                        placeholder={rangeStartPlaceholder}
                        readOnly={inputReadOnly}
                        value={rangeStart}
                        // the group draws its own label and clear button: global Input defaults must not add them
                        addonAfter={null}
                        addonBefore={null}
                        borderless={borderless}
                        insetLabel={null}
                        showClear={false}
                        size={rangeSize}
                        prefix={null}
                        suffix={null}
                        // no onBlur: the blur callback fires when the panel closes
                        onChange={(rangeStartValue, e) => foundation.handleChange(getRangeInputValue(rangeStartValue, rangeEnd), e)}
                        onEnterPress={(e) => foundation.handleRangeInputEnterPress(e, getRangeInputValue(rangeStart, rangeEnd))}
                        onFocus={(e) => handleRangeInputFocus(e, 'rangeStart')}
                    />
                </div>
                <span
                    className={clsx(`${cssClasses.PREFIX}-range-input-separator`, {
                        [`${cssClasses.PREFIX}-range-input-separator-active`]: (rangeStart || rangeEnd) && !disabled,
                    })}
                    onClick={(e) => !disabled && handleRangeInputFocus(e, 'rangeStart')}
                >
                    {rangeSeparatorNode ?? rangeSeparator}
                </span>
                <div className={`${inputCls} ${inputRightWrapperCls}`} onClick={(e) => !disabled && handleRangeInputFocus(e, 'rangeEnd')}>
                    <Input
                        {...comboboxProps}
                        ref={rangeInputEndRef}
                        style={inputStyle}
                        disabled={disabled}
                        placeholder={rangeEndPlaceholder}
                        readOnly={inputReadOnly}
                        value={rangeEnd}
                        addonAfter={null}
                        addonBefore={null}
                        borderless={borderless}
                        insetLabel={null}
                        showClear={false}
                        size={rangeSize}
                        prefix={null}
                        suffix={null}
                        onChange={(rangeEndValue, e) => foundation.handleChange(getRangeInputValue(rangeStart, rangeEndValue), e)}
                        onEnterPress={(e) => foundation.handleRangeInputEnterPress(e, getRangeInputValue(rangeStart, rangeEnd))}
                        onFocus={(e) => handleRangeInputFocus(e, 'rangeEnd')}
                        onKeyDown={foundation.handleRangeInputEndKeyPress}
                    />
                </div>
                {allowClear && (
                    <button ref={clearHandover} type="button" className={`${prefixCls}-range-input-clearbtn`} aria-label={locale.clearRange} onClick={foundation.handleRangeInputClearClick} onMouseDown={foundation.handleRangeInputClearMouseDown}>
                        {clearIcon ? clearIcon : <IconClear />}
                    </button>
                )}
                {Boolean(suffix) && (
                    <div className={`${prefixCls}-range-input-suffix`} onClick={(e) => !disabled && !rangeInputFocus && handleRangeInputFocus(e, 'rangeStart')}>
                        {suffix}
                    </div>
                )}
            </>
        );
    };

    const renderInputInset = () => {
        const { type, handleInsetDateFocus, handleInsetTimeFocus, value, insetInputValue, prefixCls, rangeInputStartRef, rangeInputEndRef, density, insetInput } = props;

        const newInsetInputValue = DateInputFoundation.getInsetInputValue(props, { value, insetInputValue });
        const { dateStart, dateEnd, timeStart, timeEnd } = ((insetInput as InsetInputProps | undefined)?.placeholder ?? {}) as InsetInputProps['placeholder'];
        const { datePlaceholder, timePlaceholder } = DateInputFoundation.getInsetInputPlaceholder(props);
        const names = DateInputFoundation.getInsetNames(locale, type);

        return (
            <div className={`${prefixCls}-inset-input-wrapper`} x-type={type}>
                <InsetDateInput ref={rangeInputStartRef} aria-label={names.start} placeholder={dateStart ?? datePlaceholder} insetInputValue={newInsetInputValue} panel="monthLeft" onChange={handleInsetInputChange} onFocus={(e) => handleInsetDateFocus(e, 'rangeStart')} />
                <InsetTimeInput type={type} aria-label={names.startTime} disabled={!newInsetInputValue.monthLeft.dateInput} placeholder={timeStart ?? timePlaceholder} insetInputValue={newInsetInputValue} panel="monthLeft" onChange={handleInsetInputChange} onFocus={handleInsetTimeFocus} />
                {isRenderMultipleInputs && (
                    <>
                        <div className={`${prefixCls}-inset-input-separator`}>{!(density === 'compact') && '-'}</div>
                        <InsetDateInput ref={rangeInputEndRef} aria-label={names.end} placeholder={dateEnd ?? datePlaceholder} insetInputValue={newInsetInputValue} panel="monthRight" onChange={handleInsetInputChange} onFocus={(e) => handleInsetDateFocus(e, 'rangeEnd')} />
                        <InsetTimeInput type={type} aria-label={names.endTime} disabled={!newInsetInputValue.monthRight.dateInput} placeholder={timeEnd ?? timePlaceholder} insetInputValue={newInsetInputValue} panel="monthRight" onChange={handleInsetInputChange} onFocus={handleInsetTimeFocus} />
                    </>
                )}
            </div>
        );
    };

    const renderTriggerInput = () => {
        const {
            placeholder,
            type,
            value,
            inputValue,
            inputStyle,
            disabled,
            showClear,
            inputReadOnly,
            insetLabel,
            validateStatus,
            block,
            prefixCls,
            multiple,
            dateFnsLocale,
            onBlur,
            onClear,
            onFocus,
            prefix,
            autofocus,
            size,
            inputRef,
            rangeInputStartRef,
            rangeInputEndRef,
            onRangeClear,
            onRangeEndTabPress,
            rangeInputFocus,
            rangeSeparator,
            rangeSeparatorNode,
            insetInput,
            insetInputValue,
            defaultPickerValue,
            showClearIgnoreDisabled,
            locale: _locale,
            ...rest
        } = props;
        const suffix = type.includes('Time') ? <IconCalendarClock /> : <IconCalendar />;
        const text = DateInputFoundation.getShowText(props);

        const inputCls = clsx({
            [`${prefixCls}-input-readonly`]: inputReadOnly,
            [`${prefixCls}-monthRange-input`]: type === 'monthRange',
        });

        return isRenderMultipleInputs ? (
            renderRangeInput(text, suffix, inputCls)
        ) : (
            <Input
                {...rest}
                ref={inputRef}
                className={inputCls}
                style={inputStyle}
                autoFocus={autofocus}
                disabled={disabled}
                placeholder={type === 'monthRange' && Array.isArray(placeholder) ? placeholder[0] + rangeSeparator + placeholder[1] : (placeholder as string)}
                readOnly={inputReadOnly}
                value={text}
                // the host's own values are forwarded; global Input defaults must not add the rest
                addonAfter={null}
                addonBefore={null}
                hideSuffix={showClear}
                insetLabel={insetLabel ?? null}
                showClear={showClear}
                showClearIgnoreDisabled={showClearIgnoreDisabled}
                size={size}
                validateStatus={validateStatus}
                prefix={prefix ?? null}
                suffix={suffix}
                onBlur={onBlur}
                onChange={foundation.handleChange}
                onClear={foundation.handleInputClear}
                onEnterPress={foundation.handleInputComplete}
                onFocus={onFocus}
            />
        );
    };

    return props.insetInput ? renderInputInset() : renderTriggerInput();
}
