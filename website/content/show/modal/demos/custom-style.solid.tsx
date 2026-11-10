import { createSignal } from 'solid-js';
import { Button, Modal } from '@fibrae/semi-ui-solid';

export default function ModalDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    const handleOk = () => {
        setVisible(false);
    };
    const handleCancel = () => {
        setVisible(false);
    };
    return (
        <>
            <Button onClick={showDialog}>自定义对话框样式</Button>
            <Modal title="自定义样式" visible={visible()} onOk={handleOk} onCancel={handleCancel} centered bodyStyle={{ overflow: 'auto', height: '200px' }}>
                <p style={{ 'line-height': '1.8' }}>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
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
                        <p>效率场景加入人性化关怀</p>
                    </li>
                </ul>
            </Modal>
        </>
    );
}
