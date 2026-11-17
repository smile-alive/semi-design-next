import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Pagination of 30 items" total={30} style={{ 'margin-block-end': '12px' }} />
            <Pagination aria-label="Pagination of 80 items" total={80} style={{ 'margin-block-end': '12px' }} />
            <Pagination aria-label="Pagination of 200 items" total={200} style={{ 'margin-block-end': '12px' }} />
            <Pagination aria-label="Pagination of 80 items, 30 per page" total={80} pageSize={30} style={{ 'margin-block-end': '12px' }} />
        </div>
    );
}
