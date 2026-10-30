<script lang="ts">
    import { IconSemiLogo, IconVigoLogo } from '@fibrae/semi-icons-svelte';
    import { Button, List, ListItem, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const data = [
        {
            icon: IconSemiLogo,
            title: 'Boost new feature adoption with Integration',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
        {
            icon: IconVigoLogo,
            title: 'Introducing Dark Mode',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
        {
            icon: IconSemiLogo,
            title: 'New List Component',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
    ];
    const btnStyle = 'width: 240px; margin: 4px 50px';
</script>

<Button onclick={() => (visible = true)}>自定义对话框</Button>
<Modal bind:visible>
    {#snippet header()}{/snippet}
    <h3 style="text-align: center; font-size: 24px; margin: 40px">Semi Design New Features</h3>
    <List dataSource={data} split={false}>
        {#snippet item({ item: entry })}
            <ListItem>
                {#snippet header()}
                    <entry.icon style="font-size: 48px" />
                {/snippet}
                {#snippet main()}
                    <div>
                        <h6 style="margin: 0; font-size: 16px">{entry.title}</h6>
                        <p style="margin-top: 4px; color: var(--semi-color-text-1)">{entry.content}</p>
                    </div>
                {/snippet}
            </ListItem>
        {/snippet}
    </List>
    {#snippet footer()}
        <div style="text-align: center">
            <Button style={btnStyle} theme="solid" type="primary" onclick={() => (visible = false)}>Continue</Button>
            <Button style={btnStyle} theme="borderless" type="primary" onclick={() => (visible = false)}>Learn more features</Button>
        </div>
    {/snippet}
</Modal>
