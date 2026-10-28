<script setup lang="ts">
    import Tooltip from '../../tooltip.vue';

    const emit = defineEmits<{ submit: [event: Event] }>();
</script>

<template>
    <form @submit.prevent="emit('submit', $event)">
        <label for="portal-agree" :style="{ whiteSpace: 'nowrap', fontWeight: 700 }">
            <input id="portal-agree" type="checkbox" />
            agree
            <Tooltip :motion="false" trigger="custom" visible>
                <span>trigger</span>
                <template #content>
                    <input aria-label="popup input" />
                </template>
            </Tooltip>
        </label>
    </form>
</template>
