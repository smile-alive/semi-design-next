<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconForm, IconTree } from '@fibrae/semi-icons-vue/lab';
    import { Nav } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Nav :bodyStyle="{ height: '300px' }" :defaultOpenKeys="['user']" @click="(data) => console.log('trigger onClick: ', data)" @select="(data) => console.log('trigger onSelect: ', data)">
        <Nav.Header text="Semi 运营后台">
            <template #logo>
                <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
            </template>
        </Nav.Header>
        <Nav.Item itemKey="union" text="活动管理">
            <template #icon>
                <IconForm />
            </template>
        </Nav.Item>
        <Nav.Sub itemKey="user" text="用户管理">
            <template #icon>
                <IconBadge />
            </template>
            <Nav.Item itemKey="active" text="活跃用户" />
            <Nav.Item itemKey="negative" text="非活跃用户" />
        </Nav.Sub>
        <Nav.Sub itemKey="union-management" text="任务管理">
            <template #icon>
                <IconTree />
            </template>
            <Nav.Item itemKey="notice" text="任务设置" />
            <Nav.Item itemKey="query" text="任务查询" />
            <Nav.Item itemKey="info" text="信息录入" />
        </Nav.Sub>
        <Nav.Footer collapseButton />
    </Nav>
</template>
