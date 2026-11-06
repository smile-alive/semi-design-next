<script setup lang="ts">
    import { ref } from 'vue';
    import { Avatar, Card, Skeleton, Switch, Typography } from '@fibrae/semi-ui-vue';

    const loading = ref(true);
</script>

<template>
    <Switch aria-label="显示内容" @change="(v) => (loading = !v)" />
    <br />
    <br />
    <Card :style="{ maxWidth: '300px' }">
        <template #title>
            <Card.Meta>
                <template #title>
                    <Skeleton :loading="loading" :style="{ width: '80px' }">
                        <template #placeholder>
                            <Skeleton.Title />
                        </template>
                        <Typography.Title :heading="5">Semi Doc</Typography.Title>
                    </Skeleton>
                </template>
                <template #description>
                    <Skeleton :loading="loading" :style="{ width: '150px', marginTop: '12px' }">
                        <template #placeholder>
                            <Skeleton.Paragraph :rows="1" />
                        </template>
                        <Typography.Text>全面、易用、优质</Typography.Text>
                    </Skeleton>
                </template>
                <template #avatar>
                    <Skeleton :loading="loading">
                        <template #placeholder>
                            <Skeleton.Avatar />
                        </template>
                        <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
                    </Skeleton>
                </template>
            </Card.Meta>
        </template>
        <template #headerExtraContent>
            <Skeleton :loading="loading" :style="{ width: '50px' }">
                <template #placeholder>
                    <Skeleton.Paragraph :rows="1" />
                </template>
                <Typography.Text link>More</Typography.Text>
            </Skeleton>
        </template>
        <template #cover>
            <Skeleton :loading="loading" :style="{ maxWidth: '100%', height: '220px' }">
                <template #placeholder>
                    <Skeleton.Image />
                </template>
                <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
            </Skeleton>
        </template>
    </Card>
</template>
