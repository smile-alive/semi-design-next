import { useState } from 'react';
import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    const [page, setPage] = useState(3);
    const onPageChange = (currentPage: number) => {
        setPage(currentPage);
    };
    return <Pagination total={200} currentPage={page} onPageChange={onPageChange} />;
}
