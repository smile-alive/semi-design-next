<script setup lang="ts">
    import { ref } from 'vue';
    import { Avatar, Card, CardMeta, Skeleton, SkeletonAvatar, SkeletonImage, SkeletonParagraph, SkeletonTitle, Switch, TypographyText, TypographyTitle } from '@fibrae/semi-ui-vue';

    const loading = ref(true);
</script>

<template>
    <Switch aria-label="显示内容" @change="(v) => (loading = !v)" />
    <br />
    <br />
    <Card :style="{ maxWidth: '300px' }">
        <template #title>
            <CardMeta>
                <template #title>
                    <Skeleton :loading="loading" :style="{ width: '80px' }">
                        <template #placeholder>
                            <SkeletonTitle />
                        </template>
                        <TypographyTitle :heading="5">Semi Doc</TypographyTitle>
                    </Skeleton>
                </template>
                <template #description>
                    <Skeleton :loading="loading" :style="{ width: '150px', marginTop: '12px' }">
                        <template #placeholder>
                            <SkeletonParagraph :rows="1" />
                        </template>
                        <TypographyText>全面、易用、优质</TypographyText>
                    </Skeleton>
                </template>
                <template #avatar>
                    <Skeleton :loading="loading">
                        <template #placeholder>
                            <SkeletonAvatar />
                        </template>
                        <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
                    </Skeleton>
                </template>
            </CardMeta>
        </template>
        <template #headerExtraContent>
            <Skeleton :loading="loading" :style="{ width: '50px' }">
                <template #placeholder>
                    <SkeletonParagraph :rows="1" />
                </template>
                <TypographyText link>More</TypographyText>
            </Skeleton>
        </template>
        <template #cover>
            <Skeleton :loading="loading" :style="{ maxWidth: '100%', height: '220px' }">
                <template #placeholder>
                    <SkeletonImage />
                </template>
                <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
            </Skeleton>
        </template>
    </Card>
</template>
