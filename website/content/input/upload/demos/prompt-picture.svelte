<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem, type PromptPositionType } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';
    const marginStyle: Partial<Record<PromptPositionType, string>> = {
        right: 'margin-left: 10px',
    };
    const promptStyle = (pos: PromptPositionType) => `display: flex; align-items: center; color: var(--semi-color-text-2); height: 100%; ${marginStyle[pos] ?? ''}`;
    const initialList = (): FileItem[] => [
        {
            uid: '1',
            name: 'dy.jpeg',
            status: 'success',
            size: '130kb',
            url: '/assets/placeholder/avatar-a.svg',
        },
        {
            uid: '5',
            name: 'resso.jpeg',
            status: 'wait',
            percent: 50,
            size: '222kb',
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];
    const positions: PromptPositionType[] = ['right', 'bottom'];
</script>

{#each positions as pos, index (pos)}
    {#if index}
        <div style="margin-bottom: 12px; margin-top: 12px; border-bottom: 1px solid var(--semi-color-border)"></div>
    {/if}
    <Upload {action} fileList={initialList()} listType="picture" promptPosition={pos}>
        {#snippet prompt()}
            <div style={promptStyle(pos)}>请上传认证材料</div>
        {/snippet}
        <IconPlus aria-label="上传图片" size="extra-large" />
    </Upload>
{/each}
