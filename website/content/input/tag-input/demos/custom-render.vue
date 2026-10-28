<script setup lang="ts">
    import { ref } from 'vue';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { Avatar, Button, TagInput } from '@fibrae/semi-ui-vue';

    const value = ref(['夏可漫']);
    const fallbackAvatar = '/assets/placeholder/avatar-a.svg';
    const avatars = new Map([
        ['夏可漫', '/assets/root-web-sites/avatarDemo.jpeg'],
        ['申悦', '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg'],
        ['曲晨一', '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg'],
        ['文嘉茂', '/assets/root-web-sites/avatarDemo.jpeg'],
    ]);
    const itemStyle = {
        backgroundColor: 'var(--semi-color-info-light-default)',
        padding: '4px 8px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        marginRight: '10px',
    };
</script>

<template>
    <TagInput v-model="value">
        <template #tag="{ value: tag, onClose }">
            <div :style="itemStyle">
                <Avatar alt="avatar" size="extra-small" :src="avatars.get(tag) ?? fallbackAvatar" />
                <span :style="{ marginLeft: '8px' }">{{ `${tag}@semi.com` }}</span>
                <Button :aria-label="`移除 ${tag}`" size="small" theme="borderless" type="tertiary" @click="onClose">
                    <template #icon>
                        <IconClose size="small" />
                    </template>
                </Button>
            </div>
        </template>
    </TagInput>
</template>
