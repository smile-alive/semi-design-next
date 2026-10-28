import { Tabs, TabPane } from '@fibrae/semi-ui-solid';

export default function TabsDemo() {
    return (
        <div>
            <Tabs type="line">
                <TabPane tab="文档" itemKey="1">
                    <h3>文档</h3>
                    <p style={{ 'line-height': '1.8' }}>Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                    <p style={{ 'line-height': '1.8' }}>区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
                    <ul>
                        <li>
                            <p>Semi Design 以内容优先进行设计。</p>
                        </li>
                        <li>
                            <p>更容易地自定义主题。</p>
                        </li>
                        <li>
                            <p>适用国际化场景。</p>
                        </li>
                        <li>
                            <p>效率场景加入人性化关怀。</p>
                        </li>
                    </ul>
                </TabPane>
                <TabPane tab="快速起步" itemKey="2">
                    <h3>快速起步</h3>
                    <pre
                        style={{
                            margin: '24px 0',
                            padding: '20px',
                            border: 'none',
                            'white-space': 'normal',
                            'border-radius': 'var(--semi-border-radius-medium)',
                            color: 'var(--semi-color-text-1)',
                            'background-color': 'var(--semi-color-fill-0)',
                        }}
                    >
                        <code>yarn add @fibrae/semi-ui-solid</code>
                    </pre>
                </TabPane>
                <TabPane tab="帮助" itemKey="3">
                    <h3>帮助</h3>
                    <p style={{ 'line-height': '1.8', color: 'var(--semi-color-text-0)', 'font-weight': '600' }}>Q：有新组件需求、或者现有组件feature不能满足业务需求？</p>
                    <p style={{ 'line-height': '1.8', color: 'var(--semi-color-text-1)' }}>右上角问题反馈，提交issue，label选择Feature Request / New Component Request 我们会高优处理这些需求。</p>
                    <p style={{ 'line-height': '1.8', color: 'var(--semi-color-text-0)', 'font-weight': '600' }}>Q：对组件的使用有疑惑？</p>
                    <p style={{ 'line-height': '1.8', color: 'var(--semi-color-text-1)' }}>欢迎进我们的客服lark群进行咨询提问。</p>
                </TabPane>
            </Tabs>
        </div>
    );
}
