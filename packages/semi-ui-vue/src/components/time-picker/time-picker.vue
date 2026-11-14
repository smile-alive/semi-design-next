<script setup lang="ts">
    import { computed, onMounted, onUpdated, shallowRef, useAttrs, useId, useTemplateRef } from 'vue';
    import type { Locale } from 'date-fns';
    import { FocusTrapHandle } from '@fibrae/semi-foundation/base';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/time-picker/constants';
    import TimePickerFoundation, { type TimePickerAdapter } from '@fibrae/semi-foundation/components/time-picker/foundation';
    import { getDateFnsLocale } from '@fibrae/semi-foundation/utils/date-fns-locale';
    import '@fibrae/semi-foundation/components/time-picker/time-picker.scss';
    import { type ElementProps, type EmitHandlers, semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation, useKeepAliveFoundation } from '../../base/index';
    import { getDocument, useClickOutside, useEventListener } from '../../composables/index';
    import { isNotClassOrStyle, splitControlAttrs, hasSlotContent } from '../../utils/index';
    import useConfig from '../config-provider/use-config';
    import useGroupLooks from '../input/composables/use-group-looks';
    import { provideInputGroupContext } from '../input/context';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover/popover.vue';
    import { useNestedPopups } from '../tooltip/context';
    import Combobox from './combobox.vue';
    import type { TimePickerEmits, TimePickerHandle, TimePickerProps, TimePickerSlots, TimePickerState, TimePickerTriggerSlotProps } from './interface';
    import TimeInput from './time-input.vue';

    interface FoundationProps extends TimePickerProps {
        value?: TimePickerProps['modelValue'];
        dateFnsLocale?: Locale;
    }

    type Foundation = TimePickerFoundation<FoundationProps, FocusEvent>;
    type Adapter = TimePickerAdapter<FoundationProps, FocusEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TimePickerProps & /* @vue-ignore */ ElementProps<'input', keyof TimePickerProps | EmitHandlers<TimePickerEmits> | 'value'>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('TimePicker', 'defaultValue'),
        open: undefined,
        defaultOpen: () => semiDefault('TimePicker', 'defaultOpen', false),
        type: () => semiDefault('TimePicker', 'type', strings.DEFAULT_TYPE),
        format: semiGlobalDefault('TimePicker', 'format'),
        use12Hours: () => semiDefault('TimePicker', 'use12Hours', false),
        hourStep: semiGlobalDefault('TimePicker', 'hourStep'),
        minuteStep: semiGlobalDefault('TimePicker', 'minuteStep'),
        secondStep: semiGlobalDefault('TimePicker', 'secondStep'),
        disabled: undefined,

        // Function-typed props cannot take a factory default; global defaults are read in `disabledFns`
        disabledHours: undefined,
        disabledMinutes: undefined,
        disabledSeconds: undefined,
        disabledTime: undefined,
        hideDisabledOptions: () => semiDefault('TimePicker', 'hideDisabledOptions', false),
        placeholder: semiGlobalDefault('TimePicker', 'placeholder'),
        rangeSeparator: () => semiDefault('TimePicker', 'rangeSeparator', strings.DEFAULT_RANGE_SEPARATOR),
        size: undefined,
        borderless: () => semiDefault('TimePicker', 'borderless', false),
        showClear: () => semiDefault('TimePicker', 'showClear', true),
        inputReadOnly: () => semiDefault('TimePicker', 'inputReadOnly', false),
        validateStatus: semiGlobalDefault('TimePicker', 'validateStatus'),
        insetLabelId: undefined,
        classNames: semiGlobalDefault('TimePicker', 'classNames'),
        styles: semiGlobalDefault('TimePicker', 'styles'),
        autofocus: () => semiDefault('TimePicker', 'autofocus', false),
        focusOnOpen: () => semiDefault('TimePicker', 'focusOnOpen', false),
        preventScroll: semiGlobalDefault('TimePicker', 'preventScroll'),

        motion: () => semiDefault('TimePicker', 'motion', true),
        autoAdjustOverflow: () => semiDefault('TimePicker', 'autoAdjustOverflow', true),
        position: semiGlobalDefault('TimePicker', 'position'),
        stopPropagation: () => semiDefault('TimePicker', 'stopPropagation', true),
        timeZone: undefined,
        scrollItemProps: semiGlobalDefault('TimePicker', 'scrollItemProps'),
    });

    const emit = defineEmits<TimePickerEmits>();
    const slots = defineSlots<TimePickerSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('TimePicker');

    const root = useTemplateRef('root');
    const panel = useTemplateRef('panel');
    const trigger = useTemplateRef('trigger');
    const panelId = useId();

    // A #trigger is user markup: only the rendered DOM tells whether it brings its own focus target.
    // Known limitation: measured only after this component renders; a trigger child that later updates its own DOM
    // leaves the measurement stale. Upgrade to a MutationObserver on the wrapper if such triggers need support.
    const customTriggerFocusable = shallowRef(false);

    const looks = useGroupLooks('TimePicker', props, { size: 'default', disabled: false });

    const prefix = cssClasses.PREFIX;
    const timeZone = computed(() => props.timeZone ?? config.value.timeZone ?? readSemiDefault(semi, 'TimePicker', 'timeZone'));
    const isRange = computed(() => props.type === strings.TYPE_TIME_RANGE_PICKER);
    const format = computed(() => TimePickerFoundation.getValidFormat(props));
    const position = computed(() => TimePickerFoundation.getPosition(props, config.value.direction));
    const placeholder = computed(() => props.placeholder ?? locale.value.locale.placeholder[props.type]);
    const panelClass = computed(() => [...TimePickerFoundation.getPanelClassNames({ prefixCls: prefix, format: props.format, use12Hours: props.use12Hours, type: props.type }), `${prefix}-panel-${looks.size}`, props.classNames?.dropdown]);

    // the Input inside is part of this control, not a member of the group
    provideInputGroupContext(undefined);

    // Not computed: global defaults are not reactive
    const disabledFns = () => ({
        disabledHours: props.disabledHours ?? readSemiDefault(semi, 'TimePicker', 'disabledHours'),
        disabledMinutes: props.disabledMinutes ?? readSemiDefault(semi, 'TimePicker', 'disabledMinutes'),
        disabledSeconds: props.disabledSeconds ?? readSemiDefault(semi, 'TimePicker', 'disabledSeconds'),
        disabledTime: props.disabledTime ?? readSemiDefault(semi, 'TimePicker', 'disabledTime'),
        timeZone: timeZone.value,
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, TimePickerState>(
        TimePickerFoundation,
        props,
        (view) => TimePickerFoundation.getInitialState(view),
        () => ({
            notifyOpenChange: (open) => {
                emit('update:open', open);
                emit('openChange', open);
            },
            notifyChange: (value, str) => {
                emit('update:modelValue', value);
                emit('change', value, str);
            },
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            isKeyboardFocusInPanel: () => FocusTrapHandle.isFocusVisibleWithin(panel.value),
            setTriggerFocus: () => FocusTrapHandle.focusFirstOrSelf(root.value, { preventScroll: props.preventScroll }),
            blurFocusedElement: () => {
                const active = FocusTrapHandle.getActiveElement(root.value);
                if (active && (root.value?.contains(active) || panel.value?.contains(active))) {
                    active.blur();
                }
            },
        }),
        {
            props: {
                size: () => looks.size,
                disabled: () => looks.disabled,
                value: () => props.modelValue,
                timeZone: () => timeZone.value,
                dateFnsLocale: () => getDateFnsLocale(locale.value.localeCode, config.value.dateFnsLocale),
                disabledHours: () => disabledFns().disabledHours,
                disabledMinutes: () => disabledFns().disabledMinutes,
                disabledSeconds: () => disabledFns().disabledSeconds,
                disabledTime: () => disabledFns().disabledTime,
            },
        }
    );

    const open = computed(() => TimePickerFoundation.isPanelShown({ ...props, disabled: looks.disabled }, state.value));

    const panelFns = (index: number) => TimePickerFoundation.getDisabledTimeFns(disabledFns(), state.value.value, index === 1 ? 'right' : 'left', isRange.value);

    const hasPanel = (index: number) => isRange.value && hasSlotContent(() => slots.panel?.({ index }) ?? []);

    const rootRole = () => (slots.trigger && (attrs['aria-label'] || attrs['aria-labelledby']) ? 'group' : undefined);

    const onRootClick = () => {
        if (slots.trigger) {
            foundation.handlePanelOpen();
        }
    };

    const measureCustomTrigger = () => {
        if (slots.trigger && trigger.value) {
            customTriggerFocusable.value = FocusTrapHandle.getFocusableElements(trigger.value).length > 0;
        }
    };

    // Without a focus target of its own, the #trigger's wrapper is the Tab stop and acts as the button that opens the
    // panel. Slots are not reactive, so this is read while rendering.
    const isTriggerButton = () => Boolean(slots.trigger) && !customTriggerFocusable.value;

    const onTriggerKeyDown = (event: KeyboardEvent) => {
        if (isTriggerButton() && event.target === event.currentTarget) {
            foundation.handleTriggerKeyDown(event);
        }
    };

    const triggerSlotProps = (): TimePickerTriggerSlotProps => ({
        value: state.value.value,
        inputValue: state.value.inputValue,
        placeholder: placeholder.value,
        disabled: looks.disabled,
        componentProps: { ...props, ...looks },
        onChange: foundation.handleInputChange,
    });

    useKeepAliveFoundation(foundation);
    useClickOutside([root, panel], foundation.handleClickOutside, open, useNestedPopups());
    useEventListener(getDocument, 'focusin', (e) => foundation.handleDocumentFocusIn(e, root.value), { enabled: open });

    onMounted(measureCustomTrigger);
    onUpdated(measureCustomTrigger);

    defineExpose<TimePickerHandle>({ focus: foundation.focus, blur: foundation.blur });
</script>

<template>
    <div ref="root" v-bind="$slots.trigger ? $attrs : splitControlAttrs($attrs, isNotClassOrStyle).root" :class="prefix" :role="rootRole()" @click="onRootClick">
        <Popover
            :ariaLabel="locale.locale.panel[props.type]"
            :autoAdjustOverflow="props.autoAdjustOverflow"
            :classNames="{ content: panelClass }"
            :motion="props.motion"
            :position="position"
            :stopPropagation="props.stopPropagation"
            :styles="{ content: props.styles?.dropdown }"
            trigger="custom"
            :visible="open"
            @escKeyDown="foundation.handleEscKeyDown"
        >
            <template #content>
                <div :id="panelId" ref="panel" :class="{ [cssClasses.RANGE_PANEL_LISTS]: isRange }">
                    <Combobox
                        v-for="index in isRange ? [0, 1] : [0]"
                        :key="index"
                        v-bind="panelFns(index)"
                        :defaultIsAM="index === 0"
                        :format="format"
                        :hideDisabledOptions="props.hideDisabledOptions"
                        :hourStep="props.hourStep"
                        :minuteStep="props.minuteStep"
                        :prefixCls="`${prefix}-panel`"
                        :scrollItemProps="props.scrollItemProps"
                        :secondStep="props.secondStep"
                        :timeStampValue="state.value[index]"
                        :use12Hours="props.use12Hours"
                        @change="foundation.handlePanelChange($event, index)"
                    >
                        <template #panelHeader>
                            <slot v-if="hasPanel(index)" :index="index" name="panel" />
                            <slot v-else-if="$slots.panelHeader" :index="index" name="panelHeader" />
                            <template v-else-if="isRange">
                                {{ index === 0 ? locale.locale.begin : locale.locale.end }}
                            </template>
                        </template>
                        <template #panelFooter>
                            <slot v-if="hasPanel(index)" :index="index" name="panel" />
                            <slot v-else :index="index" name="panelFooter" />
                        </template>
                    </Combobox>
                </div>
            </template>
            <!-- the wrapper is what Popover binds to; Tooltip would add tabindex 0 here -->
            <div
                v-if="$slots.trigger"
                ref="trigger"
                :aria-controls="isTriggerButton() && open ? panelId : undefined"
                :aria-disabled="isTriggerButton() ? looks.disabled : undefined"
                :aria-expanded="isTriggerButton() ? open : undefined"
                :aria-haspopup="isTriggerButton() ? 'dialog' : undefined"
                :role="isTriggerButton() ? 'button' : undefined"
                :tabindex="isTriggerButton() && !looks.disabled ? 0 : -1"
                @keydown="onTriggerKeyDown"
            >
                <slot name="trigger" v-bind="triggerSlotProps()" />
            </div>
            <!-- the input is the Tab stop; Tooltip would add tabindex 0 here -->
            <span v-else :class="`${prefix}-header`" tabindex="-1">
                <TimeInput
                    v-bind="splitControlAttrs($attrs, isNotClassOrStyle).control"
                    :aria-controls="open ? panelId : undefined"
                    :aria-expanded="open"
                    aria-haspopup="dialog"
                    :autofocus="props.autofocus"
                    :borderless="props.borderless"
                    :class="props.classNames?.input"
                    :disabled="looks.disabled"
                    :focusOnOpen="props.focusOnOpen"
                    :inputReadOnly="props.inputReadOnly"
                    :insetLabelId="props.insetLabelId"
                    :invalid="state.invalid"
                    :modelValue="state.inputValue"
                    :placeholder="placeholder || locale.locale.placeholder[props.type]"
                    :preventScroll="props.preventScroll"
                    role="combobox"
                    :showClear="looks.disabled ? false : props.showClear"
                    :size="looks.size"
                    :style="props.styles?.input"
                    :validateStatus="props.validateStatus"
                    @blur="foundation.handleInputBlur"
                    @focus="foundation.handleFocus"
                    @update:modelValue="foundation.handleInputChange"
                >
                    <template v-if="$slots.prefix" #prefix>
                        <slot name="prefix" />
                    </template>
                    <template v-if="$slots.insetLabel" #insetLabel>
                        <slot name="insetLabel" />
                    </template>
                    <template v-if="$slots.clearIcon" #clearIcon>
                        <slot name="clearIcon" />
                    </template>
                </TimeInput>
            </span>
        </Popover>
    </div>
</template>
