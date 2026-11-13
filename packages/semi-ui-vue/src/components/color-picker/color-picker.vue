<script setup lang="ts">
    import { computed, useAttrs, useTemplateRef } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps as FoundationProps, type ColorPickerState } from '@fibrae/semi-foundation/components/color-picker/foundation';
    import '@fibrae/semi-foundation/components/color-picker/color-picker.scss';
    import { type ElementProps, type EmitHandlers, semiDefault, semiGlobalDefault, useFoundation } from '../../base/index';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import type { PopoverHandle } from '../popover/interface';
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
    const popover = useTemplateRef<PopoverHandle>('popover');

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, ColorPickerState>(
        ColorPickerFoundation,
        props,
        (p) => ColorPickerFoundation.getInitialState(p),
        () => ({
            notifyChange: (value) => {
                emit('update:modelValue', value);
                emit('change', value);
            },
        }),
        { props: { value: () => props.modelValue } }
    );

    const currentColor = computed(() => ColorPickerFoundation.deriveColor({ value: props.modelValue, defaultValue: props.defaultValue }, state.value));

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
    <Popover v-else ref="popover" v-bind="popoverBindings" @open="ColorPickerFoundation.focusPopup(popover?.getPopup() ?? null)">
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
