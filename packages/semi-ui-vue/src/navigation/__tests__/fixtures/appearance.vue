<script setup lang="ts">
    import Nav, { NavFooter, NavHeader, NavItem, SubNav } from '../..';
</script>

<template>
    <Nav :bodyStyle="{ height: '320px' }" :defaultOpenKeys="['user']">
        <NavHeader text="Semi 运营后台">
            <template #logo>bytedance_logo</template>
        </NavHeader>
        <NavItem itemKey="union" text="公会中心" />
        <SubNav itemKey="user" text="用户管理">
            <NavItem itemKey="golder" text="金主管理" />
            <NavItem itemKey="ban" text="用户封禁" />
        </SubNav>
        <SubNav itemKey="union-management" text="公会管理">
            <NavItem itemKey="notice" text="公告设置" />
            <NavItem itemKey="query" text="公会查询" />
            <NavItem itemKey="info" text="信息录入" />
        </SubNav>
        <NavFooter collapseButton />
    </Nav>
</template>
