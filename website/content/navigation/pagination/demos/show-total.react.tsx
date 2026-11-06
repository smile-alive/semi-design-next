import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showTotal style={{ marginBlockEnd: 12 }} />
            <Pagination total={200} showTotal style={{ marginBlockEnd: 12 }} />
        </div>
    );
}
