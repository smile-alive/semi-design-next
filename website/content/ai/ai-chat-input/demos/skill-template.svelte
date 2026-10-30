<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
    import { IconSearch, IconTemplateStroked } from '@fibrae/semi-icons-svelte';

    const { Configure } = AIChatInput;
    const modelOptions = [
        { value: 'GPT-5', label: 'GPT-5' },
        { value: 'GPT-4o', label: 'GPT-4o' },
        { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
    ];
    const uploadProps = { action: 'https://api.semi.design/upload' };
    const skills = [
        {
            value: 'writing',
            label: '帮我写作',
            hasTemplate: true,
        },
        {
            value: 'AI 编程',
            label: 'AI coding',
        },
    ];
    const skillIcons: Record<string, Component> = { writing: IconTemplateStroked, 'AI 编程': IconSearch };

    const templates = [
        {
            group: '工作',
            children: [
                {
                    bg: 'var(--semi-color-primary)',
                    title: '总结汇报',
                    desc: '凝练你的工作成效',
                    content: `我的职业是<input-slot placeholder="[请输入职业]"></input-slot>，帮我写一份关于<input-slot placeholder="[输入目的：项目进展总结、团队工作成果或其他]"></input-slot>的总结汇报`,
                },
                {
                    bg: 'var(--semi-color-warning)',
                    title: '话术',
                    desc: '满足不同场景表达需求',
                    content: `我是一名<select-slot value="打工人" options='["打工人","学生"]'></select-slot> ，帮我写一段面向<input-slot placeholder="[输入对象]">陌生同事</input-slot>的话术内容`,
                },
            ],
        },
        {
            group: '商业营销',
            children: [
                {
                    bg: 'var(--semi-color-primary)',
                    title: '宣传文案',
                    desc: '撰写各平台的推广文案',
                    content: '帮我写一篇面向<input-slot placeholder="[输入目标人群]"></input-slot>职场人士，关于<input-slot placeholder="[输入产品]"></input-slot>的宣传文案，需要直击痛点，吸引用户点击。',
                },
                {
                    bg: 'var(--semi-color-warning)',
                    title: '方案策划',
                    desc: '量身定制各种方案',
                    content: '我是一名<input-slot placeholder="[输入职业]"></input-slot>职业策划人 ，帮我写一个<input-slot placeholder="[方案类型：如线下读书会活动方案等]"></input-slot>线下读书会活动 的方案，需要包含但不限于策划目标、详细计划、所需资源和预算、效果评估、风险应对等。',
                },
            ],
        },
    ];

    let groupIndex = $state(0);
    let input = $state<ReturnType<typeof AIChatInput>>();

    const setTemplate = (content: string) => {
        input?.setContentWhileSaveTool(content);
        input?.focusEditor();
    };
</script>

<AIChatInput bind:this={input} placeholder="输入 / 唤起技能，选择技能后，点击模版按钮可查看模版，可通过鼠标上下按键切换侯选项" skillHotKey="/" {skills} style="margin: 12px" {uploadProps}>
    {#snippet configureArea()}
        <Configure.Select field="model" initValue="GPT-4o" optionList={modelOptions} />
    {/snippet}
    {#snippet skillIcon({ item })}
        {@const Icon = skillIcons[item.value ?? '']}
        <Icon />
    {/snippet}
    {#snippet template({ skill })}
        {#if skill?.value === 'writing'}
            <div class="aiChatInput-template">
                <div class="template-header">
                    {#each templates as item, index (item.group)}
                        <button class={['template-header-item', { 'template-header-item-active': groupIndex === index }]} style="border: none; font-family: inherit" type="button" onclick={() => (groupIndex = index)}>
                            {item.group}
                        </button>
                    {/each}
                </div>
                <div class="template-content">
                    {#each templates[groupIndex].children as item (item.title)}
                        <button class="template-content-item" style="font: inherit; text-align: left" type="button" onclick={() => setTemplate(item.content)}>
                            <span class="template-content-item-icon" style="background: {item.bg}">
                                <IconTemplateStroked />
                            </span>
                            <span class="template-content-item-title">{item.title}</span>
                            <span class="template-content-item-desc">{item.desc}</span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
    {/snippet}
</AIChatInput>
