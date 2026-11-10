<script setup lang="ts">
    import { IconLink } from '@fibrae/semi-icons-vue';
    import { Typography } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Typography.Text :link="{ href: 'https://semi-design-next.pages.dev/' }">链接文本</Typography.Text>
        <br />
        <br />
        <Typography.Text :link="{ href: 'https://semi-design-next.pages.dev/' }">打开网站</Typography.Text>
        <br />
        <br />
        <Typography.Text link underline>
            带下划线的网页链接
            <template #icon>
                <IconLink />
            </template>
        </Typography.Text>
    </div>
</template>
