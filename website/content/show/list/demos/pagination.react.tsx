import { useState } from 'react';
import { List, Pagination } from '@fibrae/semi-ui-react';

export default function ListDemo() {
    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数'];

    const [page, onPageChange] = useState(1);

    let pageSize = 4;

    const getData = (page: number) => {
        let start = (page - 1) * pageSize;
        let end = page * pageSize;
        return data.slice(start, end);
    };

    return (
        <div>
            <div style={{ marginRight: 16, width: 280, display: 'flex', flexWrap: 'wrap' }}>
                <List dataSource={getData(page)} split={false} size="small" className="component-list-demo-booklist" style={{ border: '1px solid var(--semi-color-border)', flexBasis: '100%', flexShrink: 0 }} renderItem={(item) => <List.Item className="list-item">{item}</List.Item>} />
                <Pagination size="small" style={{ width: '100%', flexBasis: '100%', justifyContent: 'center' }} pageSize={pageSize} total={data.length} currentPage={page} onChange={(cPage) => onPageChange(cPage)} />
            </div>
        </div>
    );
}
