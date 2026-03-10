# 纷享销客自动化测试系统 ER 图

**系统名称**: 纷享销客自动化测试平台  
**文档版本**: v1.0  
**创建日期**: 2025-11-14  
**说明**: 本 ER 图基于 Eolink 自动化测试接口文档绘制，采用 Crow's Foot 符号规范，适用于论文引用。

---

## 实体关系图（Entity-Relationship Diagram）

```mermaid
erDiagram
    企业 {
        int     enterpriseId        PK "企业ID"
        string  enterpriseAccount   "企业账号"
        string  enterpriseName      "企业名称"
        string  domain              "主域名"
        string  imgDomain           "图片域名"
        string  fileDomain          "文件域名"
    }

    员工 {
        int     employeeId              PK "员工ID"
        int     enterpriseId            FK "所属企业ID"
        string  userAccount             "用户账号(手机号)"
        string  mobile                  "手机号"
        string  internationalAreaCode   "国际区号"
        string  rsaPublicKey            "RSA公钥"
    }

    设备 {
        string  deviceId        PK "设备唯一标识"
        int     employeeId      FK "归属员工ID"
        string  userAgent       "客户端User-Agent"
        string  ipAddress       "登录IP地址"
    }

    登录令牌 {
        string  tokenId             PK "令牌ID(UUID)"
        int     employeeId          FK "申请员工ID"
        int     enterpriseId        FK "所属企业ID"
        string  tokenValue          "令牌值"
        string  traceId             "追踪ID"
        boolean isUsed              "是否已使用"
        datetime createdAt          "创建时间"
        datetime expiredAt          "过期时间"
    }

    会话 {
        string  sessionId       PK "会话ID"
        int     employeeId      FK "归属员工ID"
        int     enterpriseId    FK "所属企业ID"
        string  fsAuthX         "认证令牌FSAuthX"
        string  fsAuthXC        "认证令牌FSAuthXC"
        string  jsessionId      "Java会话ID"
        string  fsToken         "页面令牌fs_token"
        datetime createdAt      "创建时间"
        datetime expiredAt      "过期时间"
    }

    测试环境 {
        int     envId               PK "环境ID"
        string  envName             "环境名称"
        string  baseUrl             "基础URL"
        string  enterpriseAccount   "企业账号"
        int     employeeId          FK "关联员工ID"
        int     enterpriseId        FK "关联企业ID"
    }

    接口模块 {
        int     moduleId        PK "模块ID"
        string  moduleName      "模块名称"
        string  moduleType      "模块类型(eservice/crm/consult)"
        string  baseEndpoint    "基础端点"
    }

    接口请求 {
        int     requestId   PK "请求ID"
        int     moduleId    FK "所属模块ID"
        int     envId       FK "所属环境ID"
        string  apiName     "接口名称"
        string  url         "请求URL"
        string  method      "请求方法(GET/POST)"
        string  headers     "请求头(JSON)"
        string  body        "请求体(JSON)"
        int     timelimit   "超时时间(ms)"
        string  traceId     "追踪ID"
    }

    脚本 {
        int     scriptId    PK "脚本ID"
        int     requestId   FK "所属接口ID"
        string  scriptType  "脚本类型(pre/post)"
        string  content     "脚本内容(JavaScript)"
        string  description "脚本说明"
    }

    测试用例 {
        int     caseId          PK "用例ID"
        int     requestId       FK "关联接口ID"
        int     envId           FK "所属环境ID"
        string  caseName        "用例名称"
        string  description     "用例描述"
        int     expectedStatus  "预期HTTP状态码"
        string  status          "执行状态(pass/fail/skip)"
    }

    测试断言 {
        int     assertionId     PK "断言ID"
        int     caseId          FK "所属用例ID"
        string  assertionName   "断言名称"
        string  assertionType   "断言类型(equal/contain/type)"
        string  targetPath      "断言路径(JSONPath)"
        string  expectedValue   "期望值"
        boolean result          "断言结果"
    }

    响应记录 {
        int     responseId      PK "响应ID"
        int     requestId       FK "关联接口ID"
        int     sessionId       FK "关联会话ID"
        int     httpStatus      "HTTP状态码"
        string  body            "响应体"
        string  headers         "响应头"
        int     responseTime    "响应时间(ms)"
        datetime executedAt     "执行时间"
    }

    企业   ||--o{  员工         : "拥有"
    企业   ||--o{  登录令牌     : "归属"
    企业   ||--o{  会话         : "归属"
    企业   ||--o{  测试环境     : "关联"
    员工   ||--o{  设备         : "使用"
    员工   ||--o{  登录令牌     : "申请"
    员工   ||--o{  会话         : "持有"
    登录令牌 }o--|| 会话        : "兑换"
    测试环境 ||--o{ 接口请求    : "包含"
    接口模块 ||--o{ 接口请求    : "归属"
    接口请求 ||--o{ 脚本        : "附带"
    接口请求 ||--o{ 测试用例    : "对应"
    接口请求 ||--o{ 响应记录    : "产生"
    测试用例 ||--o{ 测试断言    : "包含"
    会话     ||--o{ 响应记录    : "发起"
```

---

## 实体说明

### 核心业务实体

| 实体名称 | 说明 |
|---------|------|
| 企业 | 纷享销客租户企业，是系统的顶级组织单元 |
| 员工 | 企业内的用户账号，通过手机号标识 |
| 设备 | 员工登录时使用的客户端设备信息 |
| 登录令牌 | 两步登录流程中的临时凭证（LoginToken），由接口1生成、接口2消费 |
| 会话 | 登录成功后的持久化会话，携带 Cookie 信息供后续接口使用 |

### 测试管理实体

| 实体名称 | 说明 |
|---------|------|
| 测试环境 | Eolink 中配置的环境变量集合（开发/测试/生产） |
| 接口模块 | 接口的分组，包括服务通(eservice)、CRM 对象接口、线上客服(consult)等 |
| 接口请求 | 单个 API 接口定义，包含 URL、请求方法、请求体等信息 |
| 脚本 | 挂载在接口上的前置/后置 JavaScript 脚本 |
| 测试用例 | 针对接口的完整测试场景，含预期状态码 |
| 测试断言 | 测试用例中的具体断言条件，验证响应数据的正确性 |
| 响应记录 | 接口执行后的实际响应数据及执行时间 |

---

## 关键业务流程（登录流程）

```
员工 ──发起──▶ 设备验证
                  │
                  ▼
          接口1：获取登录令牌
          (EnterpriseAccountCloudLogin)
                  │
                  ▼
            登录令牌(临时)
                  │
                  ▼
          接口2：令牌换会话
          (LoginByToken)
                  │
                  ▼
           会话(Cookie持久化)
                  │
                  ▼
          业务接口调用（携带Cookie）
```

---

## 注意事项

1. **登录令牌（LoginToken）** 为一次性临时凭证，使用后即失效，关系为 `1:1` 兑换一个会话。
2. **会话（Session）** 中的 `FSAuthX`、`FSAuthXC`、`JSESSIONID`、`fs_token` 四个 Cookie 字段为后续所有业务接口调用的必要认证信息。
3. **员工** 与 **企业** 之间为多对一关系，一个企业账号下可有多名员工。
4. **接口模块** 按业务功能划分，包括服务通（`/eservice`）、CRM 对象（`/API/v1/object`）、线上客服（`/online/consult`）三大模块。
