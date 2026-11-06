import { Fragment } from 'react';
import { Banner, Typography } from '@fibrae/semi-ui-react';

const types = ['info', 'warning', 'danger', 'success'] as const;

export default function BannerDemo() {
    return (
        <div style={{ width: 640 }} className="components-banner-demo">
            {types.map((type, index) => (
                <Fragment key={type}>
                    {index > 0 && <br />}
                    <Banner
                        fullMode={false}
                        type={type}
                        bordered
                        icon={null}
                        closeIcon={null}
                        title={<div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px' }}>不知道 AppKey？</div>}
                        description={
                            <div>
                                你可先联系对应的研发同学，确认是否已在 <Typography.Text link={{ href: 'https://semi.design/' }}>应用云平台</Typography.Text> 申请了应用，并填写对应的信息。
                            </div>
                        }
                    />
                </Fragment>
            ))}
        </div>
    );
}
