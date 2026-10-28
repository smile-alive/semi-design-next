<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, ScrollItem, ScrollList, type ScrollItemSelectData } from '@fibrae/semi-ui-vue';

    const ampms = [{ value: '上午' }, { value: '下午' }];
    const hours = Array.from({ length: 12 }, (_, index) => ({ value: index + 1 }));
    const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 3 === 0 }));

    const selectIndex1 = ref(1);
    const selectIndex2 = ref(1);
    const selectIndex3 = ref(1);

    const onSelectHour = (data: ScrollItemSelectData) => {
        console.log('You have choose the hour for: ', data.value);
    };

    const onSelectMinute = (data: ScrollItemSelectData) => {
        console.log('You have choose the minute for: ', data.value);
    };

    const handleClose = () => {
        console.log('close');
    };
</script>

<template>
    <ScrollList header="无限滚动列表" :style="{ border: 'unset', boxShadow: 'unset' }">
        <ScrollItem v-model:selectedIndex="selectIndex1" aria-label="上午或下午" :cycled="false" :list="ampms" mode="wheel" :type="1" />
        <ScrollItem v-model:selectedIndex="selectIndex2" aria-label="小时" cycled :list="hours" mode="wheel" :type="2" @select="onSelectHour" />
        <ScrollItem v-model:selectedIndex="selectIndex3" aria-label="分钟" cycled :list="minutes" mode="wheel" :type="3" @select="onSelectMinute" />
        <template #footer>
            <Button size="small" type="primary" @click="handleClose">Ok</Button>
        </template>
    </ScrollList>
</template>
