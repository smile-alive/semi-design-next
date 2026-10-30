<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Select } from '@fibrae/semi-ui-vue';

    const provinces = ['四川', '广东'];
    const maps: Record<string, string[]> = {
        四川: ['成都', '都江堰'],
        广东: ['广州', '深圳', '东莞'],
    };

    const province = ref(provinces[0]);
    const cities = computed(() => maps[province.value]);
    const city = ref<string | undefined>(cities.value[0]);

    const changeProvince = (newProvince?: string) => {
        if (!newProvince) {
            return;
        }
        province.value = newProvince;
        city.value = maps[newProvince][0];
    };
</script>

<template>
    <Select aria-label="省份" :modelValue="province" style="width: 150px; margin: 10px" @change="changeProvince">
        <Select.Option v-for="item in provinces" :key="item" :value="item">{{ item }}</Select.Option>
    </Select>
    <Select v-model="city" aria-label="城市" style="width: 150px; margin: 10px">
        <Select.Option v-for="item in cities" :key="item" :value="item">{{ item }}</Select.Option>
    </Select>
</template>
