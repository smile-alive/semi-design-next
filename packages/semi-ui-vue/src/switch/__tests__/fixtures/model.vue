<script setup lang="ts">
    import { ref } from 'vue';
    import Switch from '../..';

    const props = withDefaults(defineProps<{ loadOnChange?: boolean }>(), { loadOnChange: false });
    const emit = defineEmits<{ change: [checked: boolean, event: Event] }>();
    const checked = ref<boolean | undefined>(false);
    const loading = ref(false);
    const handleChange = (value: boolean, event: Event) => {
        emit('change', value, event);
        if (props.loadOnChange) loading.value = true;
    };
</script>

<template>
    <Switch v-model="checked" aria-label="toggle" :loading="loading" @change="handleChange" />
    <button type="button" @click="checked = undefined">reset</button>
</template>
