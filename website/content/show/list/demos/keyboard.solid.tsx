import { createSignal, onCleanup, onMount } from 'solid-js';
import { List } from '@fibrae/semi-ui-solid';

const list = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

export default function ListDemo() {
    const [hoverIndex, setHoverIndex] = createSignal(-1);

    const changeIndex = (offset: number) => {
        setHoverIndex((currentIndex) => {
            let index = currentIndex + offset;
            if (index < 0) {
                index = list.length - 1;
            }
            if (index >= list.length) {
                index = 0;
            }
            return index;
        });
    };

    const keydownHandler = (event: KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                changeIndex(-1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                changeIndex(1);
                break;
            default:
                break;
        }
    };

    onMount(() => {
        window.addEventListener('keydown', keydownHandler);
        onCleanup(() => window.removeEventListener('keydown', keydownHandler));
    });

    return (
        <div>
            <div style={{ 'margin-right': '16px', width: '280px', display: 'flex', 'flex-wrap': 'wrap', border: '1px solid var(--semi-color-border)' }}>
                <List
                    class="component-list-demo-booklist"
                    dataSource={list}
                    split={false}
                    size="small"
                    style={{ 'flex-basis': '100%', 'flex-shrink': '0', 'border-bottom': '1px solid var(--semi-color-border)' }}
                    renderItem={(item, index) => <List.Item class={index === hoverIndex() ? 'component-list-demo-booklist-active-item' : ''}>{item}</List.Item>}
                />
            </div>
        </div>
    );
}
