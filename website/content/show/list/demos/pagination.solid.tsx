import { createSignal } from 'solid-js';
import { List, Pagination } from '@fibrae/semi-ui-solid';

const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数'];

const pageSize = 4;

const getData = (page: number) => data.slice((page - 1) * pageSize, page * pageSize);

export default function ListDemo() {
    const [page, setPage] = createSignal(1);

    return (
        <div>
            <div style={{ 'margin-right': '16px', width: '280px', display: 'flex', 'flex-wrap': 'wrap' }}>
                <List dataSource={getData(page())} split={false} size="small" class="component-list-demo-booklist" style={{ border: '1px solid var(--semi-color-border)', 'flex-basis': '100%', 'flex-shrink': '0' }} renderItem={(item) => <List.Item class="list-item">{item}</List.Item>} />
                <Pagination size="small" style={{ width: '100%', 'flex-basis': '100%', 'justify-content': 'center' }} pageSize={pageSize} total={data.length} currentPage={page()} onPageChange={(cPage) => setPage(cPage)} />
            </div>
        </div>
    );
}
