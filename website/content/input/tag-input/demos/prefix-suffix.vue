<script setup lang="ts">
    import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-vue';
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput>
        <template #prefix>
            <IconVigoLogo />
        </template>
    </TagInput>
    <br />
    <br />
    <TagInput>
        <template #prefix>Prefix</template>
    </TagInput>
    <br />
    <br />
    <TagInput>
        <template #suffix>
            <IconGift />
        </template>
    </TagInput>
    <br />
    <br />
    <TagInput>
        <template #suffix>Suffix</template>
    </TagInput>
</template>
