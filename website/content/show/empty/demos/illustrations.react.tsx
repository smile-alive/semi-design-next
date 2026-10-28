import {
    IllustrationConstruction,
    IllustrationSuccess,
    IllustrationFailure,
    IllustrationNoAccess,
    IllustrationNoContent,
    IllustrationNotFound,
    IllustrationNoResult,
    IllustrationIdle,
    IllustrationIdleDark,
    IllustrationConstructionDark,
    IllustrationSuccessDark,
    IllustrationFailureDark,
    IllustrationNoAccessDark,
    IllustrationNoContentDark,
    IllustrationNotFoundDark,
    IllustrationNoResultDark,
} from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';

export default function EmptyDemo() {
    const emptyStyle = {
        padding: 30,
    };
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Empty image={<IllustrationSuccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />} description="创建成功" style={emptyStyle} />
            <Empty image={<IllustrationFailure style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationFailureDark style={{ width: 150, height: 150 }} />} description="加载失败" style={emptyStyle} />
            <Empty image={<IllustrationNoAccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationNoAccessDark style={{ width: 150, height: 150 }} />} description="没有权限" style={emptyStyle} />
            <Empty image={<IllustrationNoContent style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 150, height: 150 }} />} description="暂无内容，请添加" style={emptyStyle} />
            <Empty image={<IllustrationNotFound style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationNotFoundDark style={{ width: 150, height: 150 }} />} description="页面404" style={emptyStyle} />
            <Empty image={<IllustrationNoResult style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationNoResultDark style={{ width: 150, height: 150 }} />} description="搜索无结果" style={emptyStyle} />
            <Empty image={<IllustrationConstruction style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationConstructionDark style={{ width: 150, height: 150 }} />} description="建设中" style={emptyStyle} />
            <Empty image={<IllustrationIdle style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationIdleDark style={{ width: 150, height: 150 }} />} description="神游四方" style={emptyStyle} />
        </div>
    );
}
