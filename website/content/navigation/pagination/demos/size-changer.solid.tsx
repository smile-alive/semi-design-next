import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showSizeChanger style={{ 'margin-block-end': '12px' }} />
            <Pagination total={300} showSizeChanger />
        </div>
    );
}
