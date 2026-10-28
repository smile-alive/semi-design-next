import { Banner, Typography } from '@fibrae/semi-ui-react';

export default function BannerDemo() {
    const { Text } = Typography;

    return (
        <div style={{ width: 640 }} className="components-banner-demo">
            <Banner
                fullMode={false}
                type="info"
                bordered
                icon={null}
                closeIcon={null}
                title={<div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px' }}>不知道 AppKey？</div>}
                description={
                    <div>
                        你可先联系对应的研发同学，确认是否已在 <Text link={{ href: 'https://semi.design/' }}>应用云平台</Text> 申请了应用，并填写对应的信息。
                    </div>
                }
            />
            <br />
            <Banner
                fullMode={false}
                type="warning"
                bordered
                icon={null}
                closeIcon={null}
                title={<div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px' }}>不知道 AppKey？</div>}
                description={
                    <div>
                        你可先联系对应的研发同学，确认是否已在 <Text link={{ href: 'https://semi.design/' }}>应用云平台</Text> 申请了应用，并填写对应的信息。
                    </div>
                }
            />
            <br />
            <Banner
                fullMode={false}
                type="danger"
                bordered
                icon={null}
                closeIcon={null}
                title={<div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px' }}>不知道 AppKey？</div>}
                description={
                    <div>
                        你可先联系对应的研发同学，确认是否已在 <Text link={{ href: 'https://semi.design/' }}>应用云平台</Text> 申请了应用，并填写对应的信息。
                    </div>
                }
            />
            <br />
            <Banner
                fullMode={false}
                type="success"
                bordered
                icon={null}
                closeIcon={null}
                title={<div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px' }}>不知道 AppKey？</div>}
                description={
                    <div>
                        你可先联系对应的研发同学，确认是否已在 <Text link={{ href: 'https://semi.design/' }}>应用云平台</Text> 申请了应用，并填写对应的信息。
                    </div>
                }
            />
        </div>
    );
}
