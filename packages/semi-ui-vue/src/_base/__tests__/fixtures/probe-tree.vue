<script setup lang="ts">
    import ProbeNode from './probe-node.vue';

    defineProps<{ reset?: boolean }>();
</script>

<template>
    <ProbeNode name="outer">
        <ProbeNode name="inner">
            <ProbeNode name="leaf" silent />
            <ProbeNode name="reset" :reset="reset">
                <ProbeNode name="after-reset" silent />
            </ProbeNode>
        </ProbeNode>
    </ProbeNode>
</template>
