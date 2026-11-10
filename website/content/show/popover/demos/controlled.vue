<script setup lang="ts">
    import { ref } from 'vue';
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-vue/illustrations';
    import { Empty, Popover, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-vue';

    const visible = ref<RadioValue | undefined>(0);
</script>

<template>
    <Popover trigger="custom" :visible="visible === 1">
        <span :style="{ display: 'inline-block' }">
            <RadioGroup v-model="visible" type="button">
                <Radio :value="1">受控显示</Radio>
                <Radio :value="0">受控隐藏</Radio>
            </RadioGroup>
        </span>
        <template #content>
            <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                <template #image>
                    <IllustrationSuccess :style="{ width: '150px', height: '150px' }" />
                </template>
                <template #darkModeImage>
                    <IllustrationSuccessDark :style="{ width: '150px', height: '150px' }" />
                </template>
                <template #description>一套组件，四个框架原生可用</template>
            </Empty>
        </template>
    </Popover>
</template>
