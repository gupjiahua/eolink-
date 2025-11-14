// ===== 接口1: 获取 LoginToken - 前置脚本 =====
// 作用：准备登录所需的所有参数
// 执行时机：在调用"企业账号云登录"接口之前

console.log("========== 接口1: 获取 LoginToken - 前置准备 ==========");

// 1. 设置基础账号信息（从环境变量获取）
var enterpriseAccount = eo.env.get("enterprise_account") || "fktest1919";
var userAccount = eo.env.get("user_account") || "18807849027";

eo.env.set("enterprise_account", enterpriseAccount);
eo.env.set("user_account", userAccount);

console.log("企业账号: " + enterpriseAccount);
console.log("用户账号: " + userAccount);

// 2. 生成 traceId (格式: login-{时间戳})
var timestamp = Date.now();
var traceId = "login-" + timestamp;
eo.env.set("trace_id", traceId);

console.log("TraceId: " + traceId);

// 3. 设置设备ID（可以固定一个值或动态生成）
var deviceId = eo.env.get("device_id") || "266397dc9b0b39ab6853909bae46ec98";
eo.env.set("device_id", deviceId);

console.log("设备ID: " + deviceId);

// 4. 设置 RSA 公钥
var publicKey = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCROXqyCKxG8DrQKvrmdwiAHFJseaLHKsdzJ+61EpEGUawyLk5obn2Z2lyVVGjqT3KECk3DJtAD6Jux/m/gW2/lxspvhUO1YE1P8OZuUq5xhr/3AWuSSXCqLM2q6TEMnI2VE1BzlsRcxQVWFSiUnOa7JJjJTvhwVMGnIVVc8tcXZwIDAQAB";
eo.env.set("public_key", publicKey);

console.log("RSA 公钥已设置");

// 5. 处理密码加密
// 注意：这里需要实现 RSA 加密逻辑
// 由于 Eolink 可能不支持直接的 RSA 加密，这里提供两种方案：

// 方案1: 如果已经有预先加密好的密码，直接使用
var rsaPassword = eo.env.get("rsa_password");
if (rsaPassword) {
    console.log("使用预先加密的密码");
    eo.env.set("rsa_password", rsaPassword);
} else {
    // 方案2: 使用 JSEncrypt 库进行加密（需要在 Eolink 中引入库）
    try {
        var plainPassword = eo.env.get("password");
        if (typeof JSEncrypt !== 'undefined') {
            var encrypt = new JSEncrypt();
            encrypt.setPublicKey(publicKey);
            var encryptedPassword = encrypt.encrypt(plainPassword);
            eo.env.set("rsa_password", encryptedPassword);
            console.log("密码 RSA 加密成功");
        } else {
            console.warn("⚠️ JSEncrypt 库未加载，请提供预先加密的密码或配置加密库");
            console.warn("请在环境变量中设置 'rsa_password' 为预先加密的密码");
        }
    } catch (e) {
        console.error("密码加密失败: " + e.message);
        console.warn("请在环境变量中手动设置 'rsa_password'");
    }
}

// 6. 设置图片验证码（如果需要）
var imgCode = eo.env.get("img_code") || "";
if (imgCode) {
    console.log("图片验证码: " + imgCode);
} else {
    console.log("未设置图片验证码（如果需要请在环境变量中设置 'img_code'）");
}

// 7. 设置 _fs_token（从环境变量获取，如果没有则使用示例值）
var fsToken = eo.env.get("_fs_token") || "CZ9cOcGpP6GjOM4nPYqqOpCqBM4sOJOjDsHXCM8tDcKtOJ8o";
eo.env.set("_fs_token", fsToken);

console.log("_fs_token: " + fsToken.substring(0, 20) + "...");

// 8. 设置 persistenceHint（是否保持登录）
eo.env.set("persistence_hint", true);

console.log("保持登录: true");

// 9. 设置请求头
eo.request.headers["Content-Type"] = "application/json";
eo.request.headers["Accept"] = "application/json, text/javascript, */*; q=0.01";
eo.request.headers["Accept-Encoding"] = "gzip, deflate, br, zstd";
eo.request.headers["Accept-Language"] = "zh-CN,zh-TW;0.9,en;0.8";
eo.request.headers["Origin"] = "https://www.fxiaoke.com";
eo.request.headers["Referer"] = "https://www.fxiaoke.com/proj/page/login";

console.log("请求头设置完成");

console.log("========== 接口1 前置准备完成 ==========");
console.log("");