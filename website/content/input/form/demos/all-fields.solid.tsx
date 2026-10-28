import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Col, Form, FormCascader, FormCheckbox, FormCheckboxGroup, FormDatePicker, FormInput, FormInputNumber, FormRadio, FormRadioGroup, FormRating, FormSelect, FormSlider, FormSwitch, FormTagInput, FormTextArea, FormTimePicker, FormTreeSelect, FormUpload, Row, Space } from '@fibrae/semi-ui-solid';

const today = new Date(2024, 4, 6, 12);

const initValues = {
    name: 'semi',
    business: ['ulikeCam'],
    role: 'ued',
    switch: true,
    files: [
        {
            uid: '1',
            name: 'vigo.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-d.svg',
        },
        {
            uid: '2',
            name: 'resso.jpeg',
            status: 'validateFail',
            size: '222KB',
            percent: 50,
            preview: true,
            fileInstance: new File([new ArrayBuffer(2048)], 'resso.jpeg', { type: 'image/jpeg' }),
            url: '/assets/placeholder/avatar-b.svg',
        },
        {
            uid: '3',
            name: 'douyin.jpeg',
            status: 'uploading',
            size: '222KB',
            percent: 50,
            preview: true,
            fileInstance: new File([new ArrayBuffer(2048)], 'dy.jpeg', { type: 'image/jpeg' }),
            url: '/assets/placeholder/avatar-a.svg',
        },
    ],
};

const treeData = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                children: [
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: '0-0-0',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

const style = { width: '90%' };

export default function FormDemo() {
    return (
        <Form initValues={initValues} style={{ padding: '10px', width: '100%' }} onValueChange={(v) => console.log(v)}>
            <Form.Section text="基本信息">
                <Row>
                    <Col span={12}>
                        <FormInput field="name" label="名称（Input）" initValue="mikeya" style={style} trigger="blur" />
                    </Col>
                    <Col span={12}>
                        <FormDatePicker field="date" label="日期（DatePicker）" style={style} initValue={today} placeholder="请选择生效日期" />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <FormSelect field="role" style={style} label="角色（Select）" placeholder="请选择你的角色">
                            <FormSelect.Option value="operate">运营</FormSelect.Option>
                            <FormSelect.Option value="rd">开发</FormSelect.Option>
                            <FormSelect.Option value="pm">产品</FormSelect.Option>
                            <FormSelect.Option value="ued">设计</FormSelect.Option>
                        </FormSelect>
                    </Col>
                    <Col span={12}>
                        <FormSelect field="business" multiple style={style} placeholder="请选择业务线" label="业务线（多选Select）" extraText={<div style={{ color: 'var(--semi-blue-5)', 'font-size': '14px', 'user-select': 'none', cursor: 'pointer' }}>没有找到合适的业务线？</div>}>
                            <FormSelect.Option value="abc">Semi</FormSelect.Option>
                            <FormSelect.Option value="ulikeCam">轻颜相机</FormSelect.Option>
                            <FormSelect.Option value="toutiao">今日头条</FormSelect.Option>
                        </FormSelect>
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <FormCascader placeholder="请选择所在地区" treeData={treeData} field="area" label="地区（Cascader）" style={style} />
                    </Col>
                    <Col span={12}>
                        <FormTreeSelect field="tree" style={style} label="节点（TreeSelect）" placeholder="请选择服务节点" treeData={treeData} filterTreeNode />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <FormTagInput field="product" label="产品（TagInput）" initValue={['abc', 'ulikeCam']} placeholder="请输入产品" style={style} />
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <FormUpload field="files" label="证明文件（Upload）" action="//semi.design/api/upload">
                            <Button icon={<IconUpload />} theme="light">
                                点击上传
                            </Button>
                        </FormUpload>
                    </Col>
                </Row>
            </Form.Section>
            <Form.Section text="资源详情">
                <Row>
                    <Col span={12}>
                        <FormTextArea style={{ ...style, height: '120px' }} field="description" label="申请理由（TextArea）" placeholder="请填写申请资源理由" />
                    </Col>
                    <Col span={12}>
                        <FormCheckboxGroup field="type" direction="horizontal" label="申请类型（CheckboxGroup）" initValue={['user', 'admin']} rules={[{ required: true }]}>
                            <FormCheckbox value="admin">admin</FormCheckbox>
                            <FormCheckbox value="user">user</FormCheckbox>
                            <FormCheckbox value="guest">guest</FormCheckbox>
                            <FormCheckbox value="root">root</FormCheckbox>
                        </FormCheckboxGroup>
                        <FormRadioGroup field="isMonopolize" label="是否独占资源（Radio）" rules={[{ type: 'boolean' }, { required: true, message: '必须选择是否独占 ' }]}>
                            <FormRadio value={1}>是</FormRadio>
                            <FormRadio value={0}>否</FormRadio>
                        </FormRadioGroup>
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <FormTimePicker field="time" label="截止时刻（TimePicker）" style={{ width: '90%' }} />
                    </Col>
                    <Col span={12}>
                        <FormInputNumber field="number" label="申请数量（InputNumber）" initValue={20} style={style} />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <FormSlider field="range" label="资源使用报警阈值(%)（Slider）" initValue={10} style={{ width: '90%' }} />
                    </Col>
                    <Col span={12}>
                        <FormSwitch field="switch" label="开关(Switch)" />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <FormRating field="rating" label="满意度(Rating)" initValue={2} style={{ width: '90%' }} />
                    </Col>
                </Row>
            </Form.Section>
            <FormCheckbox value="false" field="agree" noLabel>
                我已阅读并清楚相关规定（Checkbox）
            </FormCheckbox>
            <Space>
                <Button type="primary" htmlType="submit" class="btn-margin-right">
                    提交(submit)
                </Button>
                <Button htmlType="reset">重置(reset)</Button>
            </Space>
        </Form>
    );
}
