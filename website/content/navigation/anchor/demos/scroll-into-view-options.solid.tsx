import { For } from 'solid-js';
import { Anchor } from '@fibrae/semi-ui-solid';

const sections = ['section-a', 'section-b', 'section-c'];

export default function AnchorDemo() {
    return (
        <div style={{ display: 'flex', gap: '24px' }}>
            <Anchor getContainer={() => document.getElementById('scroll-box')} scrollMotion scrollIntoViewOptions={{ block: 'center' }} style={{ width: '160px' }}>
                <For each={sections}>{(id, index) => <Anchor.Link href={`#${id}`} title={`章节 ${index() + 1}`} />}</For>
            </Anchor>
            {/* 可聚焦，键盘也能滚动这个容器 */}
            <section id="scroll-box" aria-label="章节" tabIndex={0} style={{ height: '240px', width: '320px', overflow: 'auto', border: '1px solid #ddd' }}>
                <For each={sections}>
                    {(id, index) => (
                        <div id={id} style={{ height: '200px', padding: '8px' }}>
                            点击链接后，章节 {index() + 1} 会滚动到容器中间
                        </div>
                    )}
                </For>
            </section>
        </div>
    );
}
