<script lang="ts">
    import { Avatar, AvatarGroup, Popover } from '@fibrae/semi-ui-svelte';

    const items = [{ alt: 'Lisa LeBlanc', color: 'red' as const }, { alt: 'Caroline Xiao' }, { alt: 'Rafal Matin', color: 'amber' as const }, { alt: 'Zank Lance', style: 'color: #f56a00; background-color: #fde3cf' }, { alt: 'Youself Zhang', style: 'background-color: #87d068' }];

    const initials = (alt = '') =>
        alt
            .split(' ')
            .map((word) => word[0])
            .join('');
</script>

<AvatarGroup {items} maxCount={3}>
    {#snippet item({ item })}
        {initials(item.alt)}
    {/snippet}
    {#snippet more({ restNumber, restAvatars })}
        <Popover autoAdjustOverflow={false} position="bottomRight" style="padding: 12px 8px; padding-bottom: 0">
            <!-- the trigger props go on the avatar itself: a wrapper span would put a non-listitem tab stop inside the group's list -->
            {#snippet child({ props })}
                <Avatar {...props}>{`+${restNumber}`}</Avatar>
            {/snippet}
            {#snippet content()}
                <div>
                    {#each restAvatars as avatar (avatar.alt)}
                        <div style="padding-bottom: 12px">
                            <Avatar {...avatar} size="extra-small">{initials(avatar.alt)}</Avatar>
                            <span style="margin-left: 8px; font-size: 14px">这是段文字描述</span>
                        </div>
                    {/each}
                </div>
            {/snippet}
        </Popover>
    {/snippet}
</AvatarGroup>
