import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Pagination of 80 items" total={80} showSizeChanger style={{ marginBlockEnd: 12 }} />
            <Pagination aria-label="Pagination of 300 items" total={300} showSizeChanger />
        </div>
    );
}
