import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Pagination of 80 items" total={80} showQuickJumper style={{ 'margin-block-end': '12px' }} />
            <Pagination aria-label="Pagination of 300 items" total={300} showQuickJumper />
        </div>
    );
}
