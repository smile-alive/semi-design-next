<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';
</script>

<template>
    <Dropdown :motion="false" trigger="click">
        <button type="button">role trigger</button>
        <template #content>
            <DropdownMenu>
                <Dropdown :motion="false" position="rightTop" role="log" trigger="click">
                    <DropdownItem>role parent</DropdownItem>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem>role inner</DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
