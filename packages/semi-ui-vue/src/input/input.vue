<script setup lang="ts">
    import { computed, shallowRef, useAttrs, useId, useTemplateRef, watch, type InputHTMLAttributes } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import InputFoundation, { type InputAdapter } from '@fibrae/semi-foundation/input/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/input/input.scss';
    import { IconClear, IconEyeClosedSolid, IconEyeOpened } from '@fibrae/semi-icons-vue';
    import { isNotClassOrStyle, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import slotKind from '../_base/slot-kind';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import type { InputEmits, InputHandle, InputProps, InputSlots, InputState } from './interface';
    import { defersUpdate } from './model-modifiers';
    import useGroupLooks from './use-group-looks';
    import useTextEntry from './use-text-entry';

    interface FoundationProps extends InputProps {
        value?: string | number;
        maxLength?: number;
        minLength?: number;
    }

    type Foundation = InputFoundation<FoundationProps, InputState, KeyboardEvent, CompositionEvent, Event>;
    type Adapter = InputAdapter<FoundationProps, InputState, KeyboardEvent, CompositionEvent, Event>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<InputProps & /* @vue-ignore */ ElementProps<'input', keyof InputProps | EmitHandlers<InputEmits> | 'value'>>(), {
        modelValue: undefined,
        modelModifiers: undefined,
        defaultValue: semiGlobalDefault('Input', 'defaultValue'),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        size: undefined,
        type: () => semiDefault('Input', 'type', 'text'),
        mode: semiGlobalDefault('Input', 'mode'),
        disabled: undefined,
        readonly: () => semiDefault('Input', 'readonly', false),
        borderless: () => semiDefault('Input', 'borderless', false),
        showClear: () => semiDefault('Input', 'showClear', false),
        hideSuffix: () => semiDefault('Input', 'hideSuffix', false),
        showClearIgnoreDisabled: semiGlobalDefault('Input', 'showClearIgnoreDisabled'),
        composition: () => semiDefault('Input', 'composition', false),
        preventScroll: semiGlobalDefault('Input', 'preventScroll'),
        autofocus: semiGlobalDefault('Input', 'autofocus'),
        placeholder: semiGlobalDefault('Input', 'placeholder'),
        validateStatus: () => semiDefault('Input', 'validateStatus', 'default'),
        inputStyle: semiGlobalDefault('Input', 'inputStyle'),
        insetLabelId: undefined,
        getValueLength: undefined,
    });

    const emit = defineEmits<InputEmits>();
    const slots = defineSlots<InputSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('Input');

    const root = useTemplateRef('root');
    const inputEl = useTemplateRef('input');
    const clearButton = useTemplateRef('clearButton');

    // The typed value `.lazy` holds back until the native change event. Reactive so that any re-render keeps showing it
    // instead of patching the input back to modelValue.
    const draft = shallowRef<string>();

    const looks = useGroupLooks('Input', props, { size: 'default' });

    const prefix = cssClasses.PREFIX;
    const getLength = computed(() => props.getValueLength ?? readSemiDefault(semi, 'Input', 'getValueLength'));

    const focusInput = () => inputEl.value?.focus({ preventScroll: props.preventScroll });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, InputState>(
        InputFoundation,
        props,
        (view) => ({
            value: view.value === undefined ? view.defaultValue : view.value,
            cachedValue: view.value,
            isFocus: false,
            eyeClosed: view.mode === 'password',
        }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            setEyeClosed: (eyeClosed) => base.setState({ eyeClosed }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            focusInput,
            notifyChange: (value, event) => {
                if (defersUpdate(event, props.modelModifiers)) {
                    draft.value = value;
                } else {
                    draft.value = undefined;
                    emit('update:modelValue', value);
                }
                emit('change', value, event);
            },
            notifyBlur: (_, event) => emit('blur', event),
            notifyFocus: (_, event) => emit('focus', event),
            notifyInput: (event) => emit('input', event),
            notifyKeyDown: (event) => emit('keydown', event),
            notifyKeyUp: (event) => emit('keyup', event),
            notifyEnterPress: (event) => emit('enterPress', event),
            notifyClear: (event) => emit('clear', event),
            notifyCompositionStart: (event) => emit('compositionstart', event),
            notifyCompositionEnd: (event) => emit('compositionend', event),
            notifyCompositionUpdate: (event) => emit('compositionupdate', event),
            isEventTarget: (event) => event.target === event.currentTarget,
        }),
        {
            props: {
                size: () => looks.size,
                disabled: () => looks.disabled,
                value: () => props.modelValue,
                maxLength: () => props.maxlength,
                minLength: () => props.minlength,
                getValueLength: () => getLength.value,
            },
        }
    );

    const value = computed(() => InputFoundation.deriveValue({ value: props.modelValue }, state.value));
    const shown = computed(() => draft.value ?? value.value);

    const { elementText, runInput, handleCompositionEnd, commitDraft, handleFocusIn, handleFocusOut } = useTextEntry({
        element: inputEl,
        draft,
        props,
        shown,
        foundation,
        emitUpdate: (value) => emit('update:modelValue', value),
    });

    const allowClear = computed(() => InputFoundation.isAllowClear({ ...props, disabled: looks.disabled }, shown.value));

    const handleInput = (event: Event) =>
        runInput(event, () => {
            foundation.handleInput(event);
            foundation.handleChange((event.target as HTMLInputElement).value, event);
        });

    // the primary button clears on mousedown (issue 1203) without moving focus; the others only keep focus where it is
    const handleClearMouseDown = (event: MouseEvent) => {
        if (event.button === 0) {
            foundation.handleClear(event);
        }
    };

    // keyboard activation (detail 0): focus returns to the input as the button unmounts
    const handleClearClick = (event: MouseEvent) => {
        if (event.detail === 0) {
            foundation.handleClear(event);
            focusInput();
        }
    };

    const insetLabelShown = () => Boolean(slotKind(slots.insetLabel)) && !slotKind(slots.prefix);

    const ariaInvalid = () => (props.validateStatus === 'error' ? 'true' : attrs['aria-invalid']) as InputHTMLAttributes['aria-invalid'];

    const kinds = () => ({
        prefix: slotKind(slots.prefix),
        insetLabel: slotKind(slots.insetLabel),
        suffix: slotKind(slots.suffix),
        addonBefore: slotKind(slots.addonBefore),
        addonAfter: slotKind(slots.addonAfter),
    });

    const wrapperClass = (k: ReturnType<typeof kinds>) => {
        const wrapper = `${prefix}-wrapper`;
        return [
            wrapper,
            {
                [`${wrapper}__with-prefix`]: Boolean(k.prefix || k.insetLabel),
                [`${wrapper}__with-suffix`]: Boolean(k.suffix),
                [`${wrapper}__with-suffix-hidden`]: allowClear.value && props.hideSuffix,
                [`${wrapper}__with-suffix-icon`]: k.suffix === 'icon',
                [`${wrapper}__with-append`]: Boolean(k.addonBefore),
                [`${wrapper}__with-prepend`]: Boolean(k.addonAfter),
                [`${wrapper}__with-append-only`]: Boolean(k.addonBefore && !k.addonAfter),
                [`${wrapper}__with-prepend-only`]: Boolean(!k.addonBefore && k.addonAfter),
                [`${wrapper}-readonly`]: props.readonly,
                [`${wrapper}-disabled`]: looks.disabled,
                [`${wrapper}-warning`]: props.validateStatus === 'warning',
                [`${wrapper}-error`]: props.validateStatus === 'error',
                [`${wrapper}-focus`]: state.value.isFocus,
                [`${wrapper}-clearable`]: props.showClear,
                [`${wrapper}-modebtn`]: props.mode === 'password',
                [`${wrapper}-hidden`]: props.type === 'hidden',
                [`${wrapper}-${looks.size}`]: Boolean(looks.size),
                [`${prefix}-borderless`]: props.borderless,
            },
        ];
    };

    watch(
        () => props.modelValue,
        (value) => {
            draft.value = undefined;
            foundation.handleValueChange(value as string | number);
        }
    );

    watch(
        () => props.mode,
        (mode) => foundation.handleModeChange(mode as string)
    );

    // A removed node fires no blur, so a focused clear button would drop focus to the body; this pre-flush watcher runs
    // before the patch removes it.
    watch(allowClear, (allowed) => {
        if (!allowed && clearButton.value === FocusTrapHandle.getActiveElement(clearButton.value)) {
            focusInput();
        }
    });

    const generatedId = useId();

    const labelId = () => props.insetLabelId ?? (insetLabelShown() ? `${generatedId}-inset-label` : undefined);

    const labelledby = () => (attrs['aria-labelledby'] ?? (insetLabelShown() && !attrs['aria-label'] ? labelId() : undefined)) as string | undefined;

    defineExpose<InputHandle>({
        focus: (options) => inputEl.value?.focus({ preventScroll: props.preventScroll, ...options }),
        blur: () => inputEl.value?.blur(),
        select: () => inputEl.value?.select(),
        setSelectionRange: (start, end, direction) => inputEl.value?.setSelectionRange(start, end, direction),
        get input() {
            return inputEl.value;
        },
        get nativeElement() {
            return root.value;
        },
    });
