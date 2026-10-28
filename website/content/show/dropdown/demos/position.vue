<script setup lang="ts">
    import { Dropdown, Tag } from '@fibrae/semi-ui-vue';

    const positions = ['bottom', 'bottomLeft', 'bottomRight'] as const;
</script>

<template>
    <div>
        <template v-for="(position, index) in positions" :key="position">
            <template v-if="index > 0">
                <br />
                <br />
            </template>
            <Dropdown :position="position">
                <Tag>{{ position === 'bottom' ? 'Bottom' : position }}</Tag>
                <template #content>
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                </template>
            </Dropdown>
        </template>
    </div>
</template>
