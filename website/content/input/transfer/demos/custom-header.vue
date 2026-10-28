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
        <template #sourceHeader="{ num, showButton, allChecked, onAllClick }">
            <div :style="headerStyle">
                <span>共 {{ num }} 项</span>
                <Button v-if="showButton" size="small" theme="borderless" type="tertiary" @click="onAllClick">
                    {{ allChecked ? '取消全选' : '全选' }}
                </Button>
            </div>
        </template>
        <template #selectedHeader="{ num, showButton, onClear }">
            <div :style="headerStyle">
                <span>{{ num }} 项已选</span>
                <Button v-if="showButton" size="small" theme="borderless" type="tertiary" @click="onClear"> 清空 </Button>
            </div>
        </template>
    </Transfer>
</template>
