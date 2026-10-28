<script setup lang="ts">
    import { onBeforeUnmount, ref } from 'vue';
    import { Avatar, Button, List, Skeleton } from '@fibrae/semi-ui-vue';

    interface Book {
        title?: string;
        loading: boolean;
    }

    const count = 3;
    const data: Book[] = [];
    for (let i = 0; i < 40; i++) {
        data.push({ title: `Semi Design Title ${i}`, loading: false });
    }
    const placeholders: Book[] = [0, 1, 2].map(() => ({ loading: true }));

    const fetchData = (page: number) =>
        new Promise<Book[]>((resolve) => {
            setTimeout(() => resolve(data.slice(page * count, page * count + count)), 1000);
        });

    const dataSource = ref<Book[]>([]);
    const loading = ref(true);
    const noMore = ref(false);
    let page = 0;
    let disposed = false;
    onBeforeUnmount(() => {
        disposed = true;
    });

    const load = async () => {
        loading.value = true;
        const newDataSource = await fetchData(page);
        if (disposed) return;
        dataSource.value = [...dataSource.value, ...newDataSource];
        loading.value = false;
        noMore.value = !newDataSource.length;
    };

    const onLoadMore = () => {
        page += 1;
        void load();
    };

    void load();
</script>

<template>
    <List :dataSource="loading ? [...dataSource, ...placeholders] : dataSource" :loading="loading">
        <template #item="{ item }">
            <Skeleton :loading="item.loading">
                <template #placeholder>
                    <div
                        :style="{
                            display: 'flex',
                            alignItems: 'flex-start',
                            padding: '12px',
                            borderBottom: '1px solid var(--semi-color-border)',
                        }"
                    >
                        <Skeleton.Avatar :style="{ marginRight: '12px' }" />
                        <div>
                            <Skeleton.Title :style="{ width: '120px', marginBottom: '12px', marginTop: '12px' }" />
                            <Skeleton.Paragraph :rows="2" :style="{ width: '600px' }" />
                        </div>
                    </div>
                </template>
                <List.Item>
                    <template #header>
                        <Avatar color="grey">SE</Avatar>
                    </template>
                    <template #main>
                        <div>
                            <span :style="{ color: 'var(--semi-color-text-0)', fontWeight: 500 }">{{ item.title }}</span>
                            <p :style="{ color: 'var(--semi-color-text-2)', margin: '4px 0' }">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                        </div>
                    </template>
                </List.Item>
            </Skeleton>
        </template>
        <template v-if="!loading && !noMore" #loadMore>
            <div :style="{ textAlign: 'center', marginTop: '12px', height: '32px', lineHeight: '32px' }">
                <Button @click="onLoadMore">显示更多</Button>
            </div>
        </template>
    </List>
</template>
