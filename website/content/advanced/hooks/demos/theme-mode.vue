<script setup lang="ts">
    import { Radio, RadioGroup, Space, Typography } from '@fibrae/semi-ui-vue';
    import { useThemeMode, type ThemePreference } from '@fibrae/semi-ui-vue/composables';

    const { mode, preference, setMode } = useThemeMode();
</script>

<template>
    <Space spacing="loose">
        <RadioGroup aria-label="主题模式" :modelValue="preference" type="button" @update:modelValue="(value) => setMode(value as ThemePreference)">
            <Radio value="light">亮色</Radio>
            <Radio value="dark">暗色</Radio>
            <Radio value="system">跟随系统</Radio>
        </RadioGroup>
        <Typography.Text>当前显示：{{ mode === 'dark' ? '暗色' : '亮色' }}</Typography.Text>
    </Space>
</template>
