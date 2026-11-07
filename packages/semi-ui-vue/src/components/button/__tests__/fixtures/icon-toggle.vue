<script setup lang="ts">
    import { IconEdit } from '@fibrae/semi-icons-vue';
    import Button from '../../index';

    defineProps<{ showIcon?: boolean }>();
</script>

<template>
    <Button>
        <template v-if="showIcon" #icon>
            <IconEdit />
        </template>
        x
    </Button>
</template>
