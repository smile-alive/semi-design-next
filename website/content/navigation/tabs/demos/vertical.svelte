<script lang="ts">
    import { IconFile, IconGlobe, IconHelpCircle } from '@fibrae/semi-icons-svelte';
    import { Radio, RadioGroup, Tabs, type PlainTab, type RadioValue, type TabType } from '@fibrae/semi-ui-svelte';

    let value = $state<RadioValue | undefined>('line');
    const type = $derived(value as TabType);
    const tabList: PlainTab[] = [
        { itemKey: '1', tab: '文档' },
        { itemKey: '2', tab: '快速起步' },
        { itemKey: '3', tab: '帮助' },
    ];
    const icons = { '1': IconFile, '2': IconGlobe, '3': IconHelpCircle } as const;
    const contentStyle = 'padding: 0 24px';
    const paragraphStyle = 'line-height: 1.8';
    const questionStyle = 'line-height: 1.8; color: var(--semi-color-text-0); font-weight: 600';
    const answerStyle = 'line-height: 1.8; color: var(--semi-color-text-1)';
    const codeStyle = 'margin: 24px 0; padding: 20px; border: none; white-space: normal; border-radius: 6px; color: var(--semi-color-text-1); background-color: var(--semi-color-fill-0)';
</script>

<RadioGroup bind:value style="display: flex; width: 200px; justify-content: center" type="button">
    <Radio value="line">Line</Radio>
    <Radio value="card">Card</Radio>
    <Radio value="button">Button</Radio>
</RadioGroup>
<br />
<br />
<Tabs {tabList} tabPosition="left" {type}>
    {#snippet tab({ item })}
        {@const Icon = icons[item.itemKey as keyof typeof icons]}
        <span><Icon />{item.tab}</span>
    {/snippet}
    {#snippet panel({ itemKey })}
        <div style={contentStyle}>
            {#if itemKey === '1'}
                <h3>文档</h3>
                <p style={paragraphStyle}>Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                <p style={paragraphStyle}>区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
            {:else if itemKey === '2'}
                <h3>快速起步</h3>
                <pre style={codeStyle}><code>yarn add @fibrae/semi-ui-svelte</code></pre>
            {:else}
                <h3>帮助</h3>
                <p style={questionStyle}>Q：有新组件需求、或者现有组件feature不能满足业务需求？</p>
                <p style={answerStyle}>右上角问题反馈，提交issue，label选择Feature Request / New Component Request 我们会高优处理这些需求。</p>
                <p style={questionStyle}>Q：对组件的使用有疑惑？</p>
                <p style={answerStyle}>欢迎进我们的客服lark群进行咨询提问。</p>
            {/if}
        </div>
    {/snippet}
</Tabs>
