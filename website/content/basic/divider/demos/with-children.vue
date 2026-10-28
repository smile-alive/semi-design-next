<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { Divider } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Divider align="left" margin="12px">这是居左文字</Divider>

        <Divider align="center" margin="12px">这是居中文字</Divider>

        <Divider align="right" margin="12px">这是居右文字</Divider>

        <Divider margin="12px">
            <IconSemiLogo />
        </Divider>
    </div>
</template>
