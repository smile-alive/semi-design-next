import { IconAIStrokedLevel3, IconSearchStroked, IconHelpCircleStroked } from '@fibrae/semi-icons-react';
import { FloatButtonGroup } from '@fibrae/semi-ui-react';

export default function FloatButtonDemo() {
    return (
        <>
            <span>页面右下方最后一行</span>
            <FloatButtonGroup
                style={{
                    insetInlineEnd: 24,
                    bottom: 50,
                }}
                onClick={(value) => {
                    console.log('点击了 ', value);
                }}
                items={[
                    {
                        icon: <IconAIStrokedLevel3 />,
                        content: '编辑',
                        value: 'editor',
                    },
                    {
                        icon: <IconSearchStroked />,
                        content: '搜索',
                        value: 'search',
                        disabled: true,
                    },
                    {
                        icon: <IconHelpCircleStroked />,
                        content: '帮助',
                        value: 'help',
                        href: 'https://semi.design',
                        target: '_blank',
                    },
                ]}
            />
        </>
    );
}
