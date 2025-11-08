# 快速开始指南 🚀

本指南帮助您在10分钟内启动并运行项目。

## 📋 前置条件检查

确保已安装:
- ✅ Node.js (v14+)
- ✅ MySQL (v5.7+)
- ✅ 微信开发者工具

## ⚡ 5步快速启动

### 步骤1: 配置数据库 (2分钟)

```bash
# 1. 登录MySQL
mysql -u root -p

# 2. 执行初始化脚本
source F:\xiaochengxu\database\init.sql

# 3. 验证创建成功
SHOW DATABASES;
USE iot_miniapp;
SHOW TABLES;
exit;
```

### 步骤2: 配置后端 (2分钟)

```bash
# 1. 进入server目录
cd F:\xiaochengxu\server

# 2. 修改数据库密码
# 编辑 config/db.js 文件,修改 password 字段为你的MySQL密码

# 3. 安装依赖
npm install

# 4. 启动服务器
npm start
```

看到以下提示说明启动成功:
```
✅ 数据库连接成功!
🚀 服务器已启动: http://localhost:3000
```

### 步骤3: 配置小程序 (1分钟)

1. 打开微信开发者工具
2. 导入项目: 选择 `F:\xiaochengxu` 目录
3. AppID: 选择"测试号"(或填写你的AppID)
4. 点击"编译"

### 步骤4: 开启调试模式 (30秒)

在微信开发者工具中:
1. 点击右上角"详情"
2. 勾选"不校验合法域名、web-view..."

### 步骤5: 开始使用! (1分钟)

1. 小程序自动打开登录页
2. 点击"微信一键登录"
3. 授权登录
4. 完成!

## 🎯 首次使用配置

### 1. 配置MQTT服务器

进入"设置"页面,填写:
- 服务器地址: 你的MQTT服务器地址
- 用户名: MQTT用户名  
- 密码: MQTT密码

点击"保存"

### 2. 添加第一个设备

1. 进入"设备管理"
2. 点击"添加设备"
3. 选择设备类型(如:温度传感器)
4. 填写设备名称和订阅主题
5. 保存

### 3. 查看数据

返回首页,查看设备实时数据!

## 🔍 验证功能

### 验证后端服务

浏览器打开:
```
http://localhost:3000
```

应该看到API文档页面。

### 验证数据库连接

```bash
# 查看用户表
mysql -u root -p
USE iot_miniapp;
SELECT * FROM userinfo;
```

### 验证小程序登录

1. 小程序登录后
2. 查看数据库:
```sql
SELECT * FROM userinfo WHERE wx_id LIKE 'wx_%';
```

应该能看到刚刚登录的用户信息。

## ❓ 常见问题

### Q1: 后端启动失败,提示数据库连接错误
**A:** 检查 `server/config/db.js` 中的密码是否正确

### Q2: 小程序提示"服务器错误"
**A:** 确认后端服务器已启动,查看控制台日志

### Q3: MQTT连接不上
**A:** 
1. 检查MQTT服务器是否启动
2. 确认使用wss://协议
3. 验证用户名密码

### Q4: 登录后数据没有同步
**A:** 
1. 检查后端服务器是否正常运行
2. 打开微信开发者工具控制台,查看错误信息
3. 确认数据库连接正常

## 📚 下一步

- 📖 阅读完整的 [README.md](README.md)
- 🚀 查看 [部署指南](DEPLOYMENT.md)
- 🔐 配置真实的微信登录: [LOGIN_GUIDE.md](pages/login/LOGIN_GUIDE.md)

## 🎉 开发提示

### 开发模式运行后端

```bash
cd server
npm run dev  # 自动重启,方便开发
```

### 查看实时日志

```bash
# Windows PowerShell
Get-Content -Path "server/logs/app.log" -Wait -Tail 50

# Linux/Mac
tail -f server/logs/app.log
```

### 数据库管理工具推荐

- [MySQL Workbench](https://www.mysql.com/products/workbench/) (官方)
- [Navicat](https://www.navicat.com.cn/) (付费)
- [DBeaver](https://dbeaver.io/) (免费)

## 🛠 开发工具配置

### VS Code 推荐插件

- ESLint
- MySQL
- REST Client
- WeChat MiniProgram Helper

### 微信开发者工具设置

1. 设置 -> 编辑器
   - 开启代码自动补全
   - 开启保存时自动格式化

2. 设置 -> 代理
   - 如有需要,配置网络代理

## 💡 测试数据

### 快速测试设备数据

可以使用MQTT客户端工具(如MQTTX)发送测试数据:

```json
// 温度数据
{
  "temp": 25.5
}

// 湿度数据  
{
  "humi": 65
}

// 水质数据
{
  "TDS": 120,
  "DJ": "优"
}
```

发布到对应的主题,小程序即可接收显示。

## 🎓 学习路径

1. ✅ 快速启动 (当前)
2. 📖 熟悉功能 (添加设备、查看数据)
3. 🔧 自定义配置 (修改界面、添加设备类型)
4. 🚀 正式部署 (配置真实登录、部署服务器)

---

**现在开始你的物联网之旅吧! 🎉**

有问题?查看详细文档或提交Issue。

