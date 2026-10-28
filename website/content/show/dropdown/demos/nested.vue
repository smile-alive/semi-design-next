<script setup lang="ts">
    import { IconToken } from '@fibrae/semi-icons-vue/lab';
    import { Button, Dropdown, Toast } from '@fibrae/semi-ui-vue';

    const submenus = [
        { label: 'Menu Item 1', position: 'rightTop' },
        { label: 'Menu Item 2', position: 'leftTop' },
    ] as const;
</script>

<template>
    <div :style="{ margin: '100px' }">
        <Dropdown>
            <Button theme="outline" type="tertiary">
                <template #icon>
                    <IconToken />
                </template>
                Hover Me
            </Button>
            <template #content>
                <Dropdown.Menu>
                    <Dropdown v-for="submenu in submenus" :key="submenu.label" :position="submenu.position">
                        <Dropdown.Item>{{ submenu.label }}</Dropdown.Item>
                        <template #content>
                            <Dropdown.Menu>
                                <!-- Enter and Space trigger a submenu item's click too -->
                                <Dropdown.Item v-for="n in 3" :key="n" @click="Toast.info(`点击了 Nested Menu Item ${n}`)"> Nested Menu Item {{ n }} </Dropdown.Item>
                            </Dropdown.Menu>
                        </template>
                    </Dropdown>
                    <Dropdown.Item>Menu Item 3</Dropdown.Item>
                </Dropdown.Menu>
            </template>
        </Dropdown>
    </div>
</template>
