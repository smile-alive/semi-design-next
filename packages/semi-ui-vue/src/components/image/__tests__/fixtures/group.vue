<script setup lang="ts">
    import Image from '../../image.vue';
    import type { ImageProps } from '../../interface';
    import ImagePreview from '../../preview.vue';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ images: (ImageProps & { key?: string })[] } & /* @vue-ignore */ InstanceType<typeof ImagePreview>['$props']>();
</script>

<template>
    <ImagePreview v-bind="$attrs">
        <Image v-for="(image, index) in props.images" :key="image.key ?? index" v-bind="image" />
    </ImagePreview>
</template>
