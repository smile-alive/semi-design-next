import { IconAIEditLevel1 } from '@fibrae/semi-icons-solid';
import { FloatButton } from '@fibrae/semi-ui-solid';

export default function FloatButtonDemo() {
    return (
        <>
            <span>带徽章：页面右下第二列</span>
            <FloatButton disabled aria-label="AI 编辑" icon={<IconAIEditLevel1 />} badge={{ dot: true, type: 'danger' }} style={{ bottom: '270px', 'inset-inline-end': '100px' }} />
            <FloatButton badge={{ count: 1000, overflowCount: 999 }} size="large" aria-label="AI 编辑，999+" icon={<IconAIEditLevel1 />} style={{ bottom: '210px', 'inset-inline-end': '100px' }} />
            <FloatButton aria-label="AI 编辑" icon={<IconAIEditLevel1 />} badge={{ dot: true }} colorful style={{ bottom: '170px', 'inset-inline-end': '100px' }} />
            <FloatButton aria-label="AI 编辑，VIP" icon={<IconAIEditLevel1 />} colorful size="large" badge={{ count: 'VIP', type: 'danger' }} style={{ bottom: '110px', 'inset-inline-end': '100px' }} />
        </>
    );
}
