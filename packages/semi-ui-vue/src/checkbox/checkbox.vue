<script setup lang="ts">
    import { computed, useAttrs, useId, useTemplateRef, watch, type ComputedRef, type InputHTMLAttributes } from 'vue';
    import CheckboxFoundation, { type BasicCheckboxEvent, type CheckboxAdapter, type CheckboxBaseState, type CheckboxView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
    import { checkboxClasses } from '@fibrae/semi-foundation/checkbox/constants';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
    import '@fibrae/semi-foundation/checkbox/checkbox.scss';
    import { IconCheckboxIndeterminate, IconCheckboxTick } from '@fibrae/semi-icons-vue';
    import { hasAutofocus, vAutofocus } from '../_base/autofocus';
    import { isNativeInputKey, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import { useCheckboxGroupContext } from './context';
    import type { CheckboxEmits, CheckboxEvent, CheckboxHandle, CheckboxProps, CheckboxSlots } from './interface';

    interface FoundationProps extends CheckboxProps {
        checked?: boolean;
        name?: string;
    }

    type Foundation = CheckboxFoundation<FoundationProps, CheckboxBaseState>;
    type Adapter = CheckboxAdapter<FoundationProps, CheckboxBaseState>;

    defineOptions({ inheritAttrs: false });

    // name and autofocus reach the inner input, which the span's attributes do not cover
    const props = withDefaults(defineProps<CheckboxProps & /* @vue-ignore */ ElementProps<'span', keyof CheckboxProps | EmitHandlers<CheckboxEmits>> & /* @vue-ignore */ Pick<InputHTMLAttributes, 'name' | 'autofocus'>>(), {
        modelValue: undefined,
        defaultChecked: () => semiDefault('Checkbox', 'defaultChecked', false),
        // Boolean-typed: without a default key Vue reads an omitted value as false and every checkbox would join a group.
        value: undefined,
        disabled: semiGlobalDefault('Checkbox', 'disabled'),
        indeterminate: () => semiDefault('Checkbox', 'indeterminate', false),
        type: () => semiDefault('Checkbox', 'type', 'default'),
        addonId: undefined,
        extraId: undefined,
        prefixCls: semiGlobalDefault('Checkbox', 'prefixCls'),
        preventScroll: semiGlobalDefault('Checkbox', 'preventScroll'),
    });

    const emit = defineEmits<CheckboxEmits>();
    const slots = defineSlots<CheckboxSlots>();
    const attrs = useAttrs();

    const group = useCheckboxGroupContext();

    const inputRef = useTemplateRef('input');
    const uid = useId();

    const prefix = computed(() => props.prefixCls || checkboxClasses.PREFIX);
    const addonId = computed(() => props.addonId || `addon-${uid}`);
    const extraId = computed(() => props.extraId || `extra-${uid}`);

    const inputName = () => (view.value.inGroup ? view.value.name : (attrs.name as string | undefined)) || undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, CheckboxBaseState>(
        CheckboxFoundation,
        props,
        (view) => ({ checked: Boolean(view.checked ?? view.defaultChecked) }),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyChange: (event: BasicCheckboxEvent) => {
                emit('update:modelValue', event.target.checked);
                emit('change', event as CheckboxEvent);
            },
            generateEvent: (checked, event) => ({
                target: { checked, value: props.value, name: inputName(), disabled: view.value.disabled },
                stopPropagation: () => event.stopPropagation(),
                preventDefault: () => event.preventDefault(),
                nativeEvent: event as MouseEvent,
            }),
            getIsInGroup: () => view.value.inGroup,
            getGroupValue: () => group?.view.value.value ?? [],
            notifyGroupChange: (event) => group?.onChange(event),
            getGroupDisabled: () => Boolean(group?.view.value.disabled),
            // A click on the text lands on the wrapper, not the input. Script focus matches :focus-visible when nothing
            // was focused before, so the focus a click moves in must say it is not keyboard focus.
            focusCheckboxEntity: () => {
                const input = inputRef.value;
                if (input && input !== input.ownerDocument.activeElement) {
                    focusWithoutRing(input, { preventScroll: props.preventScroll });
                }
            },
        }),
        { props: { checked: () => props.modelValue, name: () => attrs.name as string | undefined } }
    );

    // name and the aria attributes are read from the attrs at render time: attrs are not reactive, so a cached view would go stale
    // annotated because the adapter above reads it: inferring it would be circular
    const view: ComputedRef<CheckboxView> = computed(() => CheckboxFoundation.deriveView({ checked: props.modelValue, disabled: props.disabled, type: props.type, value: props.value }, state.value, group?.view.value));
    const checked = computed(() => view.value.checked);
    const disabled = computed(() => view.value.disabled);
    const isCardType = computed(() => view.value.isCardType);
    const isPureCardType = computed(() => view.value.isPureCardType);

    // The native flag is what assistive technology reads as "mixed"; a checked box is never mixed.
    const showMixed = computed(() => props.indeterminate && !checked.value);

    const labelledby = (a: Record<string, unknown>) => joinIds(a['aria-labelledby'], slots.default ? addonId.value : undefined);

    const describedby = (a: Record<string, unknown>) => joinIds(a['aria-describedby'], slots.extra ? extraId.value : undefined);

    const ariaInvalid = (a: Record<string, unknown>) => (a['aria-invalid'] ?? view.value.ariaInvalid) as CheckboxView['ariaInvalid'];

    const ariaErrormessage = (a: Record<string, unknown>) => (a['aria-errormessage'] ?? view.value.ariaErrormessage) as CheckboxView['ariaErrormessage'];

    // The root is a span rather than a label so that text clicks and box clicks share this one handler (gitlab #364).
    // Links and buttons inside the label content keep their own behavior, as inside a native label.
    const handleClick = (event: MouseEvent) => {
        if (CheckboxFoundation.isInnerInteractiveClick(event.target as Element, event.currentTarget as Element, inputRef.value)) {
            return;
        }
        foundation.handleChange(event);
    };

    // The click already ran the foundation and the browser cleared the native flags; Vue does not patch a value that
    // did not change, so a controlled box that refused the toggle is put back here.
    const handleInputChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        input.checked = checked.value;
        input.indeterminate = showMixed.value;
    };

    watch(
        () => props.modelValue,
        (value) => foundation.setChecked(Boolean(value))
    );

    defineExpose<CheckboxHandle>({
        focus: () => inputRef.value?.focus({ preventScroll: props.preventScroll }),
        blur: () => inputRef.value?.blur(),
    });
