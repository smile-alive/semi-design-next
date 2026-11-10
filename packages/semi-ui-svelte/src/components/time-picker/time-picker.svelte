<script lang="ts">
    import { onMount } from 'svelte';
    import type { Locale } from 'date-fns';
    import { FocusTrapHandle } from '@fibrae/semi-foundation/base';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/time-picker/constants';
    import TimePickerFoundation, { type TimePickerAdapter, type TimePickerBaseProps } from '@fibrae/semi-foundation/components/time-picker/foundation';
    import { getDateFnsLocale } from '@fibrae/semi-foundation/utils/date-fns-locale';
    import '@fibrae/semi-foundation/components/time-picker/time-picker.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { useClickOutside } from '../../hooks/index.js';
    import { splitControlAttrs } from '../../utils/index.js';
    import { useConfig } from '../config-provider/index.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { useLocale } from '../locale/index.js';
    import { Popover } from '../popover/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import Combobox from './combobox.svelte';
    import type { TimePickerProps, TimePickerState, TimePickerTriggerRenderProps } from './interface.js';
    import TimeInput from './time-input.svelte';

    interface FoundationProps extends TimePickerBaseProps {
        type?: TimePickerProps['type'];
        dateFnsLocale?: Locale;
    }

    type Foundation = TimePickerFoundation<FoundationProps, FocusEvent>;
    type Adapter = TimePickerAdapter<FoundationProps, FocusEvent>;

    const defaults = useDefaultProps('TimePicker');

    // No fallback on `value` and `open`: a bound `undefined` (form reset, back to uncontrolled) would throw with one
    let {
        value = $bindable(),
        open = $bindable(),
        type = defaults('type', strings.DEFAULT_TYPE),
        format = defaults('format'),
        use12Hours = defaults('use12Hours', false),
        hourStep = defaults('hourStep'),
        minuteStep = defaults('minuteStep'),
        secondStep = defaults('secondStep'),
        disabled: disabledProp,
        disabledHours = defaults('disabledHours'),
        disabledMinutes = defaults('disabledMinutes'),
        disabledSeconds = defaults('disabledSeconds'),
        disabledTime = defaults('disabledTime'),
        hideDisabledOptions = defaults('hideDisabledOptions', false),
        placeholder = defaults('placeholder'),
        rangeSeparator = defaults('rangeSeparator', strings.DEFAULT_RANGE_SEPARATOR),
        size: sizeProp,
        borderless = defaults('borderless', false),
        showClear = defaults('showClear', true),
        inputReadOnly = defaults('inputReadOnly', false),
        validateStatus = defaults('validateStatus'),
        insetLabelId,
        inputStyle = defaults('inputStyle'),
        autofocus = defaults('autofocus', false),
        focusOnOpen = defaults('focusOnOpen', false),
        preventScroll = defaults('preventScroll'),
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow', true),
        position = defaults('position'),
        popupClassName = defaults('popupClassName'),
        popupStyle = defaults('popupStyle'),
        stopPropagation = defaults('stopPropagation', true),
        // read below: ConfigProvider's timeZone comes before the global default
        timeZone,
        scrollItemProps = defaults('scrollItemProps'),
        onChange,
        onOpenChange,
        onFocus,
        onBlur,
        trigger,
        panelHeader,
        panelFooter,
        panel,
        prefix,
        insetLabel,
        clearIcon,
        ...rest
    }: TimePickerProps = $props();

    const config = useConfig();
    const locale = useLocale('TimePicker');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let panelElement = $state<HTMLDivElement>();
    let triggerWrapper = $state<HTMLDivElement>();

    // A trigger snippet is user markup: only the rendered DOM tells whether it brings its own focus target.
    // Known limitation: measured once on mount; a trigger that later gains or loses a focusable element leaves the
    // measurement stale. Upgrade to a MutationObserver on the wrapper if such triggers need support.
    let customTriggerFocusable = $state(false);

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));
    const zone = $derived(timeZone ?? config.timeZone ?? defaults('timeZone'));

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get value() {
            return value;
        },
        get open() {
            return open;
        },
        get type() {
            return type;
        },
        get disabled() {
            return disabled;
        },
        get format() {
            return format;
        },
        get use12Hours() {
            return use12Hours;
        },
        get rangeSeparator() {
            return rangeSeparator;
        },
        get timeZone() {
            return zone;
        },
        get dateFnsLocale() {
            return getDateFnsLocale(locale().localeCode, config.dateFnsLocale);
        },
        get disabledHours() {
            return disabledHours;
        },
        get disabledMinutes() {
            return disabledMinutes;
        },
        get disabledSeconds() {
            return disabledSeconds;
        },
        get disabledTime() {
            return disabledTime as FoundationProps['disabledTime'];
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, TimePickerState>(
        TimePickerFoundation,
        foundationProps,
        (view) => TimePickerFoundation.getInitialState(view),
        () => ({
            notifyOpenChange: (next) => {
                open = next;
                onOpenChange?.(next);
            },
            notifyChange: (next, str) => {
                value = next;
                onChange?.(next, str);
            },
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panelElement),
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(root, { preventScroll }),
            blurFocusedElement: () => {
                const active = FocusTrapHandle.getActiveElement(root);
                if (active && (root?.contains(active) || panelElement?.contains(active))) {
                    active.blur();
                }
            },
        })
    );

    const prefixCls = cssClasses.PREFIX;
    const panelId = `${uid}-panel`;
    const isRange = $derived(type === strings.TYPE_TIME_RANGE_PICKER);
    const validFormat = $derived(TimePickerFoundation.getValidFormat({ format, use12Hours }));
    const popupPosition = $derived(TimePickerFoundation.getPosition({ type, position }, config.direction));
    const shownPlaceholder = $derived(placeholder ?? locale().locale.placeholder[type]);
    const shown = $derived(TimePickerFoundation.isPanelShown({ open, disabled }, states()));
    const isTriggerButton = $derived(Boolean(trigger) && !customTriggerFocusable);

    // class and style size the root; every other attribute names and identifies the input
    const attrs = $derived(trigger ? { root: rest as Record<string, unknown>, control: {} } : splitControlAttrs(rest, (key) => key !== 'class' && key !== 'style'));
    const panelClass = $derived([...TimePickerFoundation.getPanelClassNames({ prefixCls, format, use12Hours, type }), `${prefixCls}-panel-${size}`, popupClassName]);

    const triggerProps: TimePickerTriggerRenderProps = $derived({
        value: states().value,
        inputValue: states().inputValue,
        placeholder: shownPlaceholder,
        disabled,
        componentProps: {
            value,
            open,
            type,
            format,
            use12Hours,
            hourStep,
            minuteStep,
            secondStep,
            disabled,
            disabledHours,
            disabledMinutes,
            disabledSeconds,
            disabledTime,
            hideDisabledOptions,
            placeholder,
            rangeSeparator,
            size,
            borderless,
            showClear,
            inputReadOnly,
            validateStatus,
            insetLabelId,
            inputStyle,
            autofocus,
            focusOnOpen,
            preventScroll,
            motion,
            autoAdjustOverflow,
            position,
            popupClassName,
            popupStyle,
            stopPropagation,
            timeZone,
            scrollItemProps,
            onChange,
            onOpenChange,
            onFocus,
            onBlur,
        },
        onChange: foundation.handleInputChange,
    });

    setInputGroupContext(undefined);

    const panelFns = (index: number) => {
        return TimePickerFoundation.getDisabledTimeFns(foundationProps, states().value, index === 1 ? 'right' : 'left', isRange);
    };

    const handleRootClick = () => {
        if (trigger) {
            foundation.handlePanelOpen();
        }
    };

    const handleTriggerKeyDown = (event: KeyboardEvent) => {
        if (isTriggerButton && event.target === event.currentTarget) {
            foundation.handleTriggerKeyDown(event);
        }
    };

    useClickOutside([() => root, () => panelElement], foundation.handleClickOutside, () => shown, useNestedPopups());

    onMount(() => {
        if (trigger && triggerWrapper) {
            customTriggerFocusable = FocusTrapHandle.getFocusableElements(triggerWrapper).length > 0;
        }
    });

    /** Focuses the input, which opens the panel; with a custom trigger, its first focusable element or the wrapper. `preventScroll` applies */
    export function focus() {
        foundation.focus();
    }

    export function blur() {
        foundation.blur();
    }
