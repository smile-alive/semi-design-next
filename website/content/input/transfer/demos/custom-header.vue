<script setup lang="ts">
    import { Button, Transfer } from '@fibrae/semi-ui-vue';

    const data = Array.from({ length: 30 }, (_v, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));

    const headerStyle = { margin: '10px 0 0 10px', height: '24px', display: 'flex', alignItems: 'center' };
</script>

<template>
    <Transfer :dataSource="data" :style="{ width: '568px', height: '416px' }">
        <template #sourceHeader="header">
            <div :style="headerStyle">
                <span>共 {{ header.num }} 项</span>
                <Button v-if="header.showButton" size="small" theme="borderless" type="tertiary" @click="header.onAllClick">
                    {{ header.allChecked ? '取消全选' : '全选' }}
                </Button>
            </div>
        </template>
        <template #selectedHeader="header">
            <div :style="headerStyle">
                <span>{{ header.num }} 项已选</span>
                <Button v-if="header.showButton" size="small" theme="borderless" type="tertiary" @click="header.onClear"> 清空 </Button>
            </div>
        </template>
    </Transfer>
</template>
