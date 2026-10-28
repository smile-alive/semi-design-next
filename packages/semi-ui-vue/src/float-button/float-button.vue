<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/float-button/constants';
    import '@fibrae/semi-foundation/float-button/float-button.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import Badge from '../badge';
    import FloatButtonAction from './float-button-action.vue';
    import FloatButtonBody from './float-button-body.vue';
    import type { FloatButtonEmits, FloatButtonProps, FloatButtonSlots } from './interface';

    const props = withDefaults(defineProps<FloatButtonProps & /* @vue-ignore */ ElementProps<'button', keyof FloatButtonProps | EmitHandlers<FloatButtonEmits> | 'type' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget'>>(), {
        badge: semiGlobalDefault('FloatButton', 'badge'),
        colorful: () => semiDefault('FloatButton', 'colorful', false),
        disabled: () => semiDefault('FloatButton', 'disabled', false),
        href: semiGlobalDefault('FloatButton', 'href'),
        rel: semiGlobalDefault('FloatButton', 'rel'),
        shape: () => semiDefault('FloatButton', 'shape', 'round'),
        size: () => semiDefault('FloatButton', 'size', 'default'),
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
            <FloatButtonBody :colorful="props.colorful" :disabled="props.disabled" :shape="props.shape" :size="props.size">
                <slot name="icon" />
            </FloatButtonBody>
        </Badge>
        <FloatButtonBody v-else :colorful="props.colorful" :disabled="props.disabled" :shape="props.shape" :size="props.size">
            <slot name="icon" />
        </FloatButtonBody>
    </FloatButtonAction>
</template>
