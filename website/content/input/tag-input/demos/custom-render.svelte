<script lang="ts">
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { Avatar, Button, TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['夏可漫']);
    const fallbackAvatar = '/assets/placeholder/avatar-a.svg';
    const avatars = new Map([
        ['夏可漫', '/assets/root-web-sites/avatarDemo.jpeg'],
        ['申悦', '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg'],
        ['曲晨一', '/assets/root-web-sites/bf8647bffab13c38772c9ff94bf91a9d.jpg'],
        ['文嘉茂', '/assets/root-web-sites/avatarDemo.jpeg'],
    ]);
    const itemStyle = 'background-color: var(--semi-color-info-light-default); padding: 4px 8px; border-radius: 12px; display: flex; align-items: center; font-size: 14px; margin-right: 10px';
</script>

<TagInput bind:value>
    {#snippet tag({ value: tag, onClose })}
        <div style={itemStyle}>
            <Avatar alt="avatar" size="extra-small" src={avatars.get(tag) ?? fallbackAvatar} />
            <span style="margin-left: 8px">{`${tag}@semi.com`}</span>
            <Button aria-label={`移除 ${tag}`} size="small" theme="borderless" type="tertiary" onclick={onClose}>
                {#snippet icon()}
                    <IconClose size="small" />
                {/snippet}
            </Button>
        </div>
    {/snippet}
</TagInput>
