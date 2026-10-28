import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
// the sidebar styles load with Container; the content is mounted here without it
import '@fibrae/semi-ai-foundation/sidebar/sidebar.scss';
import MCPConfigureContent from '../mcp-configure/content';

const options = [
    { label: 'GitHub', value: 'github', desc: 'Code hosting', active: true },
    { label: 'Figma', value: 'figma', desc: 'Design tool' },
];

describe('MCPConfigureContent', () => {
    it('容器窄于整行时激活数量文字保持单行原宽，不按字换行', () => {
        const { container } = render(() => (
            <>
                <div style={{ width: '600px' }}>
                    <MCPConfigureContent options={options} />
                </div>
                <div style={{ width: '260px' }}>
                    <MCPConfigureContent options={options} />
                </div>
            </>
        ));
        const sizes = [...container.querySelectorAll('.semi-sidebar-mcp-configure-content-header-count')].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(sizes).toHaveLength(2);
        expect(sizes[1]).toEqual(sizes[0]);
    });
});
