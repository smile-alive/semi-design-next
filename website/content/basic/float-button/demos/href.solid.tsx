import { IconAIEditLevel1 } from '@fibrae/semi-icons-solid';
import { FloatButton } from '@fibrae/semi-ui-solid';

export default function FloatButtonDemo() {
    return (
        <>
            <span>点击跳转：页面右下第三列 4</span>
            <FloatButton aria-label="访问 Semi 官网" icon={<IconAIEditLevel1 />} style={{ bottom: '100px' }} href="https://semi.design" rel="noopener noreferrer" target="_blank" />
        </>
    );
}
