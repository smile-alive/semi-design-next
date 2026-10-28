<script setup lang="ts">
    import { computed } from 'vue';
    import { strings } from '@fibrae/semi-foundation/button/constants';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import Button from '../button';
    import useButtonLooks from '../button/use-button';
    import type { IconButtonProps, IconButtonSlots } from './interface';

    // Passes concrete values down so the inner Button never falls back to the Button global key.
    defineOptions({ elementType: 'IconButton' });

    const props = withDefaults(defineProps<IconButtonProps & /* @vue-ignore */ ElementProps<'button', keyof IconButtonProps>>(), {
        block: () => semiDefault('IconButton', 'block', false),
        colorful: undefined,
        contentClassName: semiGlobalDefault('IconButton', 'contentClassName'),
        disabled: undefined,
        htmlType: () => semiDefault('IconButton', 'htmlType', 'button'),
        iconPosition: () => semiDefault('IconButton', 'iconPosition', strings.DEFAULT_ICON_POSITION),
        loading: () => semiDefault('IconButton', 'loading', false),
        noHorizontalPadding: () => semiDefault('IconButton', 'noHorizontalPadding', false),
        size: undefined,
        theme: undefined,
        type: undefined,
    });

    defineSlots<IconButtonSlots>();

    const looks = useButtonLooks(props, 'IconButton');

    const forwarded = computed(() => ({
        block: props.block,
        contentClassName: props.contentClassName,
        htmlType: props.htmlType,
        iconPosition: props.iconPosition,
        loading: props.loading,
        noHorizontalPadding: props.noHorizontalPadding,
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
