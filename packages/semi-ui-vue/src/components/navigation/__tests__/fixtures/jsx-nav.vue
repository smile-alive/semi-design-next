<script setup lang="ts">
    import Nav, { NavItem, SubNav } from '../..';

    defineProps</* @vue-ignore */ InstanceType<typeof Nav>['$props']>();
</script>

<template>
    <Nav>
        <NavItem itemKey="home" text="首页" />
        <SubNav itemKey="user" text="用户">
            <NavItem itemKey="list" text="用户列表" />
            <NavItem itemKey="ban" text="用户封禁" />
        </SubNav>
        <SubNav itemKey="job" text="任务">
            <NavItem itemKey="query" text="任务查询" />
        </SubNav>
    </Nav>
</template>
