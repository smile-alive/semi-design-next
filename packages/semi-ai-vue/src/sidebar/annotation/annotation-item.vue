<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { formatTime } from '@fibrae/semi-foundation/video-player/utils';
    import { IconPlay } from '@fibrae/semi-icons-vue';
    import type { AnnotationItem } from './interface';

    const props = defineProps<{ item: AnnotationItem }>();
    const emit = defineEmits<{ click: [event: MouseEvent] }>();

    const prefix = cssClasses.ANNOTATION_ITEM;
</script>

<!-- Items are links, so the browser opens the url itself (middle click and copy link work too) -->
<!-- shortcut: an item without url is an anchor without href, activatable by pointer only; use a button when such
     items need keyboard access -->
<template>
    <a v-if="props.item.type === 'video'" :class="[prefix, `${prefix}-video`]" :href="props.item.url" rel="noopener noreferrer" target="_blank" @click="emit('click', $event)">
        <div :class="`${prefix}-video-img-wrapper`">
            <img v-if="props.item.img" alt="" :class="`${prefix}-video-img`" :src="props.item.img" />
            <IconPlay :class="`${prefix}-video-play`" />
            <span v-if="typeof props.item.duration === 'number'" :class="`${prefix}-video-duration`">
                {{ formatTime(props.item.duration) }}
            </span>
        </div>
        <div :class="`${prefix}-video-content`">
            <div :class="`${prefix}-title`">{{ props.item.title }}</div>
            <div :class="`${prefix}-footer`">
                <img v-if="props.item.logo" alt="" :class="`${prefix}-footer-logo`" :src="props.item.logo" />
                <span :class="`${prefix}-footer-text`">{{ props.item.siteName }}</span>
                <span v-if="typeof props.item.order === 'number'" :class="`${prefix}-footer-order`">
                    {{ props.item.order }}
                </span>
            </div>
        </div>
    </a>
    <a v-else :class="[prefix, `${prefix}-text`]" :href="props.item.url" rel="noopener noreferrer" target="_blank" @click="emit('click', $event)">
        <div :class="`${prefix}-title`">{{ props.item.title }}</div>
        <div :class="`${prefix}-text-detail`">{{ props.item.detail }}</div>
        <div :class="`${prefix}-footer`">
            <img v-if="props.item.logo" alt="" :class="`${prefix}-footer-logo`" :src="props.item.logo" />
            <span v-if="props.item.siteName" :class="`${prefix}-footer-text`">{{ props.item.siteName }}</span>
            <span v-if="typeof props.item.order === 'number'" :class="`${prefix}-footer-order`">
                {{ props.item.order }}
            </span>
        </div>
    </a>
</template>
