<script setup lang="ts">
    import { ref } from 'vue';
    import { RadioGroup, Select, type RadioChangeEvent } from '@fibrae/semi-ui-vue';

    interface Item {
        value: string;
        label: string;
    }

    const list: Record<string, Item[]> = {
        component: [
            { value: 'select', label: '选择器' },
            { value: 'tabs', label: '标签' },
            { value: 'avatar', label: '头像' },
            { value: 'button', label: '按钮' },
        ],
        design: [
            { value: 'color', label: '颜色' },
            { value: 'dark', label: '暗色模式' },
            { value: 'icon', label: '图标' },
            { value: 'font', label: '字体' },
        ],
        feedback: [
            { value: 'faq', label: '常见问题' },
            { value: 'join', label: '加入用户群' },
            { value: 'hornbill', label: '犀鸟反馈问题' },
        ],
    };
    const categoryOptions = [
        { value: 'component', label: '组件' },
        { value: 'design', label: '设计' },
        { value: 'feedback', label: '反馈' },
    ];
    const categoryWrapper = {
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--semi-color-border)',
    };

    const key = ref('component');
    const value = ref<Item | undefined>({ value: 'faq', label: '常见问题' });
    const changeCategory = (event: RadioChangeEvent) => {
        key.value = String(event.target.value);
    };
</script>

<template>
    <Select v-model="value" aria-label="选项" :autoAdjustOverflow="false" changeWithObject defaultOpen :optionList="list[key]" :style="{ width: '200px' }">
        <template #outerTopSlot>
            <!-- The radio group switches with arrow keys, so categories need no tabpanel association -->
            <div :style="categoryWrapper">
                <RadioGroup aria-label="选项分类" buttonSize="small" :modelValue="key" :options="categoryOptions" type="button" @change="changeCategory" />
            </div>
        </template>
    </Select>
</template>
