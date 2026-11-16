<script setup lang="ts">
    import Rating from '../..';

    const props = withDefaults(defineProps<{ node?: boolean; text?: string } & /* @vue-ignore */ InstanceType<typeof Rating>['$props']>(), { node: false, text: '赞' });
</script>

<template>
    <Rating>
        <template v-if="props.node" #character>
            <strong class="custom-char">{{ props.text }}</strong>
        </template>
        <template v-else #character>{{ props.text }}</template>
    </Rating>
</template>
