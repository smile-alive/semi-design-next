<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Resizable, type ResizableProps } from '@fibrae/semi-ui-vue';

    const size = ref<NonNullable<ResizableProps['size']>>({ width: 200, height: 100 });

    const grow = () => {
        size.value = { width: Number(size.value.width) + 10, height: Number(size.value.height) + 10 };
    };
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <Button @click="grow">set += 10</Button>
        <Resizable v-model:size="size" :style="{ backgroundColor: 'var(--semi-grey-1)', marginTop: '10px' }">
            <div :style="{ marginLeft: '20%' }">受控</div>
        </Resizable>
    </div>
</template>
