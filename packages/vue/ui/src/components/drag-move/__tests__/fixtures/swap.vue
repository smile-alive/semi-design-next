<script setup lang="ts">
    import { ref } from 'vue';
    import DragMove from '../..';

    const props = withDefaults(defineProps<{ show?: boolean }>(), { show: true });
    const first = ref(true);
</script>

<template>
    <div>
        <button type="button" @click="first = false">swap</button>
        <DragMove>
            <template v-if="props.show">
                <div v-if="first" key="a" style="width: 40px; height: 20px">First</div>
                <div v-else key="b" style="width: 40px; height: 20px">Second</div>
            </template>
        </DragMove>
    </div>
</template>
