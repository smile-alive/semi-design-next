<script lang="ts">
    import { IconCamera } from '@fibrae/semi-icons-svelte';
    import { Avatar, Toast, Upload } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const api = '/upload';
    const imageOnly = 'image/*';

    let url = $state('/assets/placeholder/avatar-a.svg');

    const onSuccess = () => {
        Toast.success('头像更新成功');
        url = '/assets/ttmoment.jpeg';
    };

    const maskStyle = 'background-color: var(--semi-color-overlay-bg); height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; color: var(--semi-color-white)';
</script>

<Upload accept={imageOnly} action={api} class="avatar-upload" customRequest={mockUpload} onError={() => Toast.error('上传失败')} {onSuccess} showUploadList={false}>
    <!-- the avatar is the whole content of the upload button, so its alt names the button -->
    <Avatar alt="上传头像" src={url} style="margin: 4px">
        {#snippet hoverMask()}
            <div style={maskStyle}>
                <IconCamera />
            </div>
        {/snippet}
    </Avatar>
</Upload>
