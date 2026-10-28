<script setup lang="ts">
    import { List, ListItem } from '@fibrae/semi-ui-vue';

    const data = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];
</script>

<template>
    <div>
        <div :style="{ marginRight: '16px' }">
            <h3 :style="{ marginBottom: '16px' }">Default Size</h3>
            <List bordered :dataSource="data">
                <template #header>
                    <div>Header</div>
                </template>
                <template #footer>
                    <div>Footer</div>
                </template>
                <template #item="{ item }">
                    <ListItem>{{ item }}</ListItem>
                </template>
            </List>
        </div>
        <div :style="{ marginRight: '16px' }">
            <h3 :style="{ margin: '16px 0' }">Small Size</h3>
            <List bordered :dataSource="data" size="small">
                <template #header>
                    <div>Header</div>
                </template>
                <template #footer>
                    <div>Footer</div>
                </template>
                <template #item="{ item }">
                    <ListItem>{{ item }}</ListItem>
                </template>
            </List>
        </div>
        <div :style="{ marginRight: '16px' }">
            <h3 :style="{ margin: '16px 0' }">Large Size</h3>
            <List bordered :dataSource="data" size="large">
                <template #header>
                    <div>Header</div>
                </template>
                <template #footer>
                    <div>Footer</div>
                </template>
                <template #item="{ item }">
                    <ListItem>{{ item }}</ListItem>
                </template>
            </List>
        </div>
    </div>
</template>
