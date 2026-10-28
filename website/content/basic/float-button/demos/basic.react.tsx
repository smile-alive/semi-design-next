import { IconAIEditLevel1 } from '@fibrae/semi-icons-react';
import { FloatButton } from '@fibrae/semi-ui-react';

export default function FloatButtonDemo() {
    const onClick = () => {
        console.log('float button clicked');
    };

    return (
        <>
            <span>基本使用：页面右下第三列 1 </span>
            <FloatButton aria-label="AI 编辑" icon={<IconAIEditLevel1 />} style={{ bottom: '270px' }} onClick={onClick} />
        </>
    );
}
