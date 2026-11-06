<script lang="ts">
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { Avatar, Button, TagInput } from '@fibrae/semi-ui-svelte';

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

    let value = $state(['夏可漫']);
</script>

<TagInput bind:value>
    {#snippet tag(tagItem)}
        <div style="background-color: var(--semi-color-info-light-default); padding: 4px 8px; border-radius: 12px; display: flex; align-items: center; font-size: 14px; margin-inline-end: 10px">
            <Avatar alt="avatar" size="extra-small" src={mapList.get(tagItem.value)?.avatar ?? fallbackAvatar} />
            <span style="margin-inline-start: 8px">{`${tagItem.value}@semi.com`}</span>
            <Button aria-label={`移除 ${tagItem.value}`} size="small" theme="borderless" type="tertiary" onclick={tagItem.onClose}>
                {#snippet icon()}
                    <IconClose size="small" />
                {/snippet}
            </Button>
        </div>
    {/snippet}
</TagInput>
