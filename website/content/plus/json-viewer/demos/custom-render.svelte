<script lang="ts">
    import { Image, JsonViewer, Popover, Rating, Tag, type JsonViewerOptions } from '@fibrae/semi-ui-svelte';

    const data = `{
  "name": "Semi",
  "version": "2.7.4",
  "rating": 5,
  "tags": ["design", "react", "ui"],
  "image": "/assets/root-web-sites/abstract.jpg"
}`;

    // A rule holds data only; the customRender snippet draws the token and tells the rules apart by name
    const options: JsonViewerOptions = {
        formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' },
        customRenderRule: [
            { name: 'popover', match: 'Semi' },
            { name: 'rating', match: (value) => value == 5 },
            {
                name: 'tag',
                match: (_value, path) => path === 'root.tags[0]' || path === 'root.tags[1]' || path === 'root.tags[2]',
            },
            { name: 'image', match: /^http/ },
        ],
        readOnly: true,
        autoWrap: true,
    };

    // content is the raw string token with its quotes; without them it is a valid URL
    const unquote = (content: string) => content.replace(/^"|"$/g, '');
</script>

{#snippet imagePreview(src: string)}
    <Image height={100} {src} width={100} />
{/snippet}

<div>
    <div style="margin-bottom: 16px; margin-top: 16px">
        <JsonViewer height={200} {options} showSearch={false} value={data} width={600}>
            {#snippet customRender({ item, content: text })}
                {#if item.name === 'popover'}
                    <Popover showArrow trigger="hover">
                        {#snippet content()}我是用户自定义的渲染{/snippet}
                        <span>{text}</span>
                    </Popover>
                {:else if item.name === 'rating'}
                    <Rating disabled size={10} value={Number(text)} />
                {:else if item.name === 'tag'}
                    <Tag shape="circle" size="small">{text}</Tag>
                {:else}
                    <Popover showArrow trigger="hover">
                        {#snippet content()}{@render imagePreview(unquote(text))}{/snippet}
                        <span>{text}</span>
                    </Popover>
                {/if}
            {/snippet}
        </JsonViewer>
    </div>
</div>
