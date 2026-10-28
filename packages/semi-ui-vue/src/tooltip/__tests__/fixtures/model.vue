<script setup lang="ts">
    import { shallowRef, useTemplateRef } from 'vue';
    import type { TooltipHandle } from '../../interface';
    import Tooltip from '../../tooltip.vue';

    const visible = shallowRef(false);
    const changes = shallowRef(0);
    const tooltip = useTemplateRef<TooltipHandle>('tooltip');
</script>

<template>
    <Tooltip ref="tooltip" v-model:visible="visible" clickTriggerToHide :motion="false" returnFocusOnClose trigger="click" @visibleChange="changes++">
        <button type="button">trigger</button>
        <template #content>content</template>
    </Tooltip>
    <button type="button" @click="tooltip?.hide()">hide</button>
    <button type="button" @click="tooltip?.focusTrigger()">focus</button>
    <button type="button" @click="tooltip?.rePosition()">position</button>
    <output aria-label="popup ID">{{ tooltip?.getPopupId() }}</output>
    <span data-testid="changes">{{ changes }}</span>
</template>
