import { IconAIStrokedLevel3, IconHelpCircleStroked, IconSearchStroked } from '@fibrae/semi-icons-solid';
import { FloatButtonGroup } from '@fibrae/semi-ui-solid';

export default function FloatButtonDemo() {
    const items = [
        { icon: <IconAIStrokedLevel3 />, content: '编辑', value: 'editor' },
        { icon: <IconSearchStroked />, content: '搜索', value: 'search', disabled: true },
        { icon: <IconHelpCircleStroked />, content: '帮助', value: 'help', href: 'https://semi.design', target: '_blank' },
    ];

    return (
        <>
            <span>页面右下方最后一行</span>
            <FloatButtonGroup
                style={{ 'inset-inline-end': '24px', bottom: '50px' }}
                onClick={(value) => {
                    console.log('点击了 ', value);
                }}
                items={items}
            />
        </>
    );
}
