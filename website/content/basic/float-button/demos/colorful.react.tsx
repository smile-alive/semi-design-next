import { IconAIEditLevel1 } from '@fibrae/semi-icons-react';
import { FloatButton } from '@fibrae/semi-ui-react';

export default function FloatButtonDemo() {
    return (
        <>
            <span>多彩按钮：页面右下第一列</span>
            <FloatButton aria-label="访问 Semi 官网" colorful icon={<IconAIEditLevel1 />} style={{ bottom: '110px', insetInlineEnd: '150px' }} href="https://semi.design" rel="noopener noreferrer" target="_blank" />
        </>
    );
}
