import { IconAIEditLevel1 } from '@fibrae/semi-icons-solid';
import { FloatButton } from '@fibrae/semi-ui-solid';

export default function FloatButtonDemo() {
    const onClick = () => {
        console.log('float button clicked');
    };

    return (
        <>
            <span>方形：页面右下第三列 3</span>
            <FloatButton aria-label="AI 编辑" shape="square" icon={<IconAIEditLevel1 />} style={{ bottom: '150px' }} onClick={onClick} />
        </>
    );
}