</script>

<template>
    <div ref="root" v-bind="splitControlAttrs($attrs, isNotClassOrStyle).root" :class="wrapperClass(kinds())" @click="foundation.handleClick" @focusin="handleFocusIn" @focusout="handleFocusOut">
        <template v-for="(k, i) in [kinds()]" :key="i">
            <div
                v-if="k.addonBefore"
                :class="[
                    `${prefix}-prepend`,
                    {
                        [`${prefix}-prepend-text`]: k.addonBefore === 'text',
                        [`${prefix}-prepend-icon`]: k.addonBefore === 'icon',
                    },
                ]"
                x-semi-prop="addonBefore"
            >
                <slot name="addonBefore" />
            </div>
            <div
                v-if="k.prefix || k.insetLabel"
                :id="labelId()"
                :class="[
                    `${prefix}-prefix`,
                    {
                        [`${prefix}-inset-label`]: Boolean(k.insetLabel),
                        [`${prefix}-prefix-text`]: (k.prefix ?? k.insetLabel) === 'text',
                        [`${prefix}-prefix-icon`]: (k.prefix ?? k.insetLabel) === 'icon',
                    },
                ]"
                x-semi-prop="prefix,insetLabel"
                @click="foundation.handleClickPrefixOrSuffix"
                @mousedown.prevent
            >
                <slot v-if="k.prefix" name="prefix" />
                <slot v-else name="insetLabel" />
            </div>
        </template>
        <!-- outside v-for, where a template ref would become an array -->
        <input
            ref="input"
            v-bind="splitControlAttrs($attrs, isNotClassOrStyle).control"
            :aria-invalid="ariaInvalid()"
            :aria-labelledby="labelledby()"
            :class="[
                prefix,
                {
                    [`${prefix}-${looks.size}`]: Boolean(looks.size),
                    [`${prefix}-disabled`]: looks.disabled,
                    [`${prefix}-sibling-clearbtn`]: allowClear,
                    [`${prefix}-sibling-modebtn`]: props.mode === 'password',
                },
            ]"
            :disabled="looks.disabled"
            :maxlength="getLength ? undefined : props.maxlength"
            :minlength="InputFoundation.getNativeMinLength({ minLength: props.minlength, getValueLength: getLength }, shown)"
            :placeholder="props.placeholder?.toString()"
            :readonly="props.readonly || Boolean(attrs.readOnly)"
            :style="props.inputStyle"
            :type="InputFoundation.getInputType(props.type, props.mode, state.eyeClosed)"
            :value="elementText()"
            @change="commitDraft"
            @compositionend="handleCompositionEnd"
            @compositionstart="foundation.handleCompositionStart"
            @compositionupdate="foundation.handleCompositionUpdate"
            @input="handleInput"
            @keydown="foundation.handleKeyDown"
            @keyup="foundation.handleKeyUp"
        />
        <!-- .stop: a host key handler (AutoComplete picks an option on Enter) must not take the keys that press the button;
             mousedown clears (issue 1203) without moving focus -->
        <button v-if="allowClear" ref="clearButton" :aria-label="locale.locale.clear" :class="`${prefix}-clearbtn`" type="button" @click="handleClearClick" @keydown.enter.space.stop @mousedown.prevent="handleClearMouseDown">
            <slot name="clearIcon">
                <IconClear />
            </slot>
        </button>
        <template v-for="(k, i) in [kinds()]" :key="i">
            <div
                v-if="k.suffix"
                :class="[
                    `${prefix}-suffix`,
                    {
                        [`${prefix}-suffix-text`]: k.suffix === 'text',
                        [`${prefix}-suffix-icon`]: k.suffix === 'icon',
                        [`${prefix}-suffix-hidden`]: allowClear && props.hideSuffix,
                    },
                ]"
                x-semi-prop="suffix"
                @click="foundation.handleClickPrefixOrSuffix"
                @mousedown.prevent
            >
                <slot name="suffix" />
            </div>
            <button v-if="props.mode === 'password' && !looks.disabled" :aria-label="state.eyeClosed ? locale.locale.showPassword : locale.locale.hidePassword" :class="`${prefix}-modebtn`" type="button" @click="foundation.handleClickEye" @keydown.enter.space.stop @mousedown.prevent>
                <IconEyeClosedSolid v-if="state.eyeClosed" />
                <IconEyeOpened v-else />
            </button>
            <div
                v-if="k.addonAfter"
                :class="[
                    `${prefix}-append`,
                    {
                        [`${prefix}-append-text`]: k.addonAfter === 'text',
                        [`${prefix}-append-icon`]: k.addonAfter === 'icon',
                    },
                ]"
                x-semi-prop="addonAfter"
            >
                <slot name="addonAfter" />
            </div>
        </template>
    </div>
</template>
