<script setup lang="ts">
    import { type AnchorHTMLAttributes, useAttrs } from 'vue';
    import { TypographyText } from '../../typography';
    import { provideMarkdownLinkContext } from '../context';

    // attrs belong to the anchor alone; on the Typography root they would be duplicated
    defineOptions({ inheritAttrs: false });
    const attrs = useAttrs();

    provideMarkdownLinkContext(true);

    const link = () => attrs as AnchorHTMLAttributes;
</script>

<template>
    <TypographyText :link="link()">
        <slot />
    </TypographyText>
</template>
