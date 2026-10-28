<script setup lang="ts">
    import { onBeforeUnmount, ref } from 'vue';
    import { Avatar, Button, List, Spin } from '@fibrae/semi-ui-vue';

    interface Book {
        title: string;
    }

    const count = 5;
    const dataList: Book[] = [];
    for (let i = 0; i < 100; i++) {
        dataList.push({ title: `Semi Design Title ${i}` });
    }

    const fetchData = (page: number) =>
        new Promise<Book[]>((resolve) => {
            setTimeout(() => resolve(dataList.slice(page * count, page * count + count)), 1000);
        });

    const dataSource = ref<Book[]>([]);
    const loading = ref(true);
    const hasMore = ref(true);
    const page = ref(0);
    let disposed = false;
    onBeforeUnmount(() => {
        disposed = true;
    });

    const load = async () => {
        loading.value = true;
        const newDataSource = await fetchData(page.value);
        if (disposed) return;
        dataSource.value = [...dataSource.value, ...newDataSource];
        loading.value = false;
        hasMore.value = !!newDataSource.length;
    };

    const onLoadMore = () => {
        page.value += 1;
        void load();
    };

    const showLoadMore = () => (page.value + 1) % 4 === 0;

    const onScroll = (event: Event) => {
        const el = event.currentTarget as HTMLElement;
        if (loading.value || !hasMore.value || showLoadMore()) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight <= 20) onLoadMore();
    };

    void load();
</script>

<template>
    <section aria-label="可滚动列表" class="light-scrollbar" :style="{ height: '420px', overflow: 'auto', border: '1px solid var(--semi-color-border)', padding: '10px' }" tabindex="0" @scroll="onScroll">
        <List :dataSource="dataSource">
            <template #item="{ item }">
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
            </template>
            <template v-if="!loading && hasMore && showLoadMore()" #loadMore>
                <div :style="{ textAlign: 'center', marginTop: '12px', height: '32px', lineHeight: '32px' }">
                    <Button @click="onLoadMore">显示更多</Button>
                </div>
            </template>
        </List>
        <div v-if="loading && hasMore" :style="{ textAlign: 'center' }">
            <Spin />
        </div>
    </section>
</template>
