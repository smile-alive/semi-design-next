<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';
</script>

<template>
    <Dropdown :classNames="{ item: 'outer-item', itemIcon: 'outer-icon', menu: 'outer-menu' }" :motion="false" :styles="{ item: { order: 1 } }" trigger="custom" visible>
        <button type="button">owner</button>
        <template #content>
            <DropdownMenu>
                <Dropdown :classNames="{ item: ['inner-item'] }" :motion="false" position="rightTop" :styles="{ item: { opacity: 0.5 } }" trigger="custom" visible>
                    <DropdownItem>Parent</DropdownItem>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem :classNames="{ icon: 'own-icon' }" :style="{ order: 3 }" :styles="{ icon: { order: 4 } }">
                                Inner
                                <template #icon>
                                    <i />
                                </template>
                            </DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
