<script setup lang="ts">
    import { computed, onBeforeUpdate, shallowRef, useAttrs, useId } from 'vue';
    import { isEqual } from 'es-toolkit';
    import type { CheckboxGroupView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
    import CheckboxGroupFoundation, { type CheckboxGroupAdapter } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
    import { checkboxGroupClasses, strings } from '@fibrae/semi-foundation/checkbox/constants';
    import '@fibrae/semi-foundation/checkbox/checkbox.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import Checkbox from './checkbox.vue';
    import { provideCheckboxGroupContext } from './context';
    import type { CheckboxGroupEmits, CheckboxGroupProps, CheckboxGroupSlots, CheckboxOptionItem, CheckboxValue } from './interface';

    interface FoundationProps extends CheckboxGroupProps {
        value?: CheckboxValue[];
    }

    interface GroupState {
        value?: CheckboxValue[];
    }

    type Foundation = CheckboxGroupFoundation<FoundationProps, GroupState>;
    type Adapter = CheckboxGroupAdapter<FoundationProps, GroupState>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<CheckboxGroupProps & /* @vue-ignore */ ElementProps<'div', keyof CheckboxGroupProps | EmitHandlers<CheckboxGroupEmits>>>(), {
        modelValue: undefined,
        defaultValue: () => semiDefault('CheckboxGroup', 'defaultValue', []),
        disabled: () => semiDefault('CheckboxGroup', 'disabled', false),
        name: semiGlobalDefault('CheckboxGroup', 'name'),
        options: semiGlobalDefault('CheckboxGroup', 'options'),
        direction: () => semiDefault('CheckboxGroup', 'direction', 'vertical'),
        type: () => semiDefault('CheckboxGroup', 'type', 'default'),
        prefixCls: semiGlobalDefault('CheckboxGroup', 'prefixCls'),
    });

    const emit = defineEmits<CheckboxGroupEmits>();
    defineSlots<CheckboxGroupSlots>();
    const attrs = useAttrs();

    // One name per group, so form submission never mixes groups.
    const generatedName = useId();

    // role="group" supports none of these. aria-invalid and aria-errormessage go to each checkbox (the role supports
    // them there); aria-required is dropped: on each checkbox it would mean every one is required, not "at least one".
    // Tooltip injects the rest for a dialog trigger, and tabindex would add a stray Tab stop.
    const DROPPED_ATTRS = new Set(['aria-invalid', 'aria-errormessage', 'aria-required', 'aria-expanded', 'aria-haspopup', 'aria-controls', 'tabindex', 'tabIndex']);

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, GroupState>(
        CheckboxGroupFoundation,
        props,
        (view) => ({ value: view.value || view.defaultValue }),
        (base) => ({
            updateGroupValue: (value) => base.setState({ value }),
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
        }),
        { props: { value: () => props.modelValue } }
    );

    const isPureCardType = computed(() => props.type === strings.TYPE_PURECARD);
    const isCardType = computed(() => props.type === strings.TYPE_CARD || isPureCardType.value);
    const prefix = computed(() => props.prefixCls || checkboxGroupClasses.PREFIX);

    const rootClass = computed(() => {
        const { direction } = props;
        return [prefix.value, `${prefix.value}-wrapper`, direction && `${prefix.value}-${direction}`, direction && isCardType.value && `${prefix.value}-${direction}-cardType`, direction && isPureCardType.value && `${prefix.value}-${direction}-pureCardType`];
    });

    const items = computed<CheckboxOptionItem[]>(() => (props.options ?? []).map((option) => (typeof option === 'string' ? { label: option, value: option } : option)));

    // Attrs are not reactive, but the group hands aria-invalid and aria-errormessage to its checkboxes: take them
    // before each re-render of the group so the checkboxes that read them refresh in the same flush.
    const pickAria = () => ({ invalid: attrs['aria-invalid'] as CheckboxGroupView['ariaInvalid'], errormessage: attrs['aria-errormessage'] as CheckboxGroupView['ariaErrormessage'] });

    const aria = shallowRef(pickAria());

    provideCheckboxGroupContext({
        view: computed<CheckboxGroupView>(() => ({
            value: CheckboxGroupFoundation.deriveValue({ value: props.modelValue }, state.value) ?? [],
            disabled: Boolean(props.disabled),
            name: props.name || generatedName,
            isCardType: isCardType.value,
            isPureCardType: isPureCardType.value,
            ariaInvalid: aria.value.invalid,
            ariaErrormessage: aria.value.errormessage,
        })),
        onChange: (event) => foundation.handleChange(event),
    });

    const rootAttrs = (a: Record<string, unknown>) => Object.fromEntries(Object.entries(a).filter(([key]) => !DROPPED_ATTRS.has(key)));

    // Moving between the boxes is not leaving the group: a form's blur validation waits until focus is outside.
    const handleFocusout = (event: FocusEvent) => {
        if (!(event.currentTarget as Element).contains(event.relatedTarget as Node | null)) {
            emit('blur', event);
        }
    };

    // Deep comparison: Tree and TreeSelect pass a new array on every render.
    useDidUpdate(
        () => props.modelValue,
        (value) => foundation.handlePropValueChange(value),
        isEqual,
        'pre'
    );

    onBeforeUpdate(() => {
        const next = pickAria();
        if (next.invalid !== aria.value.invalid || next.errormessage !== aria.value.errormessage) {
            aria.value = next;
        }
    });
</script>

<template>
    <div v-bind="rootAttrs($attrs)" :class="rootClass" role="group" @focusout="handleFocusout">
        <template v-if="props.options">
            <Checkbox v-for="(option, index) in items" :key="index" :class="option.class" :disabled="option.disabled || props.disabled" :prefixCls="props.prefixCls" :style="option.style" :value="option.value">
                <template v-if="option.label !== undefined || $slots.label" #default>
                    <slot :index="index" name="label" :option="option">{{ option.label }}</slot>
                </template>
                <template v-if="option.extra !== undefined || $slots.extra" #extra>
                    <slot :index="index" name="extra" :option="option">{{ option.extra }}</slot>
                </template>
            </Checkbox>
        </template>
        <slot v-else />
    </div>
</template>
