import { Anchor } from '@fibrae/semi-ui-react';

export default function AnchorDemo() {
    const sections = ['section-a', 'section-b', 'section-c'];
    return (
        <div style={{ display: 'flex', gap: 24 }}>
            <Anchor getContainer={() => document.getElementById('scroll-box')} scrollMotion scrollIntoViewOptions={{ block: 'center' }} style={{ width: 160 }}>
                {sections.map((id, index) => (
                    <Anchor.Link key={id} href={`#${id}`} title={`章节 ${index + 1}`} />
                ))}
            </Anchor>
            {/* 可聚焦，键盘也能滚动这个容器 */}
            <section id="scroll-box" aria-label="章节" tabIndex={0} style={{ height: 240, width: 320, overflow: 'auto', border: '1px solid #ddd' }}>
                {sections.map((id, index) => (
                    <div key={id} id={id} style={{ height: 200, padding: 8 }}>
                        点击链接后，章节 {index + 1} 会滚动到容器中间
                    </div>
                ))}
            </section>
        </div>
    );
}
