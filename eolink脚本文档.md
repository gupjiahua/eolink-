# Eolink 自动化测试脚本编写指南

**文档版本**: v1.0  
**创建日期**: 2025-11-14  
**创建者**: @gupjiahua  
**最后更新**: 2025-11-14

---

## 目录
- [1. Eolink 脚本基础](#1-eolink-脚本基础)
- [2. 前置脚本（Pre-request Script）](#2-前置脚本pre-request-script)
- [3. 后置脚本（After-request Script）](#3-后置脚本after-request-script)
- [4. 环境变量与全局变量](#4-环境变量与全局变量)
- [5. 常用脚本示例](#5-常用脚本示例)
- [6. 测试断言](#6-测试断言)
- [7. 最佳实践](#7-最佳实践)

---

## 1. Eolink 脚本基础

### 1.1 脚本执行顺序
```
1. 前置脚本（Pre-request Script）
2. 发送 API 请求
3. 接收响应
4. 后置脚本（After-request Script）
5. 执行测试断言
```

### 1.2 支持的编程语言
- **JavaScript (推荐)**
- Eolink 提供的内置对象和方法

### 1.3 内置对象

| 对象 | 说明 |
|------|------|
| `eo` | Eolink 核心对象 |
| `eo.env` | 环境变量操作 |
| `eo.global` | 全局变量操作 |
| `eo.request` | 请求对象 |
| `eo.response` | 响应对象 |
| `console` | 控制台输出 |

---

## 2. 前置脚本（Pre-request Script）

前置脚本在 API 请求发送**之前**执行，常用于：
- 设置动态参数
- 生成时间戳、签名
- 设置认证信息

### 2.1 基础示例

```javascript
// 设置当前时间戳
eo.env.set("timestamp", Date.now());

// 生成随机字符串
eo.env.set("random", Math.random().toString(36).substring(7));

// 设置请求头
eo.request.headers["Authorization"] = "Bearer " + eo.env.get("access_token");

// 打印调试信息
console.log("请求准备就绪，时间戳：" + eo.env.get("timestamp"));
```

### 2.2 生成签名示例

```javascript
// MD5 签名示例
var timestamp = Date.now();
var appKey = eo.env.get("app_key");
var appSecret = eo.env.get("app_secret");

// 构造签名字符串
var signStr = appKey + timestamp + appSecret;

// 生成 MD5（需要使用 Eolink 提供的 crypto 库）
var sign = CryptoJS.MD5(signStr).toString();

// 设置到环境变量
eo.env.set("timestamp", timestamp);
eo.env.set("sign", sign);

console.log("签名生成成功: " + sign);
```

### 2.3 动态请求体构造

```javascript
// 构造动态 JSON 请求体
var requestBody = {
    "user_id": eo.env.get("user_id"),
    "timestamp": Date.now(),
    "action": "query",
    "data": {
        "page": 1,
        "size": 10
    }
};

// 设置请求体
eo.request.body = JSON.stringify(requestBody);
console.log("请求体: " + eo.request.body);
```

---

## 3. 后置脚本（After-request Script）

后置脚本在 API 响应**接收之后**执行，常用于：
- 提取响应数据
- 保存变量供后续使用
- 数据转换和处理

### 3.1 基础示例

```javascript
// 解析响应
var response = JSON.parse(eo.response.body);

// 提取并保存 token
if (response.code === 200) {
    eo.env.set("access_token", response.data.token);
    console.log("Token 保存成功");
} else {
    console.error("请求失败: " + response.message);
}

// 打印响应信息
console.log("状态码: " + eo.response.status);
console.log("响应时间: " + eo.response.responseTime + "ms");
```

### 3.2 提取列表数据

```javascript
var response = JSON.parse(eo.response.body);

if (response.data && response.data.list) {
    // 提取第一条数据的 ID
    var firstId = response.data.list[0].id;
    eo.env.set("first_item_id", firstId);
    
    // 保存总数
    eo.env.set("total_count", response.data.total);
    
    console.log("提取数据成功，ID: " + firstId);
}
```

### 3.3 数据校验与错误处理

```javascript
try {
    var response = JSON.parse(eo.response.body);
    
    // 检查必要字段
    if (!response.data || !response.data.user_id) {
        throw new Error("响应缺少必要字段 user_id");
    }
    
    // 保存用户信息
    eo.global.set("current_user_id", response.data.user_id);
    eo.global.set("current_username", response.data.username);
    
    console.log("用户信息保存成功");
    
} catch (e) {
    console.error("处理响应失败: " + e.message);
    throw e;
}
```

---

## 4. 环境变量与全局变量

### 4.1 环境变量（Environment Variables）

**作用域**: 当前选择的环境（开发/测试/生产等）

```javascript
// 设置环境变量
eo.env.set("variable_name", "value");

// 获取环境变量
var value = eo.env.get("variable_name");

// 删除环境变量
eo.env.unset("variable_name");

// 获取所有环境变量
var allVars = eo.env.getAll();
console.log(JSON.stringify(allVars));
```

### 4.2 全局变量（Global Variables）

**作用域**: 跨所有环境共享

```javascript
// 设置全局变量
eo.global.set("global_variable", "value");

// 获取全局变量
var value = eo.global.get("global_variable");

// 删除全局变量
eo.global.unset("global_variable");
```

### 4.3 变量使用优先级

```
请求参数引用优先级：
1. 环境变量
2. 全局变量
3. 默认值
```

---

## 5. 常用脚本示例

### 5.1 登录并保存 Token

**前置脚本**:
```javascript
// 设置登录信息
eo.env.set("username", "test_user");
eo.env.set("password", "test_password");
```

**后置脚本**:
```javascript
var response = JSON.parse(eo.response.body);

if (response.code === 200 && response.data.token) {
    // 保存 token 到环境变量
    eo.env.set("access_token", response.data.token);
    eo.env.set("refresh_token", response.data.refresh_token);
    
    // 保存用户信息
    eo.env.set("user_id", response.data.user_id);
    
    console.log("登录成功，Token: " + response.data.token);
} else {
    console.error("登录失败: " + response.message);
}
```

### 5.2 分页查询数据

**前置脚本**:
```javascript
// 初始化分页参数
var currentPage = eo.env.get("current_page") || 1;
eo.env.set("current_page", currentPage);
eo.env.set("page_size", 20);

console.log("查询第 " + currentPage + " 页");
```

**后置脚本**:
```javascript
var response = JSON.parse(eo.response.body);

if (response.data) {
    // 保存数据
    eo.env.set("total_pages", response.data.total_pages);
    eo.env.set("total_count", response.data.total);
    
    // 自动翻页
    var currentPage = parseInt(eo.env.get("current_page"));
    var totalPages = response.data.total_pages;
    
    if (currentPage < totalPages) {
        eo.env.set("current_page", currentPage + 1);
        console.log("准备查询下一页");
    } else {
        console.log("所有数据查询完成");
    }
}
```

### 5.3 文件上传

**前置脚本**:
```javascript
// 设置文件上传相关头部
eo.request.headers["Content-Type"] = "multipart/form-data";

// 生成唯一文件名
var timestamp = Date.now();
var fileName = "upload_" + timestamp + ".jpg";
eo.env.set("upload_filename", fileName);

console.log("准备上传文件: " + fileName);
```

**后置脚本**:
```javascript
var response = JSON.parse(eo.response.body);

if (response.code === 200 && response.data.file_url) {
    // 保存文件 URL
    eo.env.set("uploaded_file_url", response.data.file_url);
    eo.env.set("file_id", response.data.file_id);
    
    console.log("文件上传成功: " + response.data.file_url);
}
```

### 5.4 数据关联（创建 -> 查询 -> 更新 -> 删除）

**创建接口后置脚本**:
```javascript
var response = JSON.parse(eo.response.body);

if (response.code === 200) {
    // 保存创建的资源 ID，供后续接口使用
    eo.env.set("created_resource_id", response.data.id);
    console.log("资源创建成功，ID: " + response.data.id);
}
```

**查询接口前置脚本**:
```javascript
// 使用创建接口返回的 ID
var resourceId = eo.env.get("created_resource_id");
eo.env.set("query_id", resourceId);
console.log("准备查询资源 ID: " + resourceId);
```

### 5.5 批量请求

```javascript
// 前置脚本：准备批量 ID
var ids = ["1001", "1002", "1003", "1004", "1005"];
eo.env.set("batch_ids", JSON.stringify(ids));

// 设置当前批次
var currentBatch = eo.env.get("current_batch") || 0;
eo.env.set("current_id", ids[currentBatch]);
console.log("处理第 " + (currentBatch + 1) + " 个 ID: " + ids[currentBatch]);

// 后置脚本：自动处理下一个
var ids = JSON.parse(eo.env.get("batch_ids"));
var currentBatch = parseInt(eo.env.get("current_batch") || 0);

if (currentBatch < ids.length - 1) {
    eo.env.set("current_batch", currentBatch + 1);
    console.log("准备处理下一个 ID");
} else {
    console.log("所有 ID 处理完成");
}
```

---

## 6. 测试断言

### 6.1 基础断言

```javascript
// 断言状态码
eo.test("状态码为 200", function() {
    eo.expect(eo.response.status).to.equal(200);
});

// 断言响应时间
eo.test("响应时间小于 500ms", function() {
    eo.expect(eo.response.responseTime).to.be.below(500);
});

// 断言响应体包含特定字段
eo.test("响应包含 code 字段", function() {
    var response = JSON.parse(eo.response.body);
    eo.expect(response).to.have.property("code");
});
```

### 6.2 高级断言

```javascript
var response = JSON.parse(eo.response.body);

// 断言业务状态码
eo.test("业务状态码为成功", function() {
    eo.expect(response.code).to.equal(200);
});

// 断言数据类型
eo.test("data 字段是对象", function() {
    eo.expect(response.data).to.be.an("object");
});

// 断言数组长度
eo.test("列表至少包含 1 条数据", function() {
    eo.expect(response.data.list).to.have.lengthOf.at.least(1);
});

// 断言数值范围
eo.test("用户年龄在合理范围", function() {
    eo.expect(response.data.age).to.be.within(0, 150);
});

// 断言字符串匹配
eo.test("邮箱格式正确", function() {
    eo.expect(response.data.email).to.match(/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/);
});
```

### 6.3 条件断言

```javascript
var response = JSON.parse(eo.response.body);

if (response.code === 200) {
    eo.test("成功响应包含 data", function() {
        eo.expect(response).to.have.property("data");
        eo.expect(response.data).to.not.be.null;
    });
} else {
    eo.test("失败响应包含 message", function() {
        eo.expect(response).to.have.property("message");
        eo.expect(response.message).to.be.a("string");
    });
}
```

---

## 7. 最佳实践

### 7.1 代码规范

```javascript
// ✅ 推荐：使用有意义的变量名
var accessToken = eo.env.get("access_token");
var userId = eo.env.get("user_id");

// ❌ 不推荐：使用简短无意义的变量名
var t = eo.env.get("access_token");
var u = eo.env.get("user_id");

// ✅ 推荐：添加注释说明
// 从响应中提取用户信息并保存到环境变量
var response = JSON.parse(eo.response.body);
eo.env.set("user_id", response.data.id);

// ✅ 推荐：使用 try-catch 处理异常
try {
    var response = JSON.parse(eo.response.body);
    // 处理逻辑
} catch (e) {
    console.error("解析响应失败: " + e.message);
}
```

### 7.2 性能优化

```javascript
// ✅ 推荐：只解析一次响应
var response = JSON.parse(eo.response.body);
var userId = response.data.user_id;
var username = response.data.username;

// ❌ 不推荐：多次解析响应
var userId = JSON.parse(eo.response.body).data.user_id;
var username = JSON.parse(eo.response.body).data.username;

// ✅ 推荐：复用变量
var token = eo.env.get("access_token");
eo.request.headers["Authorization"] = "Bearer " + token;
console.log("使用 Token: " + token);
```

### 7.3 调试技巧

```javascript
// 打印请求信息
console.log("=== 请求信息 ===");
console.log("URL: " + eo.request.url);
console.log("Method: " + eo.request.method);
console.log("Headers: " + JSON.stringify(eo.request.headers));
console.log("Body: " + eo.request.body);

// 打印响应信息
console.log("=== 响应信息 ===");
console.log("Status: " + eo.response.status);
console.log("Time: " + eo.response.responseTime + "ms");
console.log("Body: " + eo.response.body);

// 打印环境变量
console.log("=== 环境变量 ===");
console.log("Token: " + eo.env.get("access_token"));
console.log("User ID: " + eo.env.get("user_id"));
```

### 7.4 安全建议

```javascript
// ✅ 推荐：敏感信息使用环境变量
var apiKey = eo.env.get("api_key");
var apiSecret = eo.env.get("api_secret");

// ❌ 不推荐：硬编码敏感信息
var apiKey = "abc123456789";  // 不安全

// ✅ 推荐：脱敏日志输出
var token = eo.env.get("access_token");
console.log("Token: " + token.substring(0, 10) + "...");

// ❌ 不推荐：完整输出敏感信息
console.log("Token: " + token);  // 可能泄露
```

### 7.5 模块化脚本

```javascript
// 定义通用函数
function generateSignature(params) {
    var keys = Object.keys(params).sort();
    var signStr = "";
    keys.forEach(function(key) {
        signStr += key + "=" + params[key] + "&";
    });
    signStr += "key=" + eo.env.get("api_secret");
    return CryptoJS.MD5(signStr).toString();
}

// 定义错误处理函数
function handleError(response) {
    console.error("请求失败");
    console.error("Code: " + response.code);
    console.error("Message: " + response.message);
}

// 使用函数
var params = {
    user_id: "12345",
    timestamp: Date.now()
};
var signature = generateSignature(params);
eo.env.set("signature", signature);
```

---

## 8. 常见问题 FAQ

### Q1: 如何在 URL 中使用变量？
```
直接使用 {{variable_name}} 语法
示例: https://api.example.com/users/{{user_id}}
```

### Q2: 如何处理数组参数？
```javascript
// 在脚本中构造数组
var ids = [1, 2, 3, 4, 5];
eo.env.set("ids", JSON.stringify(ids));

// 在请求中使用
// Body: {"ids": {{ids}}}
```

### Q3: 如何设置动态 Header？
```javascript
// 前置脚本
eo.request.headers["X-Custom-Header"] = "custom_value";
eo.request.headers["X-Timestamp"] = Date.now().toString();
```

### Q4: 如何实现接口依赖？
```javascript
// 接口 A 后置脚本
var response = JSON.parse(eo.response.body);
eo.env.set("dependency_id", response.data.id);

// 接口 B 前置脚本
var dependencyId = eo.env.get("dependency_id");
// 在接口 B 中使用 {{dependency_id}}
```

---

## 9. 示例项目结构

```
eolink-project/
├── environments/
│   ├── dev.json          # 开发环境配置
│   ├── test.json         # 测试环境配置
│   └── prod.json         # 生产环境配置
├── scripts/
│   ├── auth/
│   │   ├── login.pre.js      # 登录前置脚本
│   │   └── login.post.js     # 登录后置脚本
│   ├── user/
│   │   ├── create.pre.js
│   │   └── create.post.js
│   └── common/
│       ├── signature.js      # 签名生成通用脚本
│       └── error_handler.js  # 错误处理通用脚本
├── test_data/
│   ├── users.json        # 测试数据
│   └── products.json
└── README.md             # 项目说明文档
```

---

## 10. 参考资源

- [Eolink 官方文档](https://www.eolink.com/help)
- [JavaScript MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [Crypto-JS 加密库](https://cryptojs.gitbook.io/docs/)

