import { IconAIEditLevel1 } from '@fibrae/semi-icons-react';
import { FloatButton } from '@fibrae/semi-ui-react';

export default function FloatButtonDemo() {
    return (
        <>
            <span>带徽章：页面右下第二列</span>
            <FloatButton disabled aria-label="AI 编辑" icon={<IconAIEditLevel1 />} badge={{ dot: true, type: 'danger' }} style={{ insetBlockEnd: 270, insetInlineEnd: 100 }} />
            <FloatButton badge={{ count: 1000, overflowCount: 999 }} size="large" aria-label="AI 编辑，999+" icon={<IconAIEditLevel1 />} style={{ insetBlockEnd: 210, insetInlineEnd: 100 }} />
            <FloatButton aria-label="AI 编辑" icon={<IconAIEditLevel1 />} badge={{ dot: true }} colorful style={{ insetBlockEnd: 170, insetInlineEnd: 100 }} />
            <FloatButton aria-label="AI 编辑，VIP" icon={<IconAIEditLevel1 />} colorful size="large" badge={{ count: 'VIP', type: 'danger' }} style={{ insetBlockEnd: 110, insetInlineEnd: 100 }} />
        </>
    );
}
