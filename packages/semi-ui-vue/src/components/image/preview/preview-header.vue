<script setup lang="ts">
    import type { ClassValue, StyleValue } from 'vue';
    import { cssClasses, type ImagePreviewPart } from '@fibrae/semi-foundation/components/image/constants';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import useLocale from '../../locale/use-locale';
    import type { ImagePreviewSlots } from '../interface';

    const props = defineProps<{
        closable: boolean;
        title?: string;
        /** id of the title section, which names the preview dialog */
        titleId: string;
        hidden: boolean;
        index: number;
        classNames?: Partial<Record<ImagePreviewPart, ClassValue>>;
        styles?: Partial<Record<ImagePreviewPart, StyleValue>>;
    }>();

    const emit = defineEmits<{ close: [event: MouseEvent] }>();
    defineSlots<Pick<ImagePreviewSlots, 'title' | 'closeIcon'>>();

    const locale = useLocale('Image');

    const cls = `${cssClasses.PREFIX}-preview-header`;
</script>

<template>
    <section :class="[cls, { [`${cssClasses.PREFIX}-preview-hide`]: props.hidden }, props.classNames?.header]" :style="props.styles?.header">
        <section :id="props.titleId" :class="[`${cls}-title`, props.classNames?.title]" :style="props.styles?.title">
            <slot v-if="$slots.title" :index="props.index" name="title" :title="props.title" />
            <template v-else>{{ props.title }}</template>
        </section>
        <button v-if="props.closable" :aria-label="locale.locale.close" :class="[`${cls}-close`, props.classNames?.close]" :style="props.styles?.close" type="button" @click="emit('close', $event)">
            <slot name="closeIcon">
                <IconClose />
            </slot>
        </button>
    </section>
</template>
