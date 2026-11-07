<script setup lang="ts">
    import Card, { CardMeta } from '../..';

    defineProps<{ show: boolean }>();
</script>

<template>
    <Card>
        <template #title>
            <span v-if="show">title</span>
        </template>
        <template #headerExtraContent>
            <span v-if="show">extra</span>
        </template>
        <template #cover>
            <img v-if="show" alt="cover" />
        </template>
        <template #footer>
            <span v-if="show">footer</span>
        </template>
        <template v-if="show" #actions>
            <span>action</span>
        </template>
        <span v-if="show">body</span>
        <CardMeta>
            <template #avatar>
                <span v-if="show">avatar</span>
            </template>
            <template #title>
                <span v-if="show">meta title</span>
            </template>
            <template #description>
                <span v-if="show">description</span>
            </template>
        </CardMeta>
    </Card>
</template>
