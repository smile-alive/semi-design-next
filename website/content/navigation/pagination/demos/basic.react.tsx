import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Pagination of 30 items" total={30} style={{ marginBlockEnd: 12 }} />
            <Pagination aria-label="Pagination of 80 items" total={80} style={{ marginBlockEnd: 12 }} />
            <Pagination aria-label="Pagination of 200 items" total={200} style={{ marginBlockEnd: 12 }} />
            <Pagination aria-label="Pagination of 80 items, 30 per page" total={80} pageSize={30} style={{ marginBlockEnd: 12 }} />
        </div>
    );
}
