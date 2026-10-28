import { createSignal } from 'solid-js';
import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    const [page, setPage] = createSignal(3);

    return <Pagination total={200} currentPage={page()} onPageChange={(currentPage) => setPage(currentPage)} />;
}
