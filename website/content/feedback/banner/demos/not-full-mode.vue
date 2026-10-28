<script setup lang="ts">
    import { Banner, Typography } from '@fibrae/semi-ui-vue';

    const types = ['info', 'warning', 'danger', 'success'] as const;
</script>

<template>
    <div class="components-banner-demo" style="width: 640px">
        <template v-for="(type, index) in types" :key="type">
            <br v-if="index > 0" />
            <Banner bordered :fullMode="false" :type="type">
                <template #icon />
                <template #closeIcon />
                <template #title>
                    <div style="font-weight: 600; font-size: 14px; line-height: 20px">不知道 AppKey？</div>
                </template>
                <template #description>
                    <div>
                        你可先联系对应的研发同学，确认是否已在
                        <Typography.Text :link="{ href: 'https://semi.design/' }">应用云平台</Typography.Text>
                        申请了应用，并填写对应的信息。
                    </div>
                </template>
            </Banner>
        </template>
    </div>
</template>
