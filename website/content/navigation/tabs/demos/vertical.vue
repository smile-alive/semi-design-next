<script setup lang="ts">
    import { ref } from 'vue';
    import { IconFile, IconGlobe, IconHelpCircle } from '@fibrae/semi-icons-vue';
    import { Radio, RadioGroup, TabPane, Tabs, type RadioValue, type TabType } from '@fibrae/semi-ui-vue';

    const type = ref<RadioValue | undefined>('line');
    const contentStyle = { padding: '0 24px' };
    const paragraphStyle = { lineHeight: 1.8 };
    const questionStyle = { lineHeight: 1.8, color: 'var(--semi-color-text-0)', fontWeight: 600 };
    const answerStyle = { lineHeight: 1.8, color: 'var(--semi-color-text-1)' };
    const codeStyle = {
        margin: '24px 0',
        padding: '20px',
        border: 'none',
        whiteSpace: 'normal',
        borderRadius: '6px',
        color: 'var(--semi-color-text-1)',
        backgroundColor: 'var(--semi-color-fill-0)',
    };
</script>

<template>
    <RadioGroup v-model="type" :style="{ display: 'flex', width: '200px', justifyContent: 'center' }" type="button">
        <Radio value="line">Line</Radio>
        <Radio value="card">Card</Radio>
        <Radio value="button">Button</Radio>
    </RadioGroup>
    <br />
    <br />
    <Tabs tabPosition="left" :type="type as TabType">
        <TabPane itemKey="1">
            <template #tab>
                <span><IconFile />文档</span>
            </template>
            <div :style="contentStyle">
                <h3>文档</h3>
                <p :style="paragraphStyle">Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                <p :style="paragraphStyle">区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
            </div>
        </TabPane>
        <TabPane itemKey="2">
            <template #tab>
                <span><IconGlobe />快速起步</span>
            </template>
            <div :style="contentStyle">
                <h3>快速起步</h3>
                <pre :style="codeStyle"><code>yarn add @fibrae/semi-ui-vue</code></pre>
            </div>
        </TabPane>
        <TabPane itemKey="3">
            <template #tab>
                <span><IconHelpCircle />帮助</span>
            </template>
            <div :style="contentStyle">
                <h3>帮助</h3>
                <p :style="questionStyle">Q：有新组件需求、或者现有组件feature不能满足业务需求？</p>
                <p :style="answerStyle">右上角问题反馈，提交issue，label选择Feature Request / New Component Request 我们会高优处理这些需求。</p>
                <p :style="questionStyle">Q：对组件的使用有疑惑？</p>
                <p :style="answerStyle">欢迎进我们的客服lark群进行咨询提问。</p>
            </div>
        </TabPane>
    </Tabs>
</template>
