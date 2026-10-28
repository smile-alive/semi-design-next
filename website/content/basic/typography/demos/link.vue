<script setup lang="ts">
    import { IconLink } from '@fibrae/semi-icons-vue';
    import { Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;
</script>

<template>
    <div>
        <Text :link="{ href: 'https://semi.design/' }">链接文本</Text>
        <br />
        <br />
        <Text :link="{ href: 'https://semi.design/' }">打开网站</Text>
        <br />
        <br />
        <Text link underline>
            带下划线的网页链接
            <template #icon>
                <IconLink />
            </template>
        </Text>
    </div>
</template>
