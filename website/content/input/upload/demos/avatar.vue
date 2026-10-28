<script setup lang="ts">
    import { ref } from 'vue';
    import { IconCamera } from '@fibrae/semi-icons-vue';
    import { Avatar, Toast, Upload } from '@fibrae/semi-ui-vue';

    const url = ref('/assets/placeholder/avatar-a.svg');

    const onSuccess = () => {
        Toast.success('头像更新成功');
        url.value = '/assets/ttmoment.jpeg';
    };

    const maskStyle = {
        backgroundColor: 'var(--semi-color-overlay-bg)',
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--semi-color-white)',
    };
</script>

<template>
    <Upload accept="image/*" action="https://api.semi.design/upload" class="avatar-upload" :showUploadList="false" @error="Toast.error('上传失败')" @success="onSuccess">
        <!-- the avatar is the whole content of the upload button, so its alt names the button -->
        <Avatar alt="上传头像" :src="url" :style="{ margin: '4px' }">
            <template #hoverMask>
                <div :style="maskStyle">
                    <IconCamera />
                </div>
            </template>
        </Avatar>
    </Upload>
</template>
