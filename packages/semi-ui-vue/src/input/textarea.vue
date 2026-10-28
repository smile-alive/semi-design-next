<script setup lang="ts">
    import { computed, mergeProps, onBeforeUnmount, onMounted, shallowRef, useAttrs, useId, useTemplateRef, watch, type StyleValue, type TextareaHTMLAttributes } from 'vue';
    import { throttle } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import TextAreaFoundation, { type TextAreaAdapter } from '@fibrae/semi-foundation/input/textarea-foundation';
    import { syncLineNumberHeights } from '@fibrae/semi-foundation/input/util/line-number';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/input/textarea.scss';
    import { IconClear } from '@fibrae/semi-icons-vue';
    import { isNotClassOrStyle, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useRaf from '../_base/use-raf';
    import useResizeObserver from '../_base/use-resize-observer';
    import useLocale from '../locale/use-locale';
    import type { TextAreaEmits, TextAreaHandle, TextAreaProps, TextAreaState } from './interface';
    import { defersUpdate } from './model-modifiers';
    import useTextEntry from './use-text-entry';

    interface FoundationProps extends TextAreaProps {
        value?: string;
        maxLength?: number;
    }

    type Foundation = TextAreaFoundation<FoundationProps, TextAreaState, KeyboardEvent, CompositionEvent>;
    type Adapter = TextAreaAdapter<FoundationProps, TextAreaState, KeyboardEvent, CompositionEvent>;

    defineOptions({ name: 'TextArea', inheritAttrs: false });

    const props = withDefaults(defineProps<TextAreaProps & /* @vue-ignore */ ElementProps<'textarea', keyof TextAreaProps | EmitHandlers<TextAreaEmits> | 'value'>>(), {
        modelValue: undefined,
        modelModifiers: undefined,
        defaultValue: semiGlobalDefault('TextArea', 'defaultValue'),
        autosize: () => semiDefault('TextArea', 'autosize', false),
        borderless: () => semiDefault('TextArea', 'borderless', false),
        rows: () => semiDefault('TextArea', 'rows', 4),
        cols: () => semiDefault('TextArea', 'cols', 20),
        placeholder: semiGlobalDefault('TextArea', 'placeholder'),
        maxCount: semiGlobalDefault('TextArea', 'maxCount'),
        showCounter: () => semiDefault('TextArea', 'showCounter', false),
        showClear: () => semiDefault('TextArea', 'showClear', false),
        disabled: semiGlobalDefault('TextArea', 'disabled'),
        readonly: semiGlobalDefault('TextArea', 'readonly'),
        autofocus: semiGlobalDefault('TextArea', 'autofocus'),
        validateStatus: semiGlobalDefault('TextArea', 'validateStatus'),
        composition: () => semiDefault('TextArea', 'composition', false),
        disabledEnterStartNewLine: semiGlobalDefault('TextArea', 'disabledEnterStartNewLine'),
        showLineNumber: () => semiDefault('TextArea', 'showLineNumber', false),
        lineNumberStart: () => semiDefault('TextArea', 'lineNumberStart', 1),
        lineNumberClassName: semiGlobalDefault('TextArea', 'lineNumberClassName'),
        lineNumberStyle: semiGlobalDefault('TextArea', 'lineNumberStyle'),
        textareaStyle: semiGlobalDefault('TextArea', 'textareaStyle'),
        resize: semiGlobalDefault('TextArea', 'resize'),
        getValueLength: undefined,
    });

    const emit = defineEmits<TextAreaEmits>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('Input');

    const root = useTemplateRef('root');
    const textareaEl = useTemplateRef('textarea');
    const lineNumberEl = useTemplateRef('lineNumber');
    const clearButton = useTemplateRef('clearButton');
    const lineLayout = shallowRef({ width: 0, height: 0 });

    // see input.vue
    const draft = shallowRef<string>();

    const counterId = `${useId()}-counter`;
    const prefix = cssClasses.PREFIX;
    const getLength = computed(() => props.getValueLength ?? readSemiDefault(semi, 'TextArea', 'getValueLength'));
    const hasCounter = computed(() => props.showCounter || Boolean(props.maxCount));

    const lineNumberPanelStyle = computed((): StyleValue => {
        const { height } = lineLayout.value;
        return [props.lineNumberStyle, height ? { height: `${height}px`, maxHeight: `${height}px` } : undefined];
    });

    const sizeStyle = computed(() => {
        if (props.autosize) {
            const bounds = typeof props.autosize === 'object' ? props.autosize : {};
            return {
                resize: 'none' as const,
                [`--${prefix}-textarea-min-rows`]: bounds.minRows ?? props.rows,
                [`--${prefix}-textarea-max-rows`]: bounds.maxRows,
            };
        }
        return props.resize === undefined ? undefined : { resize: props.resize };
    });

    const focusTextarea = () => textareaEl.value?.focus();

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, TextAreaState>(
        TextAreaFoundation,
        props,
        (view) => ({
            value: view.value === undefined ? view.defaultValue : view.value,
            isFocus: false,
            cachedValue: view.value,
        }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            notifyChange: (value, event) => {
                if (defersUpdate(event, props.modelModifiers)) {
                    draft.value = value;
                } else {
                    draft.value = undefined;
                    emit('update:modelValue', value);
                }
                emit('change', value, event);
            },
            notifyClear: (event) => emit('clear', event),
            notifyBlur: (_, event) => emit('blur', event),
            notifyFocus: (_, event) => emit('focus', event),
            notifyKeyDown: (event) => emit('keydown', event),
            notifyEnterPress: (event) => emit('enterPress', event),
            notifyResize: (size) => emit('resize', size),
            notifyCompositionStart: (event) => emit('compositionstart', event),
            notifyCompositionEnd: (event) => emit('compositionend', event),
            notifyCompositionUpdate: (event) => emit('compositionupdate', event),
            focusInput: focusTextarea,
            isEventTarget: (event) => event.target === event.currentTarget,
            getTextarea: () => textareaEl.value,
        }),
        {
            props: {
                value: () => props.modelValue,
                maxLength: () => props.maxlength,
                getValueLength: () => getLength.value,
            },
        }
    );

    const value = computed(() => TextAreaFoundation.deriveValue({ value: props.modelValue }, state.value));
    const shown = computed(() => draft.value ?? value.value);

    const { elementText, runInput, handleCompositionEnd, commitDraft, handleFocusIn, handleFocusOut } = useTextEntry({
        element: textareaEl,
        draft,
        props,
        shown,
        foundation,
        emitUpdate: (value) => emit('update:modelValue', value),
    });

    const lines = computed(() => (shown.value ? shown.value.split('\n') : ['']));
    const allowClear = computed(() => TextAreaFoundation.isAllowClear(props, shown.value));
    const count = computed(() => TextAreaFoundation.getValueCount(shown.value, getLength.value));
    const exceeds = computed(() => Boolean(props.maxCount) && count.value > (props.maxCount ?? 0));

    const throttledResize = throttle(foundation.handleResize, 10);

    const handleInput = (event: Event) =>
        runInput(event, () => {
            foundation.handleChange((event.target as HTMLTextAreaElement).value, event);
            emit('input', event);
        });

    // keyboard activation (detail 0) returns focus to the textarea as the button unmounts
    const handleClearClick = (event: MouseEvent) => {
        foundation.handleClear(event);
        if (event.detail === 0) {
            focusTextarea();
        }
    };

    const isResizable = (directions: string[]) => !props.autosize && props.resize !== undefined && directions.includes(props.resize);

    watch(
        () => props.modelValue,
        (value) => {
            draft.value = undefined;
            foundation.handleValueChange(value as string);
        }
    );

    // the native autofocus does nothing on a later-inserted node, and focusing a textarea with a value leaves the caret
    // at the end
    onMounted(() => {
        if (props.autofocus) {
            focusTextarea();
            textareaEl.value?.setSelectionRange(0, 0);
        }
    });

    onBeforeUnmount(() => throttledResize.cancel());

    useResizeObserver(() => (props.autosize || (props.resize !== undefined && props.resize !== 'none') ? textareaEl.value : null), throttledResize);

    useResizeObserver(
        () => (props.showLineNumber ? textareaEl.value : null),
        (entries) => {
            // contentRect does not include borders; align with textarea.clientHeight
            const { width, height } = entries[entries.length - 1].contentRect;
            lineLayout.value = { width, height };
        }
    );

    // the line number panel remounts the textarea
    watch([shown, () => Boolean(props.autosize), () => props.showLineNumber], () => foundation.fitAutosize(), { flush: 'post' });

    watch(
        [lineLayout, lines],
        () => {
            // width is 0 until the observer has reported the mounted textarea
            if (textareaEl.value && lineNumberEl.value && lineLayout.value.width) {
                syncLineNumberHeights(textareaEl.value, lineNumberEl.value, lines.value);
            }
        },
        { flush: 'post' }
    );

    // A removed node fires no blur, so a focused clear button would drop focus to the body; this pre-flush watcher runs
    // before the patch removes it.
    watch(allowClear, (allowed) => {
        if (!allowed && clearButton.value === FocusTrapHandle.getActiveElement(clearButton.value)) {
            focusTextarea();
        }
    });

    const scheduleScrollSync = useRaf();

    const handleScroll = (event: Event) => {
        const { scrollTop } = event.currentTarget as HTMLTextAreaElement;
        scheduleScrollSync(() => {
            if (lineNumberEl.value) {
                lineNumberEl.value.scrollTop = scrollTop;
            }
        });
    };

    const textareaProps = () =>
        mergeProps(splitControlAttrs(attrs, isNotClassOrStyle).control, {
            'aria-describedby': joinIds(attrs['aria-describedby'], hasCounter.value && counterId),
            'aria-invalid': (props.validateStatus === 'error' || exceeds.value ? 'true' : attrs['aria-invalid']) as TextareaHTMLAttributes['aria-invalid'],
            class: [
                `${prefix}-textarea`,
                {
                    [`${prefix}-textarea-disabled`]: props.disabled,
                    [`${prefix}-textarea-readonly`]: props.readonly,
                    [`${prefix}-textarea-autosize`]: Boolean(props.autosize),
                    [`${prefix}-textarea-showClear`]: props.showClear,
                },
            ],
            cols: props.cols,
            disabled: props.disabled,
            // native maxlength counts UTF-16 units, so getValueLength enforces the limit
            maxlength: getLength.value ? undefined : props.maxlength,
            minlength: TextAreaFoundation.getNativeMinLength({ minLength: props.minlength, getValueLength: getLength.value }, shown.value),
            placeholder: props.placeholder || undefined,
            readonly: props.readonly || Boolean(attrs.readOnly),
            rows: props.rows,
            style: [props.textareaStyle, sizeStyle.value],
            value: elementText(),
            onChange: commitDraft,
            onCompositionend: handleCompositionEnd,
            onCompositionstart: foundation.handleCompositionStart,
            onCompositionupdate: foundation.handleCompositionUpdate,
            onInput: handleInput,
            onKeydown: (event: KeyboardEvent) => foundation.handleKeyDown(event),
            onKeyup: (event: KeyboardEvent) => emit('keyup', event),
            onScroll: handleScroll,
        });

    defineExpose<TextAreaHandle>({
        focus: (options) => textareaEl.value?.focus(options),
        blur: () => textareaEl.value?.blur(),
        select: () => textareaEl.value?.select(),
        setSelectionRange: (start, end, direction) => textareaEl.value?.setSelectionRange(start, end, direction),
        get textarea() {
            return textareaEl.value;
        },
        get nativeElement() {
            return root.value;
        },
    });
