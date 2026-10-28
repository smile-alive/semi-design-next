<script setup lang="ts">
    import { ref } from 'vue';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import AutoComplete from '../..';

    const emit = defineEmits<{ blur: [event: FocusEvent] }>();
    const value = ref<string | number>('');
    const data = ref<string[]>([]);
    const search = (input: string) => {
        data.value = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
    };
</script>

<template>
    <AutoComplete v-model="value" aria-label="email" :data="data" placeholder="fe" showClear style="width: 300px" @blur="emit('blur', $event)" @search="search">
        <template #prefix>
            <IconSearch />
        </template>
    </AutoComplete>
</template>
