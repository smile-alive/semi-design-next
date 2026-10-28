import { type JSX, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { type ColProps, Col, Row } from '../grid';

const prefix = cssClasses.PREFIX;

interface FieldGridProps {
    label?: JSX.Element;
    /** The main content: the control, its messages and extra text */
    children?: JSX.Element;
    mainClass?: string;
    labelAlign?: string;
    labelCol?: ColProps;
    wrapperCol?: ColProps;
    labelPosition?: string;
    /** Wraps the columns in their own Row, for a field whose columns the Form does not set */
    row?: boolean;
}

/**
 * The label and main content of a field, Form.Slot or Form.InputGroup, in columns when both cols are set. Each layout
 * reads `label` and `children` itself, so switching layouts mounts the content again, as the changed tree does in React.
 */
export default function FieldGrid(props: FieldGridProps) {
    const labelColumn = () => (
        <Col {...props.labelCol} class={clsx(props.labelCol?.class, { [`${prefix}-col-${props.labelAlign}`]: props.labelAlign })}>
            {props.label}
        </Col>
    );

    const columns = () => (
        <>
            {/* without overflow hidden a top label lays out horizontally */}
            <Show when={props.labelPosition === 'top'} fallback={labelColumn()}>
                <div style={{ overflow: 'hidden' }}>{labelColumn()}</div>
            </Show>
            <Col {...props.wrapperCol}>
                <div class={props.mainClass}>{props.children}</div>
            </Col>
        </>
    );

    return (
        <Show
            when={props.labelCol && props.wrapperCol}
            fallback={
                <>
                    {props.label}
                    <div class={props.mainClass}>{props.children}</div>
                </>
            }
        >
            <Show when={props.row} fallback={columns()}>
                <Row>{columns()}</Row>
            </Show>
        </Show>
    );
}
