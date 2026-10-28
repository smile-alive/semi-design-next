<script setup lang="ts">
    import { computed, nextTick, onBeforeUnmount, onMounted, useAttrs, useId, useTemplateRef, watch, type InputHTMLAttributes } from 'vue';
    import { radioClasses } from '@fibrae/semi-foundation/radio/constants';
    import RadioFoundation, { type RadioAdapter, type RadioBaseState, type RadioChangeEvent as FoundationRadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/radio/radio.scss';
    import { IconRadio } from '@fibrae/semi-icons-vue';
    import { hasAutofocus, vAutofocus } from '../_base/autofocus';
    import { isNativeInputKey, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import { useRadioGroupContext } from './context';
    import type { RadioChangeEvent, RadioEmits, RadioHandle, RadioProps, RadioSlots, RadioValue } from './interface';

    interface FoundationProps extends RadioProps {
        checked?: boolean;
        name?: string;
    }

    type Foundation = RadioFoundation<FoundationProps, RadioBaseState>;
    type Adapter = RadioAdapter<FoundationProps, RadioBaseState>;

    defineOptions({ inheritAttrs: false });

    // name and autofocus reach the inner input, which the label's attributes do not cover
    const props = withDefaults(defineProps<RadioProps & /* @vue-ignore */ ElementProps<'label', keyof RadioProps | EmitHandlers<RadioEmits>> & /* @vue-ignore */ Pick<InputHTMLAttributes, 'name' | 'autofocus'>>(), {
        modelValue: undefined,
        defaultChecked: () => semiDefault('Radio', 'defaultChecked', false),
        // Boolean-typed: without a default key Vue reads an omitted value as false, which a group would match.
        value: undefined,
        disabled: semiGlobalDefault('Radio', 'disabled'),
        displayMode: semiGlobalDefault('Radio', 'displayMode'),
        mode: () => semiDefault('Radio', 'mode', ''),
        type: () => semiDefault('Radio', 'type', 'default'),
        addonStyle: semiGlobalDefault('Radio', 'addonStyle'),
        addonClassName: semiGlobalDefault('Radio', 'addonClassName'),
        addonId: undefined,
        extraId: undefined,
        // Literal undefined: the group's prefixCls must rank above the global default, so the fallback is in `view`.
        prefixCls: undefined,
        preventScroll: semiGlobalDefault('Radio', 'preventScroll'),
    });

    const emit = defineEmits<RadioEmits>();
    const slots = defineSlots<RadioSlots>();
    const attrs = useAttrs();

    const group = useRadioGroupContext();
    const semi = useSemiGlobal();

    const inputRef = useTemplateRef('input');
    const uid = useId();
    const UNSUPPORTED_ARIA = new Set(['aria-invalid', 'aria-errormessage', 'aria-required']);

    const ownPrefixCls = computed(() => props.prefixCls ?? readSemiDefault(semi, 'Radio', 'prefixCls'));
    const innerPrefix = computed(() => ownPrefixCls.value || radioClasses.PREFIX);
    const addonId = computed(() => props.addonId || `addon-${uid}`);
    const extraId = computed(() => props.extraId || `extra-${uid}`);

    const pick = (event: FoundationRadioChangeEvent): RadioChangeEvent => ({
        target: {
            checked: event.target.checked,
            value: event.target.value as RadioValue | undefined,
            name: event.target.name as string | undefined,
            disabled: Boolean(event.target.disabled),
        },
        stopPropagation: event.stopPropagation,
        preventDefault: event.preventDefault,
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, RadioBaseState>(
        RadioFoundation,
        props,
        (view) => RadioFoundation.getInitialState(view),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyGroupChange: (event) => group?.onChange(pick(event)),
            notifyChange: (event) => {
                const picked = pick(event);
                emit('update:modelValue', picked.target.checked);
                emit('change', picked);
            },
            getInput: () => inputRef.value,
        }),
        {
            props: { checked: () => props.modelValue, name: () => attrs.name as string | undefined },
            context: () => (group ? { mode: group.view.value.mode, radioGroup: group.view.value } : null),
        }
    );

    const view = computed(() =>
        RadioFoundation.deriveView(
            {
                checked: props.modelValue,
                disabled: props.disabled,
                mode: props.mode,
                prefixCls: props.prefixCls ?? group?.view.value.prefixCls ?? readSemiDefault(semi, 'Radio', 'prefixCls'),
                type: props.type,
                value: props.value,
            },
            state.value,
            group ? { mode: group.view.value.mode, radioGroup: group.view.value } : null
        )
    );

    const prefix = computed(() => view.value.prefixCls || radioClasses.PREFIX);

    // The radio role supports neither aria-invalid, aria-errormessage nor aria-required (they belong on the radiogroup).
    const controlAttrs = (a: Record<string, unknown>) => Object.fromEntries(Object.entries(splitControlAttrs(a, isNativeInputKey).control).filter(([key]) => !UNSUPPORTED_ARIA.has(key)));

    const hasExtra = () => Boolean(slots.extra) && !view.value.isButtonRadio;

    const labelledby = (a: Record<string, unknown>) => joinIds(a['aria-labelledby'], slots.default ? addonId.value : undefined);

    const describedby = (a: Record<string, unknown>) => joinIds(a['aria-describedby'], hasExtra() ? extraId.value : undefined, a['aria-invalid'] ? a['aria-errormessage'] : undefined);

    const inputName = () => (attrs.name as string | undefined) ?? group?.view.value.name;

    // The browser repeats a click on the label text as a click on the input, so the owner's onClick is forwarded for the
    // input's click only. shortcut: listeners with .once, .capture or .passive modifiers keep the label-level call;
    // wrap the onClickOnce, onClickCapture and onClickPassive keys the same way once a consumer relies on those modifiers.
    const rootAttrs = () => {
        const { onClick, ...root } = splitControlAttrs(attrs, isNativeInputKey).root;
        if (!onClick) return root;
        const listeners = [onClick].flat() as ((event: MouseEvent) => void)[];
        return {
            ...root,
            onClick: (event: MouseEvent) => {
                if (event.target === inputRef.value) listeners.forEach((listener) => listener(event));
            },
        };
    };

    // A native radio checks itself and unchecks its same-name siblings on click. Vue does not patch a value that did
    // not change, so when the owner refuses the change the DOM is written back once rendering has settled.
    const sync = () => {
        if (inputRef.value) {
            inputRef.value.checked = view.value.checked;
        }
    };

    const requestSync = () => (group ? group.sync() : void nextTick(sync));

    let unregister = () => {};

    const handleChange = (event: Event) => {
        foundation.handleChange((event.target as HTMLInputElement).checked, event);
        requestSync();
    };

    const handleClick = (event: MouseEvent) => {
        // Clicking an unchecked radio is followed by a change event; writing back before it would hide the new state.
        const wasChecked = view.value.checked;
        foundation.handleClick(event);
        if (wasChecked) {
            requestSync();
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const wasChecked = view.value.checked;
        foundation.handleKeyUp(event);
        if (wasChecked) {
            requestSync();
        }
    };

    watch(
        () => props.modelValue,
        (value) => foundation.setChecked(Boolean(value))
    );

    onMounted(() => {
        unregister = group?.register(sync) ?? unregister;
    });

    onBeforeUnmount(() => unregister());

    defineExpose<RadioHandle>({
        focus: () => inputRef.value?.focus({ preventScroll: props.preventScroll }),
        blur: () => inputRef.value?.blur(),
    });
</script>

<template>
    <label
        v-bind="rootAttrs()"
        :class="[
            prefix,
            {
                [`${prefix}-disabled`]: view.disabled,
                [`${prefix}-checked`]: view.checked,
                [`${prefix}-${props.displayMode}`]: Boolean(props.displayMode),
                [`${prefix}-buttonRadioComponent`]: !view.inGroup && view.isButtonRadio,
                [`${prefix}-buttonRadioGroup`]: view.isButtonRadio,
                [`${prefix}-buttonRadioGroup-${view.buttonSize}`]: view.isButtonRadio && view.buttonSize,
                [`${prefix}-cardRadioGroup`]: view.isCardRadio,
                [`${prefix}-cardRadioGroup_disabled`]: view.disabled && view.isCardRadio,
                [`${prefix}-cardRadioGroup_checked`]: view.isCardRadio && view.checked && !view.disabled,
                [`${prefix}-cardRadioGroup_checked_disabled`]: view.isCardRadio && view.checked && view.disabled,
            },
        ]"
    >
        <span
            :class="[
                `${innerPrefix}-inner`,
                {
                    [`${innerPrefix}-inner-checked`]: view.checked,
                    [`${innerPrefix}-inner-buttonRadio`]: view.isButtonRadio,
                    [`${innerPrefix}-inner-pureCardRadio`]: view.isPureCardRadio,
                },
            ]"
        >
            <input
                ref="input"
                v-autofocus="hasAutofocus($attrs)"
                v-bind="controlAttrs($attrs)"
                :aria-describedby="describedby($attrs)"
                :aria-labelledby="labelledby($attrs)"
                :checked="view.checked"
                :disabled="view.disabled"
                :name="inputName()"
                type="radio"
                :value="props.value === undefined ? undefined : String(props.value)"
                @change="handleChange"
                @click="handleClick"
                @keyup="handleKeyUp"
            />
            <span :class="{ [`${innerPrefix}-inner-display`]: !view.isButtonRadio }">
                <IconRadio v-if="view.checked" />
            </span>
        </span>
        <div v-if="$slots.default || $slots.extra" :class="[`${prefix}-content`, { [`${prefix}-isCardRadioGroup_content`]: view.isCardRadio }]">
            <span
                v-if="$slots.default"
                :id="addonId"
                :class="[
                    props.addonClassName,
                    {
                        [`${prefix}-addon`]: !view.isButtonRadio,
                        [`${prefix}-addon-buttonRadio`]: view.isButtonRadio,
                        [`${prefix}-addon-buttonRadio-checked`]: view.isButtonRadio && view.checked,
                        [`${prefix}-addon-buttonRadio-disabled`]: view.isButtonRadio && view.disabled,
                        [`${prefix}-addon-buttonRadio-${view.buttonSize}`]: view.isButtonRadio && view.buttonSize,
                    },
                ]"
                :style="props.addonStyle"
                x-semi-prop="children"
            >
                <slot />
            </span>
            <div v-if="$slots.extra && !view.isButtonRadio" :id="extraId" :class="`${prefix}-extra`" x-semi-prop="extra">
                <slot name="extra" />
            </div>
        </div>
    </label>
</template>
