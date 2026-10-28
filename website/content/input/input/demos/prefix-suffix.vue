<script setup lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { Input, TypographyText } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Input aria-label="Search" showClear>
        <template #prefix>
            <IconSearch />
        </template>
    </Input>
    <br />
    <br />
    <Input aria-label="Input with text prefix" showClear>
        <template #prefix>Prefix</template>
    </Input>
    <br />
    <br />
    <Input aria-label="Search" showClear>
        <template #suffix>
            <IconSearch />
        </template>
    </Input>
    <br />
    <br />
    <Input aria-label="Input with text suffix" showClear>
        <template #suffix>
            <TypographyText strong style="margin-inline-end: 8px" type="secondary">Suffix</TypographyText>
        </template>
    </Input>
</template>
