<script setup lang="ts">
    import { reactive } from 'vue';
    import { IconTreeTriangleDown } from '@fibrae/semi-icons-vue';
    import { Button, Dropdown, SplitButtonGroup, type DropDownMenuItem } from '@fibrae/semi-ui-vue';

    const menu: DropDownMenuItem[] = [
        { node: 'item', name: '编辑项目', onClick: () => console.log('编辑项目点击') },
        { node: 'item', name: '重置项目' },
        { node: 'divider' },
        { node: 'item', name: '复制项目' },
        { node: 'item', name: '从项目创建模版' },
        { node: 'divider' },
        { node: 'item', name: '删除项目', type: 'danger' },
    ];

    const btnVisible = reactive<Record<number, boolean>>({ 1: false, 2: false, 3: false });
</script>

<template>
    <div>
        <SplitButtonGroup aria-label="项目操作按钮组" :style="{ marginRight: '10px' }">
            <Button theme="solid" type="primary">分裂按钮</Button>
            <Dropdown :menu="menu" position="bottomRight" trigger="click" @visibleChange="(v) => (btnVisible[1] = v)">
                <Button aria-label="更多操作" :style="btnVisible[1] ? { background: 'var(--semi-color-primary-hover)', padding: '8px 4px' } : { padding: '8px 4px' }" theme="solid" type="primary">
                    <template #icon>
                        <IconTreeTriangleDown />
                    </template>
                </Button>
            </Dropdown>
        </SplitButtonGroup>
        <SplitButtonGroup aria-label="项目操作按钮组" :style="{ marginRight: '10px' }">
            <Button theme="light" type="primary">分裂按钮</Button>
            <Dropdown :menu="menu" position="bottomRight" trigger="click" @visibleChange="(v) => (btnVisible[2] = v)">
                <Button aria-label="更多操作" :style="btnVisible[2] ? { background: 'var(--semi-color-fill-1)', padding: '8px 4px' } : { padding: '8px 4px' }" theme="light" type="primary">
                    <template #icon>
                        <IconTreeTriangleDown />
                    </template>
                </Button>
            </Dropdown>
        </SplitButtonGroup>
        <SplitButtonGroup aria-label="项目操作按钮组">
            <Button :style="btnVisible[3] ? { background: 'var(--semi-color-fill-0)' } : {}" theme="borderless" type="primary"> 分裂按钮 </Button>
            <Dropdown :menu="menu" position="bottomRight" trigger="click" @visibleChange="(v) => (btnVisible[3] = v)">
                <Button aria-label="更多操作" :style="btnVisible[3] ? { background: 'var(--semi-color-fill-1)', padding: '8px 4px' } : { padding: '8px 4px' }" theme="borderless" type="primary">
                    <template #icon>
                        <IconTreeTriangleDown />
                    </template>
                </Button>
            </Dropdown>
        </SplitButtonGroup>
    </div>
</template>
