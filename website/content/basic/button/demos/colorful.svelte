<script lang="ts">
    import { IconAIFilledLevel1, IconAIFilledLevel2, IconAIFilledLevel3 } from '@fibrae/semi-icons-svelte';
    import { Button } from '@fibrae/semi-ui-svelte';

    const contents = ['Colorful', undefined];
    const rows = [
        { theme: 'solid', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel3 },
        { theme: 'light', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
        { theme: 'outline', primaryIcon: IconAIFilledLevel1, tertiaryIcon: IconAIFilledLevel2 },
        { theme: 'borderless', primaryIcon: IconAIFilledLevel3, tertiaryIcon: IconAIFilledLevel2 },
    ] as const;
    const variants = [
        { type: 'primary', state: 'default' },
        { type: 'primary', state: 'loading' },
        { type: 'primary', state: 'disabled' },
        { type: 'tertiary', state: 'default' },
        { type: 'tertiary', state: 'loading' },
        { type: 'tertiary', state: 'disabled' },
    ] as const;
</script>

<!-- The text is the children snippet; leaving it out makes the button icon-only, so the label is passed or omitted as a whole. -->
{#each contents as content (content ?? 'icon-only')}
    {#snippet text()}{content}{/snippet}
    <div style="display: flex; row-gap: 16px; margin-top: 20px; margin-left: 10px; flex-direction: column">
        {#each rows as row (row.theme)}
            <div style="display: flex; column-gap: 16px">
                {#each variants as variant (`${variant.type}-${variant.state}`)}
                    {@const Icon = variant.type === 'primary' ? row.primaryIcon : row.tertiaryIcon}
                    {#snippet icon({ fill }: { fill?: string[] })}
                        <Icon {fill} />
                    {/snippet}
                    <Button aria-label={content ? undefined : 'AI'} children={content ? text : undefined} colorful disabled={variant.state === 'disabled'} {icon} loading={variant.state === 'loading'} theme={row.theme} type={variant.type} />
                {/each}
            </div>
        {/each}
    </div>
{/each}
