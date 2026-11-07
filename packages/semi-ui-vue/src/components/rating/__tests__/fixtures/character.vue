<script setup lang="ts">
    import Rating from '../..';

    withDefaults(defineProps<{ node?: boolean; text?: string } & /* @vue-ignore */ InstanceType<typeof Rating>['$props']>(), { node: false, text: '赞' });
</script>

<template>
    <Rating>
        <template v-if="node" #character>
            <strong class="custom-char">{{ text }}</strong>
        </template>
        <template v-else #character>{{ text }}</template>
    </Rating>
</template>
