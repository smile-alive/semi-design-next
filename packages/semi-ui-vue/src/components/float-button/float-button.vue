<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/float-button/constants';
    import '@fibrae/semi-foundation/components/float-button/float-button.scss';
    import { type ElementProps, type EmitHandlers, semiDefault, semiGlobalDefault } from '../../base/index';
    import Badge from '../badge';
    import FloatButtonAction from './float-button-action.vue';
    import FloatButtonBody from './float-button-body.vue';
    import type { FloatButtonEmits, FloatButtonProps, FloatButtonSlots } from './interface';

    const props = withDefaults(defineProps<FloatButtonProps & /* @vue-ignore */ ElementProps<'button', keyof FloatButtonProps | EmitHandlers<FloatButtonEmits> | 'type' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget'>>(), {
        badge: semiGlobalDefault('FloatButton', 'badge'),
        classNames: semiGlobalDefault('FloatButton', 'classNames'),
        colorful: () => semiDefault('FloatButton', 'colorful', false),
        disabled: () => semiDefault('FloatButton', 'disabled', false),
        href: semiGlobalDefault('FloatButton', 'href'),
        rel: semiGlobalDefault('FloatButton', 'rel'),
        shape: () => semiDefault('FloatButton', 'shape', 'round'),
        size: () => semiDefault('FloatButton', 'size', 'default'),
        styles: semiGlobalDefault('FloatButton', 'styles'),
        target: semiGlobalDefault('FloatButton', 'target'),
    });

    // Declared so that a disabled link or button never reaches the consumer's listener.
    const emit = defineEmits<FloatButtonEmits>();
    defineSlots<FloatButtonSlots>();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <FloatButtonAction :class="[prefix, `${prefix}-${props.size}`, `${prefix}-${props.shape}`]" :disabled="props.disabled" :href="props.href" :rel="props.rel" :target="props.target" @click="emit('click', $event)">
        <Badge v-if="props.badge" v-bind="props.badge">
            <template v-if="$slots.badgeCount" #count>
                <slot name="badgeCount" />
            </template>
            <FloatButtonBody :class="props.classNames?.body" :colorful="props.colorful" :disabled="props.disabled" :shape="props.shape" :size="props.size" :style="props.styles?.body">
                <slot name="icon" />
            </FloatButtonBody>
        </Badge>
        <FloatButtonBody v-else :class="props.classNames?.body" :colorful="props.colorful" :disabled="props.disabled" :shape="props.shape" :size="props.size" :style="props.styles?.body">
            <slot name="icon" />
        </FloatButtonBody>
    </FloatButtonAction>
</template>
