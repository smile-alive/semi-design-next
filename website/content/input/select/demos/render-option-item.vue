<script setup lang="ts">
    import { ref } from 'vue';
    import { Checkbox, Highlight, Select } from '@fibrae/semi-ui-vue';

    const inputValue = ref('');

    const optionList = [
        { value: 'video', label: '短视频', otherKey: 0 },
        { value: 'camera', label: '相机', disabled: true, otherKey: 1 },
        { value: 'editing', label: '剪辑', otherKey: 2 },
        { value: 'news', label: '资讯', otherKey: 3 },
    ];
</script>

<template>
    <Select aria-label="单选" :classNames="{ dropdown: 'components-select-demo-renderOptionItem' }" filter :optionList="optionList" placeholder="单选" style="width: 180px" @search="inputValue = $event">
        <!--
            Put style on the outer DOM or the virtual list breaks; add selected/focused/disabled styles from the slot
            params; bind onMouseenter and class on the outer DOM or arrow keys display wrongly; put id there so screen
            readers announce the option the arrow keys reach
        -->
        <template #optionItem="item">
            <div
                :id="item.id"
                :aria-disabled="item.disabled"
                :aria-selected="item.selected"
                :class="[
                    'custom-option-render',
                    {
                        'custom-option-render-focused': item.focused,
                        'custom-option-render-disabled': item.disabled,
                        'custom-option-render-selected': item.selected,
                    },
                    item.class,
                ]"
                role="option"
                :style="item.style"
                @click="item.onClick"
                @mouseenter="item.onMouseenter"
            >
                <Checkbox :modelValue="item.selected" />
                <div class="option-right">
                    <Highlight :searchWords="[inputValue]" :sourceString="String(item.label)" />
                </div>
            </div>
        </template>
    </Select>
    <br />
    <br />
    <Select aria-label="多选" :classNames="{ dropdown: 'components-select-demo-renderOptionItem' }" filter multiple :optionList="optionList" placeholder="多选" style="width: 320px" @search="inputValue = $event">
        <template #optionItem="item">
            <div
                :id="item.id"
                :aria-disabled="item.disabled"
                :aria-selected="item.selected"
                :class="[
                    'custom-option-render',
                    {
                        'custom-option-render-focused': item.focused,
                        'custom-option-render-disabled': item.disabled,
                        'custom-option-render-selected': item.selected,
                    },
                    item.class,
                ]"
                role="option"
                :style="item.style"
                @click="item.onClick"
                @mouseenter="item.onMouseenter"
            >
                <Checkbox :modelValue="item.selected" />
                <div class="option-right">
                    <Highlight :searchWords="[inputValue]" :sourceString="String(item.label)" />
                </div>
            </div>
        </template>
    </Select>
</template>
