# 生产环境部署指南

本文档说明如何将小程序部署到生产环境，同时保留本地测试功能。

## 📋 已完成的修改

### 后端文件
1. ✅ `server/controllers/userController.js` - 添加真实微信登录
2. ✅ `server/routes/api.js` - 添加 wx-login 路由

### 小程序文件
1. ✅ `utils/config.js` - **新增**环境配置文件
2. ✅ `utils/api.js` - 支持环境自动切换
3. ✅ `pages/login/login.js` - 支持真实/模拟登录切换

## 🔄 环境切换方法

### 方法一：修改配置文件（推荐）

编辑 `utils/config.js` 文件第8行：

```javascript
// 本地开发测试
const ENV = 'development';

// 线上生产环境
const ENV = 'production';
```

### 方法二：配置对比

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| ENV | `'development'` | `'production'` |
| API地址 | `http://localhost:3000/api` | `https://api.bbskali.cn/api` |
| 微信登录 | 模拟登录（固定ID） | 真实登录（动态openid） |
| mockWxId | `test_openid_001` | `null` |

## 🚀 部署步骤

### 一、本地测试（当前状态）

**配置：**
```javascript
// utils/config.js
const ENV = 'development';
```

**特点：**
- ✅ 使用模拟wxId: `test_openid_001`
- ✅ 连接本地后端: `http://localhost:3000/api`
- ✅ 无需真实AppID/AppSecret
- ✅ 可以测试数据同步功能

**使用方法：**
1. 启动本地后端: `cd server && npm start`
2. 微信开发者工具编译运行
3. 点击"微信一键登录"
4. 自动使用固定ID登录

### 二、部署到生产环境

#### 步骤1: 上传后端代码到服务器

```bash
# 方法1: 使用Git
cd /www/iot-miniapp
git pull

# 方法2: 使用SCP上传
scp -r server/ root@82.157.210.200:/www/iot-miniapp/
```

#### 步骤2: 服务器配置

```bash
# SSH登录服务器
ssh root@82.157.210.200

# 进入项目目录
cd /www/iot-miniapp/server

# 安装依赖
npm install --production

# 启动/重启服务
pm2 restart iot-server
# 或首次启动
pm2 start app.js --name iot-server

# 查看日志
pm2 logs iot-server
```

#### 步骤3: 验证后端API

```bash
# 测试接口
curl https://api.bbskali.cn/health

# 应返回
{"success":true,"message":"服务运行正常",...}
```

#### 步骤4: 修改小程序配置

编辑 `utils/config.js`：

```javascript
// 改为生产环境
const ENV = 'production';
```

#### 步骤5: 微信公众平台配置

登录 https://mp.weixin.qq.com/

**1. 配置服务器域名：**
- 开发管理 → 开发设置 → 服务器域名
- **request合法域名**: `https://api.bbskali.cn`
- **socket合法域名**: `wss://您的MQTT服务器域名`

**2. 确认AppID和AppSecret：**
- 开发管理 → 开发设置
- 查看AppID: `wx2ca5f3478b9fc071`
- AppSecret已配置在后端

#### 步骤6: 上传小程序代码

在微信开发者工具：

1. **编译验证**
   - 点击"编译"
   - 测试登录功能

2. **上传代码**
   - 点击"上传"
   - 填写版本号(如: 1.0.0)
   - 填写备注(如: 正式版本)

3. **提交审核**
   - 登录微信公众平台
   - 版本管理 → 开发版本 → 提交审核
   - 填写审核信息

4. **发布上线**
   - 审核通过后点击"发布"

## 🧪 测试验证

### 本地测试（development）

```javascript
// utils/config.js
const ENV = 'development';
```

**登录日志应显示：**
```
当前环境: development
API地址: http://localhost:3000/api
真实登录: false
=== 开发环境：模拟登录 ===
使用模拟wxId: test_openid_001
```

### 生产测试（production）

