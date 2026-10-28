<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Input, Radio, RadioGroup, Tooltip, type RadioValue } from '@fibrae/semi-ui-vue';

    const visible = ref<RadioValue | undefined>(0);
</script>

<template>
    <div>
        <Tooltip>
            <Button :style="{ marginBottom: '20px' }" theme="solid" type="tertiary">悬停显示</Button>
            <template #content>hi bytedance</template>
        </Tooltip>
        <br />
        <Tooltip trigger="click">
            <Button :style="{ marginBottom: '20px' }">点击显示</Button>
            <template #content>hi bytedance</template>
        </Tooltip>
        <br />
        <Tooltip trigger="focus">
            <Input aria-label="聚焦显示" placeholder="聚焦显示" :style="{ width: '100px', marginBottom: '20px' }" />
            <template #content>hi bytedance</template>
        </Tooltip>
        <br />
        <Tooltip trigger="contextMenu">
            <Button :style="{ marginBottom: '20px' }" theme="solid" type="secondary">右键点击展示</Button>
            <template #content>hi bytedance</template>
        </Tooltip>
        <br />
        <Tooltip trigger="custom" :visible="visible === 1">
            <span :style="{ display: 'inline-block' }">
                <RadioGroup v-model="visible" type="button">
                    <Radio :value="1">受控显示</Radio>
                    <Radio :value="0">受控隐藏</Radio>
                </RadioGroup>
            </span>
            <template #content>hi bytedance</template>
        </Tooltip>
    </div>
</template>
