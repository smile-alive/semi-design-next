<script setup lang="ts">
    import { ref } from 'vue';
    import { Checkbox, Highlight, Select } from '@fibrae/semi-ui-vue';

    const inputValue = ref('');

    const optionList = [
        { value: 'douyin', label: '抖音', otherKey: 0 },
        { value: 'ulikecam', label: '轻颜相机', disabled: true, otherKey: 1 },
        { value: 'jianying', label: '剪映', otherKey: 2 },
        { value: 'toutiao', label: '今日头条', otherKey: 3 },
    ];
</script>

<template>
    <Select aria-label="单选" dropdownClassName="components-select-demo-renderOptionItem" filter :optionList="optionList" placeholder="单选" style="width: 180px" @search="inputValue = $event">
        <!--
            Put style on the outer DOM or the virtual list breaks; add selected/focused/disabled styles from the slot
            params; bind onMouseenter and class on the outer DOM or arrow keys display wrongly; put id there so screen
            readers announce the option the arrow keys reach
        -->
        <template #optionItem="{ id, disabled, selected, label, focused, class: className, style, onClick, onMouseenter }">
            <div
                :id="id"
                :aria-disabled="disabled"
                :aria-selected="selected"
                :class="[
                    'custom-option-render',
                    {
                        'custom-option-render-focused': focused,
                        'custom-option-render-disabled': disabled,
                        'custom-option-render-selected': selected,
                    },
                    className,
                ]"
                role="option"
                :style="style"
                @click="onClick"
                @mouseenter="onMouseenter"
            >
                <Checkbox :modelValue="selected" />
                <div class="option-right">
                    <Highlight :searchWords="[inputValue]" :sourceString="String(label)" />
                </div>
            </div>
        </template>
    </Select>
    <br />
    <br />
    <Select aria-label="多选" dropdownClassName="components-select-demo-renderOptionItem" filter multiple :optionList="optionList" placeholder="多选" style="width: 320px" @search="inputValue = $event">
        <template #optionItem="{ id, disabled, selected, label, focused, class: className, style, onClick, onMouseenter }">
            <div
                :id="id"
                :aria-disabled="disabled"
                :aria-selected="selected"
                :class="[
                    'custom-option-render',
                    {
                        'custom-option-render-focused': focused,
                        'custom-option-render-disabled': disabled,
                        'custom-option-render-selected': selected,
                    },
                    className,
                ]"
                role="option"
                :style="style"
                @click="onClick"
                @mouseenter="onMouseenter"
            >
                <Checkbox :modelValue="selected" />
                <div class="option-right">
                    <Highlight :searchWords="[inputValue]" :sourceString="String(label)" />
                </div>
            </div>
        </template>
    </Select>
</template>