```javascript
// utils/config.js
const ENV = 'production';
```

**登录日志应显示：**
```
当前环境: production
API地址: https://api.bbskali.cn/api
真实登录: true
=== 生产环境：真实微信登录 ===
正在从后端获取openid...
获取到真实wxId: o****** (真实的openid)
```

## 📝 数据库查询

### 查看用户数据

```sql
USE iot_miniapp;

-- 开发环境用户（固定ID）
SELECT * FROM userinfo WHERE wx_id = 'test_openid_001';

-- 生产环境用户（真实openid）
SELECT * FROM userinfo WHERE wx_id LIKE 'o%';

-- 查看所有用户
SELECT wx_id, nickname, ip, username FROM userinfo;
```

## 🔍 常见问题

### Q1: 如何在生产环境调试？

**方法1: 使用体验版**
```javascript
// 暂时改回开发环境
const ENV = 'development';
// 上传为体验版测试
```

**方法2: 查看后端日志**
```bash
pm2 logs iot-server --lines 100
```

### Q2: 如何快速切换环境？

只需修改一个文件的一行代码：
```javascript
// utils/config.js 第8行
const ENV = 'development';  // 或 'production'
```

### Q3: 忘记改回生产环境怎么办？

如果上传到正式版本时忘记改为 `production`：
1. 修改 `utils/config.js`
2. 重新上传代码
3. 重新提交审核

### Q4: 如何添加新的环境？

可以扩展配置文件：
```javascript
const API_CONFIG = {
    development: {...},
    production: {...},
    staging: {  // 新增测试环境
        baseUrl: 'https://test.bbskali.cn/api',
        useRealWxLogin: true,
        mockWxId: null
    }
};
```

## 📊 部署检查清单

### 后端部署
- [ ] 代码已上传到服务器
- [ ] npm依赖已安装
- [ ] PM2服务正常运行
- [ ] API接口可访问
- [ ] 数据库连接正常
- [ ] AppID和AppSecret正确

### 小程序配置
- [ ] ENV改为 `'production'`
- [ ] API地址正确
- [ ] 微信公众平台已配置域名
- [ ] 代码已上传
- [ ] 已提交审核

### 测试验证
- [ ] 真实登录功能正常
- [ ] MQTT配置同步正常
- [ ] 设备添加/编辑/删除正常
- [ ] 多端数据同步正常

## 🎯 上线后监控

### 1. 服务器监控

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs iot-server

# 查看资源使用
pm2 monit
```

### 2. 数据库监控

```sql
-- 查看用户增长
SELECT COUNT(*) as total_users FROM userinfo;

-- 查看活跃用户（最近登录）
SELECT COUNT(*) as active_users 
FROM userinfo 
WHERE update_time > DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 查看设备统计
SELECT type, COUNT(*) as count 
FROM device_info 
GROUP BY type;
```

### 3. API监控

在Nginx日志中查看访问情况：
```bash
tail -f /var/log/nginx/iot-miniapp-access.log
```

## 📄 文件修改总结

### 后端修改
| 文件 | 修改内容 | 说明 |
|------|---------|------|
| `server/controllers/userController.js` | 添加wxLoginWithCode | 真实登录接口 |
| `server/routes/api.js` | 添加/user/wx-login路由 | 真实登录路由 |

### 小程序修改
| 文件 | 修改内容 | 说明 |
|------|---------|------|
| `utils/config.js` | **新增**环境配置 | 一键切换环境 |
| `utils/api.js` | 支持环境切换 | 自动读取配置 |
| `pages/login/login.js` | 支持双模式登录 | 根据配置自动选择 |

## 🎉 部署完成

现在您的小程序已经完美支持：
- ✅ 本地开发测试（模拟登录）
- ✅ 生产环境部署（真实登录）
- ✅ 一键切换环境
- ✅ 数据云端同步
- ✅ 多端数据共享

---

**如有问题，请查看日志或联系技术支持！** 🚀

