<script setup lang="ts">
    import Button from '../../../button';
    import Popconfirm from '../../popconfirm.vue';

    defineOptions({ inheritAttrs: false });
    defineProps</* @vue-ignore */ InstanceType<typeof Popconfirm>['$props']>();
</script>

<template>
    <input aria-label="outside" />
    <Popconfirm v-bind="$attrs" :motion="false" position="bottomLeft">
        <Button>Save</Button>
        <template #title>确定是否要保存此修改？</template>
    </Popconfirm>
</template>
