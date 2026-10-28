<script setup lang="ts">
    import { IconAlertCircle, IconBox, IconForward, IconRefresh, IconSearch, IconSetting } from '@fibrae/semi-icons-vue';
    import { IconToken } from '@fibrae/semi-icons-vue/lab';
    import { Button, Dropdown, HotKeys } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Dropdown position="bottomLeft">
        <Button theme="outline" type="tertiary">
            <template #icon>
                <IconToken />
            </template>
            Hover Me
        </Button>
        <template #content>
            <Dropdown.Menu>
                <Dropdown.Title>分组1</Dropdown.Title>
                <Dropdown.Item>
                    <template #icon>
                        <IconBox />
                    </template>
                    Menu Item 1
                    <HotKeys :content="['Ctrl', 'B']" :hotKeys="[HotKeys.Keys.Control, HotKeys.Keys.B]" :style="{ marginLeft: '20px' }" />
                </Dropdown.Item>
                <Dropdown.Item>
                    <template #icon>
                        <IconSetting />
                    </template>
                    Menu Item 2
                    <HotKeys :content="['Ctrl', 'V']" :hotKeys="[HotKeys.Keys.Control, HotKeys.Keys.V]" :style="{ marginLeft: '20px' }" />
                </Dropdown.Item>
                <Dropdown.Item disabled>
                    <template #icon>
                        <IconForward />
                    </template>
                    Menu Item 3
                    <HotKeys :content="['Ctrl', 'F3']" :hotKeys="[HotKeys.Keys.Control, HotKeys.Keys.F3]" :style="{ marginLeft: '20px' }" />
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Title>分组2</Dropdown.Title>
                <Dropdown.Item type="tertiary">
                    <template #icon>
                        <IconRefresh />
                    </template>
                    tertiary
                </Dropdown.Item>
                <Dropdown.Item type="warning">
                    <template #icon>
                        <IconSearch />
                    </template>
                    warning
                </Dropdown.Item>
                <Dropdown.Item type="danger">
                    <template #icon>
                        <IconAlertCircle />
                    </template>
                    danger
                </Dropdown.Item>
            </Dropdown.Menu>
        </template>
    </Dropdown>
</template>
