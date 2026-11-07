<script setup lang="ts">
    import Nav, { NavItem, SubNav } from '../..';

    defineProps</* @vue-ignore */ InstanceType<typeof Nav>['$props']>();
</script>

<template>
    <Nav>
        <SubNav itemKey="user" text="用户管理">
            <NavItem itemKey="list" link="/users" text="用户列表" />
        </SubNav>
        <SubNav itemKey="task" text="任务管理">
            <NavItem itemKey="query" link="/tasks" text="任务查询" />
        </SubNav>
    </Nav>
</template>
