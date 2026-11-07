<script setup lang="ts">
    import type { UserGuideStepItem } from '../../interface';
    import UserGuide from '../../user-guide.vue';

    defineProps<{ steps: UserGuideStepItem[]; mode?: 'popup' | 'modal'; showTitle?: boolean; current?: number }>();
</script>

<template>
    <UserGuide :current="current" :mode="mode" :steps="steps" visible>
        <template #title="{ item, index }">
            <b v-if="showTitle" class="custom-title">{{ item.title }}-{{ index }}</b>
        </template>
        <template #description="{ index }">
            <i v-if="index === 1" class="custom-description">Slot description</i>
        </template>
        <template #cover="{ index }">
            <img v-if="index === 0" alt="slot-cover" />
        </template>
        <template #nextText>
            <span>Forward</span>
        </template>
        <template #prevText>
            <span>Back</span>
        </template>
    </UserGuide>
</template>
