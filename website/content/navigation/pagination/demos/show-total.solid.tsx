import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Pagination of 80 items" total={80} showTotal style={{ 'margin-block-end': '12px' }} />
            <Pagination aria-label="Pagination of 200 items" total={200} showTotal style={{ 'margin-block-end': '12px' }} />
        </div>
    );
}
