<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import { IconUploadError } from '@fibrae/semi-icons-vue';
    import Image from '../../image';
    import { useMarkdownLinkContext } from '../context';

    defineOptions({ inheritAttrs: false });

    // Image's props reach it as attrs; typed behind `@vue-ignore` for call sites only
    defineProps</* @vue-ignore */ InstanceType<typeof Image>['$props']>();

    const inLink = useMarkdownLinkContext();
</script>

<template>
    <div :class="`${cssClasses.PREFIX}-component-image`">
        <!-- in a link the link is the only control, unless the caller asks for a preview -->
        <Image :preview="inLink ? false : undefined" width="100%" v-bind="$attrs">
            <template v-if="$attrs.fallback === undefined" #fallback>
                <IconUploadError />
            </template>
        </Image>
        <!-- the alt already names the image -->
        <div aria-hidden="true" :class="`${cssClasses.PREFIX}-component-image-alt`">{{ $attrs.alt }}</div>
    </div>
</template>
