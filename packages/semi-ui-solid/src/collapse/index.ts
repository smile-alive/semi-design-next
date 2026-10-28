import Collapse from './collapse';
import CollapsePanel from './panel';

export default Object.assign(Collapse, { Panel: CollapsePanel });
export type { CollapseProps, CollapseState } from './collapse';
export type { CollapsePanelProps } from './panel';
