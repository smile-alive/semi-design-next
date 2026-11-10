import { strings } from '@fibrae/semi-foundation/components/table/constants';
import Column from './column';
import Table from './table';

export default Object.assign(Table, {
    Column,
    DEFAULT_KEY_COLUMN_SELECTION: strings.DEFAULT_KEY_COLUMN_SELECTION,
    DEFAULT_KEY_COLUMN_EXPAND: strings.DEFAULT_KEY_COLUMN_EXPAND,
});
export type * from './table';
