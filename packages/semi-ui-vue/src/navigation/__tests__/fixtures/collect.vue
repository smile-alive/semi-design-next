<script setup lang="ts">
    import Nav, { NavItem, SubNav } from '../..';
    import WrappedItem from './wrapped-item.vue';

    const props = defineProps<{ extra?: boolean; nested?: boolean; keys?: string[] } & /* @vue-ignore */ InstanceType<typeof Nav>['$props']>();
</script>

<template>
    <Nav>
        <SubNav itemKey="user" text="用户">
            <NavItem itemKey="list" text="用户列表" />
            <NavItem v-if="props.nested" itemKey="added" text="新增项" />
        </SubNav>
        <SubNav v-for="key in props.keys ?? []" :key="key" :itemKey="`sub-${key}`" :text="`子菜单 ${key}`">
            <NavItem :itemKey="key" :text="`项 ${key}`" />
        </SubNav>
        <template v-for="key in props.keys ?? []" :key="key">
            <SubNav :itemKey="`group-${key}`" :text="`分组 ${key}`">
                <NavItem :itemKey="`group-item-${key}`" :text="`分组项 ${key}`" />
            </SubNav>
        </template>
        <SubNav v-if="props.extra" itemKey="extra" text="额外">
            <NavItem itemKey="extra-item" text="额外项" />
        </SubNav>
        <SubNav itemKey="wrap" text="包装">
            <WrappedItem />
        </SubNav>
        <NavItem disabled itemKey="off" text="禁用项" />
    </Nav>
</template>
