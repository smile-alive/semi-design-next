import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Pagination of 80 items" total={80} showTotal style={{ marginBlockEnd: 12 }} />
            <Pagination aria-label="Pagination of 200 items" total={200} showTotal style={{ marginBlockEnd: 12 }} />
        </div>
    );
}