</script>

{#snippet content()}
    <div bind:this={panelElement} class={{ [cssClasses.RANGE_PANEL_LISTS]: isRange }} id={panelId}>
        {#each isRange ? [0, 1] : [0] as index (index)}
            {@const header = isRange && panel ? panel : panelHeader}
            {@const footer = isRange && panel ? panel : panelFooter}
            {#snippet headerSnippet()}{@render header?.({ index })}{/snippet}
            {#snippet footerSnippet()}{@render footer?.({ index })}{/snippet}
            <Combobox
                {...panelFns(index)}
                defaultIsAM={index === 0}
                format={validFormat}
                {hideDisabledOptions}
                {hourStep}
                {minuteStep}
                onChange={(result) => foundation.handlePanelChange(result, index)}
                panelFooter={footer ? footerSnippet : undefined}
                panelHeader={header ? headerSnippet : isRange ? (index === 0 ? locale().locale.begin : locale().locale.end) : undefined}
                prefixCls={`${prefixCls}-panel`}
                {scrollItemProps}
                {secondStep}
                timeStampValue={states().value[index]}
                {use12Hours}
            />
        {/each}
    </div>
{/snippet}

<div bind:this={root} {...attrs.root} class={[prefixCls, rest.class]} role={trigger && (rest['aria-label'] || rest['aria-labelledby']) ? 'group' : undefined} onclick={handleRootClick}>
    <Popover aria-label={locale().locale.panel[type]} {autoAdjustOverflow} {content} contentClassName={panelClass} {motion} onEscKeyDown={foundation.handleEscKeyDown} position={popupPosition} {stopPropagation} style={popupStyle} trigger="custom" visible={shown}>
        {#snippet child({ props })}
            {#if trigger}
                <!-- the wrapper is the Tab stop and the button only while the trigger has no focus target of its own -->
                <div
                    bind:this={triggerWrapper}
                    {...props}
                    aria-controls={isTriggerButton ? panelId : undefined}
                    aria-disabled={isTriggerButton ? disabled : undefined}
                    aria-expanded={isTriggerButton ? shown : undefined}
                    aria-haspopup={isTriggerButton ? 'dialog' : undefined}
                    role={isTriggerButton ? 'button' : undefined}
                    tabindex={isTriggerButton && !disabled ? 0 : -1}
                    onkeydown={handleTriggerKeyDown}
                >
                    {@render trigger(triggerProps)}
                </div>
            {:else}
                <!-- the input is the Tab stop, not the header Tooltip binds to -->
                <span {...props} class={`${prefixCls}-header`} tabindex="-1">
                    <TimeInput
                        {...attrs.control}
                        aria-controls={panelId}
                        aria-expanded={shown}
                        aria-haspopup="dialog"
                        {autofocus}
                        {borderless}
                        {clearIcon}
                        {disabled}
                        {focusOnOpen}
                        {inputReadOnly}
                        {insetLabel}
                        {insetLabelId}
                        invalid={states().invalid}
                        onBlur={foundation.handleInputBlur}
                        onChange={foundation.handleInputChange}
                        onFocus={foundation.handleFocus}
                        placeholder={shownPlaceholder}
                        {prefix}
                        {preventScroll}
                        role="combobox"
                        showClear={disabled ? false : showClear}
                        {size}
                        style={inputStyle}
                        {validateStatus}
                        value={states().inputValue}
                    />
                </span>
            {/if}
        {/snippet}
    </Popover>
</div>