</script>

<template>
    <span
        v-bind="splitControlAttrs($attrs, isNativeInputKey).root"
        :class="[
            prefix,
            {
                [`${prefix}-disabled`]: disabled,
                [`${prefix}-indeterminate`]: props.indeterminate,
                [`${prefix}-checked`]: checked,
                [`${prefix}-unChecked`]: !checked,
                [`${prefix}-cardType`]: isCardType,
                [`${prefix}-cardType_disabled`]: disabled && isCardType,
                [`${prefix}-cardType_enable`]: !(disabled && isCardType),
                [`${prefix}-cardType_checked`]: isCardType && checked && !disabled,
                [`${prefix}-cardType_checked_disabled`]: isCardType && checked && disabled,
            },
        ]"
        @click="handleClick"
    >
        <span :class="[`${prefix}-inner`, { [`${prefix}-inner-checked`]: checked, [`${prefix}-inner-pureCardType`]: isPureCardType }]">
            <input
                ref="input"
                v-autofocus="hasAutofocus($attrs)"
                v-bind="splitControlAttrs($attrs, isNativeInputKey).control"
                :aria-describedby="describedby($attrs)"
                :aria-errormessage="ariaErrormessage($attrs)"
                :aria-invalid="ariaInvalid($attrs)"
                :aria-labelledby="labelledby($attrs)"
                :checked="checked"
                :class="checkboxClasses.INPUT"
                :disabled="disabled"
                :indeterminate="showMixed"
                :name="inputName()"
                type="checkbox"
                :value="props.value === undefined ? undefined : String(props.value)"
                @change="handleInputChange"
            />
            <span :class="`${prefix}-inner-display`">
                <IconCheckboxTick v-if="checked" />
                <IconCheckboxIndeterminate v-else-if="props.indeterminate" />
            </span>
        </span>
        <div v-if="$slots.default || $slots.extra" :class="`${prefix}-content`">
            <span v-if="$slots.default" :id="addonId" :class="`${prefix}-addon`" x-semi-prop="children">
                <slot />
            </span>
            <div v-if="$slots.extra" :id="extraId" :class="[`${prefix}-extra`, { [`${prefix}-cardType_extra_noChildren`]: isCardType && !$slots.default }]" x-semi-prop="extra">
                <slot name="extra" />
            </div>
        </div>
    </span>
</template>
