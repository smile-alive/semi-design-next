<script setup lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { Button, JsonViewer } from '@fibrae/semi-ui-vue';

    const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
</script>

<template>
    <div :style="{ marginBottom: '16px' }">
        <JsonViewer :height="200" :modelValue="data" :width="700">
            <template #searchButton="{ defaultButton, showSearchBar, onToggleSearchBar }">
                <div :style="{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }">
                    <Button v-if="!showSearchBar" @click="onToggleSearchBar">
                        <template #icon>
                            <IconSearch />
                        </template>
                        搜索
                    </Button>
                    <component :is="defaultButton" v-else />
                </div>
            </template>
        </JsonViewer>
    </div>
</template>
