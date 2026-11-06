<script setup lang="ts">
    import { ref } from 'vue';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { Avatar, Button, TagInput } from '@fibrae/semi-ui-vue';

    const list = [
        {
            name: '夏可漫',
            avatar: '/assets/root-web-sites/avatarDemo.jpeg',
        },
        {
            name: '申悦',
            avatar: '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg',
        },
        {
            name: '曲晨一',
            avatar: '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg',
        },
        {
            name: '文嘉茂',
            avatar: '/assets/root-web-sites/avatarDemo.jpeg',
        },
    ];
    const mapList = new Map(list.map((item) => [item.name, item]));
    const fallbackAvatar = '/assets/placeholder/avatar-a.svg';

    const value = ref(['夏可漫']);
</script>

<template>
    <TagInput v-model="value">
        <template #tag="tagItem">
            <div
                :style="{
                    backgroundColor: 'var(--semi-color-info-light-default)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    marginInlineEnd: '10px',
                }"
            >
                <Avatar alt="avatar" size="extra-small" :src="mapList.get(tagItem.value)?.avatar ?? fallbackAvatar" />
                <span :style="{ marginInlineStart: '8px' }">{{ `${tagItem.value}@semi.com` }}</span>
                <Button :aria-label="`移除 ${tagItem.value}`" size="small" theme="borderless" type="tertiary" @click="tagItem.onClose">
                    <template #icon>
                        <IconClose size="small" />
                    </template>
                </Button>
            </div>
        </template>
    </TagInput>
</template>
