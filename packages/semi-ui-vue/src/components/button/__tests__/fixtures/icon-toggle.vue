<script setup lang="ts">
    import { IconEdit } from '@fibrae/semi-icons-vue';
    import Button from '../../index';

    const props = defineProps<{ showIcon?: boolean }>();
</script>

<template>
    <Button>
        <template v-if="props.showIcon" #icon>
            <IconEdit />
        </template>
        x
    </Button>
</template>
