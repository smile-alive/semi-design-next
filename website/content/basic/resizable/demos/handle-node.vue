<script setup lang="ts">
    import { IconTransfer } from '@fibrae/semi-icons-vue/lab';
    import { Resizable } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '500px', height: '60%' }">
        <Resizable
            :defaultSize="{ width: '60%', height: 300 }"
            :style="{
                marginLeft: '20%',
                backgroundColor: 'var(--semi-grey-1)',
                border: 'var(--semi-color-border) 1px solid',
            }"
        >
            <div :style="{ marginLeft: '20%' }">right</div>
            <template #handle="{ direction }">
                <div v-if="direction === 'right'" :style="{ height: '100%', display: 'flex', alignItems: 'center', width: 'fit-content' }">
                    <IconTransfer />
                </div>
            </template>
        </Resizable>
    </div>
</template>
