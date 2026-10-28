<script setup lang="ts">
    import { cloneVNode, type VNode } from 'vue';
    import { Avatar, AvatarGroup, Popover } from '@fibrae/semi-ui-vue';

    // The group provides existing slot vnodes; cloning preserves their content while overriding the popup size.
    function SmallAvatar({ avatar }: { avatar: VNode }) {
        return cloneVNode(avatar, { size: 'extra-small' });
    }
</script>

<template>
    <AvatarGroup :maxCount="3">
        <Avatar alt="Lisa LeBlanc" color="red">LL</Avatar>
        <Avatar alt="Caroline Xiao">CX</Avatar>
        <Avatar alt="Rafal Matin" color="amber">RM</Avatar>
        <Avatar alt="Zank Lance" :style="{ color: '#f56a00', backgroundColor: '#fde3cf' }">ZL</Avatar>
        <Avatar alt="Youself Zhang" :style="{ backgroundColor: '#87d068' }">YZ</Avatar>
        <template #more="{ restNumber, restAvatars }">
            <Popover :autoAdjustOverflow="false" position="bottomRight" :style="{ padding: '12px 8px', paddingBottom: 0 }">
                <Avatar>{{ `+${restNumber}` }}</Avatar>
                <template #content>
                    <div v-for="(avatar, index) in restAvatars" :key="index" :style="{ paddingBottom: '12px' }">
                        <SmallAvatar :avatar="avatar" />
                        <span :style="{ marginLeft: '8px', fontSize: '14px' }">这是段文字描述</span>
                    </div>
                </template>
            </Popover>
        </template>
    </AvatarGroup>
</template>
