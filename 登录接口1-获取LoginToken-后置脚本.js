// ===== 接口1: 获取 LoginToken - 后置脚本 =====
// 作用：提取并保存 loginToken，供接口2使用
// 执行时机：在收到"企业账号云登录"接口响应之后

console.log("========== 接口1: 获取 LoginToken - 响应处理 ==========");

try {
    // 1. 解析响应体
    var response = JSON.parse(eo.response.body);
    
    console.log("响应状态码: " + eo.response.status);
    console.log("响应时间: " + eo.response.responseTime + "ms");
    
    // 2. 检查 HTTP 状态码
    if (eo.response.status !== 200) {
        console.error("❌ HTTP 请求失败，状态码: " + eo.response.status);
        throw new Error("HTTP 状态码异常: " + eo.response.status);
    }
    
    // 3. 检查业务状态码
    if (!response.Result || response.Result.StatusCode === undefined) {
        console.error("❌ 响应格式异常，缺少 Result.StatusCode 字段");
        console.error("响应内容: " + JSON.stringify(response));
        throw new Error("响应格式异常");
    }
    
    var statusCode = response.Result.StatusCode;
    console.log("业务状态码: " + statusCode);
    
    // 4. 判断是否成功（StatusCode = 0 表示成功）
    if (statusCode === 0) {
        console.log("✅ 接口1 调用成功");
        
        // 5. 提取并保存 loginToken（重要！）
        if (response.Value && response.Value.loginToken) {
            var loginToken = response.Value.loginToken;
            eo.env.set("login_token", loginToken);
            
            console.log("✅ LoginToken 提取成功: " + loginToken.substring(0, 20) + "...");
            console.log("完整 LoginToken: " + loginToken);
            
            // 6. 保存用户基本信息
            if (response.Result.UserInfo) {
                var employeeId = response.Result.UserInfo.EmployeeID;
                var enterpriseAccount = response.Result.UserInfo.EnterpriseAccount;
                
                eo.env.set("employee_id", employeeId);
                eo.env.set("enterprise_account", enterpriseAccount);
                
                console.log("员工ID: " + employeeId);
                console.log("企业账号: " + enterpriseAccount);
            }
            
            // 7. 保存企业域名信息（可能在后续接口中使用）
            if (response.Value.enterpriseDomains) {
                var domains = response.Value.enterpriseDomains;
                eo.env.set("enterprise_domains", JSON.stringify(domains));
                
                console.log("企业域名信息:");
                console.log("  - img: " + domains.img);
                console.log("  - file: " + domains.file);
                console.log("  - root: " + domains.root);
            }
            
            // 8. 设置接口1完成标识
            eo.env.set("interface1_completed", "true");
            
            console.log("========== 接口1 执行成功，可以继续执行接口2 ==========");
            
        } else {
            // loginToken 不存在
            console.error("❌ 响应中未找到 loginToken");
            console.error("响应内容: " + JSON.stringify(response));
            throw new Error("未获取到 loginToken");
        }
        
    } else {
        // 业务状态码不为 0，表示失败
        console.error("❌ 接口1 调用失败");
        console.error("业务状态码: " + statusCode);
        
        // 输出错误信息
        if (response.Result.FailureMessage) {
            console.error("失败原因: " + response.Result.FailureMessage);
        }
        if (response.Result.FailureCode) {
            console.error("失败代码: " + response.Result.FailureCode);
        }
        
        console.error("完整响应: " + JSON.stringify(response));
        
        // 设置失败标识
        eo.env.set("interface1_completed", "false");
        
        throw new Error("接口1 调用失败: " + (response.Result.FailureMessage || "未知错误"));
    }
    
} catch (e) {
    // 异常处理
    console.error("========== 接口1 执行失败 ==========");
    console.error("错误信息: " + e.message);
    console.error("错误堆栈: " + e.stack);
    
    // 设置失败标识
    eo.env.set("interface1_completed", "false");
    eo.env.set("login_token", "");
    
    // 如果需要终止后续接口执行，可以使用：
    // eo.stop("接口1 执行失败，终止测试");
    
    throw e;
}

// ===== 测试断言 =====

// 断言1: HTTP 状态码为 200
eo.test("HTTP 状态码为 200", function() {
    eo.expect(eo.response.status).to.equal(200);
});

// 断言2: 响应时间小于 5 秒
eo.test("响应时间小于 5000ms", function() {
    eo.expect(eo.response.responseTime).to.be.below(5000);
});

// 断言3: 业务状态码为 0
eo.test("业务状态码为 0", function() {
    var response = JSON.parse(eo.response.body);
    eo.expect(response.Result.StatusCode).to.equal(0);
});

// 断言4: 返回了 loginToken
eo.test("响应包含 loginToken", function() {
    var response = JSON.parse(eo.response.body);
    eo.expect(response.Value).to.have.property("loginToken");
    eo.expect(response.Value.loginToken).to.be.a("string");
    eo.expect(response.Value.loginToken).to.have.lengthOf.at.least(10);
});

// 断言5: 返回了用户信息
eo.test("响应包含用户信息", function() {
    var response = JSON.parse(eo.response.body);
    eo.expect(response.Result).to.have.property("UserInfo");
    eo.expect(response.Result.UserInfo).to.have.property("EmployeeID");
    eo.expect(response.Result.UserInfo.EmployeeID).to.be.a("number");
});

console.log("");