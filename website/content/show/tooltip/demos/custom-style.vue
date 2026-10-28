<script setup lang="ts">
    import { Tag, Tooltip } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Tooltip class="another-classname" :style="{ maxWidth: '320px' }">
            <Tag :style="{ marginRight: '8px' }">Custom Style And ClassName</Tag>
            <template #content>hi semi semi semi semi semi semi semi</template>
        </Tooltip>
    </div>
</template>
