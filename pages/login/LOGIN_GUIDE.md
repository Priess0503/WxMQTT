# 微信登录实现说明

## ⚠️ 重要提示

当前登录页面使用的是**模拟openid**,仅用于开发测试。在正式上线前,必须实现真实的微信登录流程。

## 🔧 当前实现(开发测试版)

```javascript
// 当前代码 - 模拟openid
const mockWxId = 'wx_' + Date.now();
```

这种方式仅用于:
- 本地开发测试
- 功能验证
- 界面调试

## ✅ 正式实现方案

### 方案一: 使用后端服务器(推荐)

#### 1. 前端代码修改

修改 `pages/login/login.js` 中的 `wxLogin` 方法:

```javascript
/**
 * 微信登录 - 正式版本
 */
wxLogin(userInfo) {
    const that = this;
    
    wx.login({
        success: (res) => {
            if (res.code) {
                console.log('获取到code:', res.code);
                
                // 将code发送到后端
                that.getOpenIdFromServer(res.code, userInfo);
            } else {
                console.error('微信登录失败:', res.errMsg);
                wx.showToast({
                    title: '微信登录失败',
                    icon: 'none'
                });
            }
        }
    });
},

/**
 * 从后端获取openid
 */
async getOpenIdFromServer(code, userInfo) {
    const that = this;
    
    wx.showLoading({ title: '登录中...' });
    
    try {
        // 调用后端接口,用code换取openid
        const result = await wx.request({
            url: 'http://localhost:3000/api/user/wx-login',
            method: 'POST',
            data: {
                code: code,
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl
            }
        });
        
        wx.hideLoading();
        
        if (result.data.success) {
            const wxId = result.data.data.openid;
            
            // 继续登录流程
            that.loginToServer(wxId, userInfo);
        } else {
            throw new Error(result.data.error || '获取openid失败');
        }
    } catch (error) {
        wx.hideLoading();
        console.error('获取openid失败:', error);
        wx.showToast({
            title: '登录失败',
            icon: 'none'
        });
    }
}
```

#### 2. 后端接口实现

在 `server/controllers/userController.js` 中添加:

```javascript
const axios = require('axios');

/**
 * 微信登录 - 用code换取openid
 */
async function wxLoginWithCode(code, nickName, avatarUrl) {
    try {
        // 微信小程序配置
        const appid = 'your_appid';        // 替换为您的小程序AppID
        const secret = 'your_secret';      // 替换为您的小程序AppSecret
        
        // 调用微信接口获取openid
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        if (data.openid) {
            // 获取openid成功,继续登录流程
            return await wxLogin(data.openid, nickName, avatarUrl);
        } else {
            return {
                success: false,
                error: data.errmsg || '获取openid失败'
            };
        }
    } catch (error) {
        console.error('微信登录失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    wxLogin,
    wxLoginWithCode,  // 新增导出
    // ...其他方法
};
```

#### 3. 添加路由

在 `server/routes/api.js` 中添加:

```javascript
/**
 * POST /api/user/wx-login
 * 微信登录 - 用code换取openid
 * Body: { code, nickName, avatarUrl }
 */
router.post('/user/wx-login', async (req, res) => {
    const { code, nickName, avatarUrl } = req.body;
    
    if (!code) {
        return res.status(400).json({
            success: false,
            error: '缺少code'
        });
    }
    
    const result = await userController.wxLoginWithCode(code, nickName, avatarUrl);
    res.json(result);
});
```

### 方案二: 使用云开发(适合小型项目)

如果使用微信云开发,可以直接使用云函数:

```javascript
// 云函数: login
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    
    return {
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
    };
}

// 小程序端调用
wx.cloud.callFunction({
    name: 'login',
    success: res => {
        console.log('openid:', res.result.openid);
        // 继续登录流程
    }
});
```

## 🔑 获取AppID和AppSecret

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 查看AppID和AppSecret

**⚠️ 重要**: 
- AppSecret是敏感信息,只能在后端使用,不能写在小程序代码中
- 定期更新AppSecret
- 不要将AppSecret提交到Git仓库

## 📋 正式上线检查清单

- [ ] 实现真实的微信登录流程
- [ ] 配置小程序AppID和AppSecret
- [ ] 后端代码部署到服务器
- [ ] 配置HTTPS域名
- [ ] 在微信公众平台配置服务器域名
- [ ] 配置合法域名:
  - request合法域名
  - socket合法域名(MQTT)
- [ ] 测试完整登录流程
- [ ] 上传代码并提交审核

## 🔍 调试技巧

### 开发阶段
1. 在微信开发者工具中开启"不校验合法域名"
2. 使用测试号AppID进行开发
3. 查看控制台日志

### 正式环境
1. 配置正式的服务器域名
2. 使用正式的AppID
3. 开启日志记录

## 📝 相关文档

- [微信小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [code2Session API文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## ⚡ 快速测试(开发阶段)

如果只是想快速测试功能,可以暂时使用模拟openid:

```javascript
// 开发测试用 - 固定的测试openid
const mockWxId = 'test_openid_001';
```

这样每次登录使用相同的openid,方便测试数据同步功能。

**注意**: 正式上线前务必替换为真实的微信登录!

