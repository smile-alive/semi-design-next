import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={30} style={{ marginBottom: 12 }} />
            <Pagination total={80} style={{ marginBottom: 12 }} />
            <Pagination total={200} style={{ marginBottom: 12 }} />
            <Pagination total={80} pageSize={30} style={{ marginBottom: 12 }} />
        </div>
    );
}
