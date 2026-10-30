<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };
    const temp = {
        'input-slot': '我是一个<input-slot placeholder="[职业]">程序员</input-slot>',
        'select-slot': `我是<select-slot value="前端开发" options='["设计","前端开发","后端开发"]'></select-slot>，帮我完成...`,
        'skill-slot': `<skill-slot data-label="AI Coding" data-value="AI Coding" data-template=false></skill-slot> 帮我完成...`,
    };
    const names = Object.keys(temp);
    const contents = Object.values(temp);

    let activeIndex = $state(0);
    let input = $state<ReturnType<typeof AIChatInput>>();

    const setTemplate = (index: number) => {
        activeIndex = index;
        input?.setContent(contents[index]);
        input?.focusEditor();
    };
</script>

<div class="aiChatInput-radio" role="tablist">
    {#each names as item, index (item)}
        <div
            aria-selected={index === activeIndex}
            class={['aiChatInput-radio-item', { 'aiChatInput-radio-item-selected': index === activeIndex }]}
            role="tab"
            tabindex="0"
            onclick={() => setTemplate(index)}
            onkeydown={(event) => {
                if (event.key === 'Enter') {
                    setTemplate(index);
                }
            }}
        >
            {item}
        </div>
    {/each}
</div>
<AIChatInput bind:this={input} defaultContent={temp['input-slot']} placeholder="输入内容或者上传内容" style="margin: 12px" {uploadProps} />
