<script setup lang="ts">
    import { TagInput, Toast } from '@fibrae/semi-ui-vue';

    // Declared here, not inline: vue-tsc types an import used inside a template arrow function as a ref (`Toast.value`)
    const onExceed = (v: string[]) => {
        Toast.warning('超过 max');
        console.log(v);
    };
    const onInputExceed = (v: string) => {
        Toast.warning('超过 maxLength');
        console.log(v);
    };
</script>

<template>
    <TagInput :max="3" placeholder="最多输入3条标签.." @change="(v) => console.log(v)" @exceed="onExceed" />
    <TagInput :maxLength="5" placeholder="单个标签长度不超过5..." style="margin-block-start: 12px" @change="(v) => console.log(v)" @inputExceed="onInputExceed" />
</template>
