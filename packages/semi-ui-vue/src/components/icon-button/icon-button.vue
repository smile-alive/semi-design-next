<script setup lang="ts">
    import { computed } from 'vue';
    import { strings } from '@fibrae/semi-foundation/components/button/constants';
    import { type ElementProps, semiDefault, semiGlobalDefault } from '../../base/index';
    import Button from '../button';
    import useButtonLooks from '../button/use-button';
    import type { IconButtonProps, IconButtonSlots } from './interface';

    // Passes concrete values down so the inner Button never falls back to the Button global key.
    defineOptions({ elementType: 'IconButton' });

    const props = withDefaults(defineProps<IconButtonProps & /* @vue-ignore */ ElementProps<'button', keyof IconButtonProps>>(), {
        block: () => semiDefault('IconButton', 'block', false),
        classNames: semiGlobalDefault('IconButton', 'classNames'),
        colorful: undefined,
        disabled: undefined,
        htmlType: () => semiDefault('IconButton', 'htmlType', 'button'),
        iconPosition: () => semiDefault('IconButton', 'iconPosition', strings.DEFAULT_ICON_POSITION),
        loading: () => semiDefault('IconButton', 'loading', false),
        noHorizontalPadding: () => semiDefault('IconButton', 'noHorizontalPadding', false),
        size: undefined,
        styles: semiGlobalDefault('IconButton', 'styles'),
        theme: undefined,
        type: undefined,
    });

    defineSlots<IconButtonSlots>();

    const looks = useButtonLooks(props, 'IconButton');

    const forwarded = computed(() => ({
        block: props.block,
        classNames: props.classNames,
        htmlType: props.htmlType,
        iconPosition: props.iconPosition,
        loading: props.loading,
        noHorizontalPadding: props.noHorizontalPadding,
        styles: props.styles,
        ...looks.value,
    }));
</script>

<template>
    <Button v-bind="forwarded">
        <template #icon>
            <slot name="icon" />
        </template>
        <slot />
    </Button>
</template>