</script>

<template>
    <div
        ref="root"
        v-bind="splitControlAttrs($attrs, isNotClassOrStyle).root"
        :class="[
            `${prefix}-textarea-wrapper`,
            {
                [`${prefix}-textarea-borderless`]: props.borderless,
                [`${prefix}-textarea-wrapper-disabled`]: props.disabled,
                [`${prefix}-textarea-wrapper-readonly`]: props.readonly,
                [`${prefix}-textarea-wrapper-${props.validateStatus}`]: Boolean(props.validateStatus),
                [`${prefix}-textarea-wrapper-focus`]: state.isFocus,
                [`${prefix}-textarea-wrapper-withLineNumber`]: props.showLineNumber,
                [`${prefix}-textarea-wrapper-resizeX`]: isResizable(['horizontal', 'both', 'inline']),
                [`${prefix}-textarea-wrapper-resizeY`]: isResizable(['vertical', 'both', 'block']),
            },
        ]"
        @click="foundation.handleClick($event)"
        @focusin="handleFocusIn"
        @focusout="handleFocusOut"
    >
        <template v-if="props.showLineNumber">
            <!-- the numbers only mirror the text rows, so assistive technology skips them -->
            <div ref="lineNumber" aria-hidden="true" :class="[`${prefix}-textarea-lineNumber`, props.lineNumberClassName]" :style="lineNumberPanelStyle">
                <div v-for="(_, index) in lines" :key="index" :class="`${prefix}-textarea-lineNumber-item`">
                    {{ props.lineNumberStart + index }}
                </div>
            </div>
            <div :class="`${prefix}-textarea-content`">
                <textarea ref="textarea" v-bind="textareaProps()" />
            </div>
        </template>
        <textarea v-else ref="textarea" v-bind="textareaProps()" />
        <button v-if="allowClear" ref="clearButton" :aria-label="locale.locale.clear" :class="`${prefix}-clearbtn`" type="button" @click="handleClearClick" @mousedown.prevent>
            <IconClear />
        </button>
        <div v-if="hasCounter" :id="counterId" :class="[`${prefix}-textarea-counter`, { [`${prefix}-textarea-counter-exceed`]: exceeds }]" @click="foundation.handleCounterClick()">
            {{ count }}<template v-if="props.maxCount">/{{ props.maxCount }}</template>
        </div>
    </div>
</template>
