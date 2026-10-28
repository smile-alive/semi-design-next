<script setup lang="ts">
    import { computed, useAttrs, useTemplateRef, watch } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps as FoundationProps, type ColorPickerState } from '@fibrae/semi-foundation/color-picker/foundation';
    import '@fibrae/semi-foundation/color-picker/color-picker.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import ColorPickerPanel from './color-picker-panel.vue';
    import { DEFAULT_COLOR } from './constants';
    import { provideColorPickerContext } from './context';
    import type { ColorPickerEmits, ColorPickerHandle, ColorPickerProps, ColorPickerSlots } from './interface';

    type Foundation = ColorPickerFoundation<FoundationProps>;
    type Adapter = ColorPickerAdapter<FoundationProps>;

    // Attrs go to the picker div, which is inside the popover when `usePopover`, so the root is not their target.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ColorPickerProps & /* @vue-ignore */ ElementProps<'div', keyof ColorPickerProps | EmitHandlers<ColorPickerEmits>>>(), {
        modelValue: undefined,
        defaultValue: () => semiDefault('ColorPicker', 'defaultValue', DEFAULT_COLOR),
        alpha: () => semiDefault('ColorPicker', 'alpha', true),
        eyeDropper: () => semiDefault('ColorPicker', 'eyeDropper', true),
        defaultFormat: () => semiDefault('ColorPicker', 'defaultFormat', 'hex'),
        width: () => semiDefault('ColorPicker', 'width', 280),
        height: () => semiDefault('ColorPicker', 'height', 280),
        usePopover: () => semiDefault('ColorPicker', 'usePopover', false),
        popoverProps: semiGlobalDefault('ColorPicker', 'popoverProps'),
    });

    const emit = defineEmits<ColorPickerEmits>();
    defineSlots<ColorPickerSlots>();

    // The root is not focusable; a Tooltip around the picker injects a tabindex that would add a Tab stop of its own
    const attrs = useAttrs();

    const i18n = useLocale('ColorPicker');

    const panel = useTemplateRef('panel');

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, ColorPickerState>(
        ColorPickerFoundation,
        props,
        (p) => ({ currentColor: p.value ?? props.defaultValue }),
        () => ({
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
        }),
        { props: { value: () => props.modelValue } }
    );

    // shortcut: repeats ColorPickerFoundation.getCurrentColor, which is protected; share it when the foundation exports it
    const currentColor = computed(() => (props.modelValue !== undefined ? props.modelValue : state.value.currentColor));

    // The popup holds inputs and sliders: it is a dialog opened by click, not a hover tooltip, so moving the pointer away
    // cannot close it mid-edit. A dialog needs a name; the caller's wins.
    const popoverBindings = computed(() => {
        const popover = props.popoverProps ?? {};
        return {
            ...popover,
            ariaLabel: popover.ariaLabel ?? (popover.ariaLabelledby ? undefined : i18n.value.locale.color),
            class: [`${cssClasses.PREFIX}-popover`, popover.class],
            role: popover.role ?? 'dialog',
            trigger: popover.trigger ?? 'click',
        };
    });

    const panelAttrs = computed(() => omit(attrs, ['tabindex', 'tabIndex']));

    provideColorPickerContext({
        view: computed(() => ({
            currentColor: currentColor.value,
            alpha: props.alpha,
            eyeDropper: props.eyeDropper,
            defaultFormat: props.defaultFormat,
            width: props.width,
            height: props.height,
        })),
        foundation,
    });

    watch(
        () => props.modelValue,
        (value) => {
            if (value === undefined) {
                foundation.resetToDefault();
            }
        }
    );

    defineExpose<ColorPickerHandle>({
        get root() {
            return panel.value?.$el ?? null;
        },
    });
</script>

<template>
    <ColorPickerPanel v-if="!props.usePopover" ref="panel" v-bind="panelAttrs">
        <template #topSlot>
            <slot name="topSlot" />
        </template>
        <template #bottomSlot>
            <slot name="bottomSlot" />
        </template>
    </ColorPickerPanel>
    <Popover v-else v-bind="popoverBindings">
        <slot>
            <button :aria-label="i18n.locale.color" :class="`${cssClasses.PREFIX}-popover-defaultChildren`" :style="{ backgroundColor: currentColor.hex }" type="button" />
        </slot>
        <template #content>
            <ColorPickerPanel ref="panel" v-bind="panelAttrs">
                <template #topSlot>
                    <slot name="topSlot" />
                </template>
                <template #bottomSlot>
                    <slot name="bottomSlot" />
                </template>
            </ColorPickerPanel>
        </template>
    </Popover>
</template>
