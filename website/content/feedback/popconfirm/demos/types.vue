<script setup lang="ts">
    import { ref } from 'vue';
    import { IconAlertTriangle } from '@fibrae/semi-icons-vue';
    import { Button, Popconfirm, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-vue';

    type TypeKey = 'default' | 'warning' | 'danger' | 'tertiary';

    const typeMap: Record<TypeKey, { okType?: 'danger'; color?: string }> = {
        default: {},
        warning: { color: 'var(--semi-color-warning)' },
        danger: { okType: 'danger', color: 'var(--semi-color-danger)' },
        tertiary: { color: 'var(--semi-color-tertiary)' },
    };
    const keys = Object.keys(typeMap) as TypeKey[];
    const type = ref<TypeKey>('default');
    const visible = ref(true);

    const changeType = (value: RadioValue | undefined) => {
        const key = keys.find((item) => item === value);
        if (key) type.value = key;
    };
</script>

<template>
    <div>
        <RadioGroup :modelValue="type" :style="{ marginTop: '14px', marginBottom: '14px' }" type="button" @update:modelValue="changeType">
            <Radio v-for="key in keys" :key="key" :value="key">
                <span :style="{ color: `var(--semi-color-${key === 'default' ? 'primary' : key})` }">{{ key }}</span>
            </Radio>
        </RadioGroup>
        <div>
            <Popconfirm v-model:visible="visible" :okType="typeMap[type].okType" trigger="custom">
                <Button @click="visible = !visible">点击此处</Button>
                <template #icon>
                    <IconAlertTriangle size="extra-large" :style="{ color: typeMap[type].color }" />
                </template>
                <template #title>确定是否要保存此修改？</template>
                <template #content>此修改将不可逆</template>
            </Popconfirm>
        </div>
    </div>
</template>
