import { IconAIEditLevel1 } from '@fibrae/semi-icons-react';
import { FloatButton } from '@fibrae/semi-ui-react';

export default function FloatButtonDemo() {
    const onClick = () => {
        console.log('float button clicked');
    };
    return (
        <>
            <span>大尺寸：页面右下第三列 2</span>
            <FloatButton aria-label="AI 编辑" size="large" icon={<IconAIEditLevel1 />} style={{ bottom: '200px' }} onClick={onClick} />
        </>
    );
}
