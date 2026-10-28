<script setup lang="ts">
    import { TagInput, Toast } from '@fibrae/semi-ui-vue';

    const onExceed = (value: string[]) => {
        Toast.warning('超过 max');
        console.log(value);
    };
    const onInputExceed = (value: string) => {
        Toast.warning('超过 maxLength');
        console.log(value);
    };
</script>

<template>
    <TagInput :max="3" placeholder="最多输入3条标签.." @change="(v) => console.log(v)" @exceed="onExceed" />
    <TagInput :maxLength="5" placeholder="单个标签长度不超过5..." style="margin-top: 12px" @change="(v) => console.log(v)" @inputExceed="onInputExceed" />
</template>
