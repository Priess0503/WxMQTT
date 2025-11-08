# 智慧物联网监控小程序

基于MQTT协议的微信小程序,支持多种传感器接入和设备控制,数据云端同步。

## 📋 目录

- [项目介绍](#项目介绍)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [使用说明](#使用说明)
- [项目结构](#项目结构)
- [注意事项](#注意事项)

## 🎯 项目介绍

这是一个基于MQTT协议的微信小程序物联网监控系统,支持:
- 多种传感器数据实时监控(温度、湿度、水质、土壤、风速等)
- 远程设备控制(开关、LED灯带、电机等)
- 历史数据图表展示
- 微信登录,数据云端同步
- 多端数据自动同步(换设备无需重新配置)

## ✨ 功能特性

### 1. 传感器监控
- ✅ 温度传感器
- ✅ 湿度传感器
- ✅ 水质传感器(TDS)
- ✅ 土壤湿度传感器
- ✅ 风速传感器
- ✅ 24小时/7天历史数据图表

### 2. 设备控制
- ✅ 开关设备控制
- ✅ WS2812B LED灯带颜色/亮度控制
- ✅ 伺服电机/马达控制

### 3. 数据同步
- ✅ 微信一键登录
- ✅ MQTT配置云端存储
- ✅ 设备列表云端同步
- ✅ 多端数据自动同步

## 🛠 技术栈

### 前端(小程序)
- 微信小程序原生开发
- MQTT.js 客户端
- Canvas 图表绘制

### 后端
- Node.js + Express
- MySQL 数据库
- RESTful API

### 通信协议
- MQTT (WebSocket)
- HTTP/HTTPS

## 🚀 快速开始

### 1. 环境准备

#### 必需软件:
- [Node.js](https://nodejs.org/) (v14+)
- [MySQL](https://dev.mysql.com/downloads/mysql/) (v5.7+)
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 2. 数据库配置

#### 步骤1: 创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source F:\xiaochengxu\database\init.sql
```

或者直接在MySQL客户端中执行 `database/init.sql` 文件。

#### 步骤2: 修改数据库配置

编辑 `server/config/db.js`:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password',  // 修改为您的MySQL密码
    database: 'iot_miniapp',
    // ...
};
```

### 3. 后端服务器启动

```bash
# 进入服务器目录
cd server

# 安装依赖
npm install

# 启动服务器
npm start

# 或者开发模式(自动重启)
npm run dev
```

启动成功后,会显示:
```
========================================
  智慧物联网监控小程序后端服务
========================================
🚀 服务器已启动: http://localhost:3000
📝 API文档: http://localhost:3000
💚 健康检查: http://localhost:3000/health
========================================
```

### 4. 小程序配置

#### 步骤1: 修改API地址

编辑 `utils/api.js`:
```javascript
// 根据实际情况修改后端服务器地址
const API_BASE_URL = 'http://localhost:3000/api';
// 或者使用您的服务器域名
// const API_BASE_URL = 'https://yourdomain.com/api';
```

#### 步骤2: 配置小程序AppID

1. 打开微信开发者工具
2. 导入项目,选择项目目录 `F:\xiaochengxu`
3. 填写您的小程序AppID(测试可选"测试号")

#### 步骤3: 配置服务器域名(正式环境)

在微信公众平台后台配置:
- request合法域名: `https://yourdomain.com`
- socket合法域名: `wss://your-mqtt-server.com`

### 5. 运行小程序

1. 在微信开发者工具中点击"编译"
2. 首次运行会进入登录页面
3. 点击"微信一键登录"授权登录
4. 开始使用!

## 📖 使用说明

### 首次使用流程

1. **微信登录**
   - 打开小程序,点击"微信一键登录"
   - 授权获取用户信息

2. **配置MQTT服务器**
   - 在设置页面输入MQTT服务器信息:
     - 服务器地址 (如: `mqtt.example.com`)
     - 用户名
     - 密码
   - 点击"保存"(会自动同步到云端)

3. **添加设备**
   - 进入"设备管理"页面
   - 点击"添加设备"
   - 选择设备类型
   - 填写设备名称和主题信息
   - 保存(会自动同步到云端)

4. **查看数据**
   - 返回首页,查看设备实时数据
   - 点击设备卡片查看历史数据图表
   - 控制设备(开关、灯带、电机)

### 换设备使用

当您换了新手机或重新安装小程序:
1. 直接微信登录
2. 系统自动从云端同步您的所有配置和设备
3. 无需重新配置,直接使用!

## 📁 项目结构

```
xiaochengxu/
├── pages/                  # 小程序页面
│   ├── login/             # 登录页面
│   ├── index/             # 主页(设备监控)
│   ├── mqtt/              # MQTT配置页面
│   ├── device/            # 设备管理页面
│   └── view/              # 数据查看页面
├── utils/                  # 工具文件
│   ├── api.js             # API接口封装
│   ├── mqtt.min.js        # MQTT客户端库
│   └── util.js            # 通用工具函数
├── images/                 # 图片资源
├── server/                 # 后端服务器
│   ├── app.js             # 服务器入口
│   ├── config/            # 配置文件
│   │   └── db.js          # 数据库配置
│   ├── controllers/       # 控制器
│   │   ├── userController.js    # 用户控制器
│   │   └── deviceController.js  # 设备控制器
│   ├── routes/            # 路由
│   │   └── api.js         # API路由
│   └── package.json       # 依赖配置
├── database/              # 数据库文件
│   ├── init.sql          # 数据库初始化脚本
│   └── README.md         # 数据库配置说明
├── app.js                 # 小程序入口
├── app.json              # 小程序配置
└── README.md             # 项目说明

```

## 🗄 数据库表结构

### userinfo 表(用户信息)
| 字段 | 类型 | 说明 |
|------|------|------|
| wx_id | VARCHAR(100) | 微信openid(主键) |
| nickname | VARCHAR(100) | 微信昵称 |
| avatar_url | VARCHAR(255) | 微信头像 |
| ip | VARCHAR(255) | MQTT服务器地址 |
| username | VARCHAR(100) | MQTT用户名 |
| password | VARCHAR(255) | MQTT密码(加密) |

### device_info 表(设备信息)
| 字段 | 类型 | 说明 |
|------|------|------|
| device_id | VARCHAR(50) | 设备ID |
| wx_id | VARCHAR(100) | 用户微信ID(外键) |
| name | VARCHAR(100) | 设备名称 |
| type | VARCHAR(50) | 设备类型 |
| topic | VARCHAR(255) | 订阅主题 |
| publish_topic | VARCHAR(255) | 发布主题 |
| on_command | VARCHAR(255) | 开启命令 |
| off_command | VARCHAR(255) | 关闭命令 |

## 🔐 安全说明

1. **密码加密**: MQTT密码使用SHA256加密存储
2. **数据隔离**: 每个用户的数据通过wx_id完全隔离
3. **生产环境建议**:
   - 使用HTTPS协议
   - 配置数据库防火墙
   - 使用强密码
   - 定期备份数据

## ⚠️ 注意事项

1. **微信小程序限制**
   - 必须使用wss://协议连接MQTT服务器
   - 需要在小程序后台配置服务器域名
   - 本地开发时需开启"不校验合法域名"

2. **MQTT服务器要求**
   - 支持WebSocket协议(端口通常为8083或8084)
   - 建议使用EMQX、Mosquitto等开源MQTT服务器

3. **数据存储**
   - 历史数据仅保存7天(可在代码中修改)
   - 设备状态数据存储在本地和云端双备份

4. **后端部署**
   - 生产环境建议使用PM2进程管理
   - 配置Nginx反向代理
   - 使用HTTPS证书

## 🔧 常见问题

### Q: 登录后提示"登录失败"?
A: 检查后端服务器是否启动,数据库是否连接成功。

### Q: MQTT连接失败?
A: 
1. 检查MQTT服务器地址是否正确
2. 确认使用wss://协议
3. 检查用户名密码是否正确

### Q: 数据不同步?
A: 
1. 确认已登录
2. 检查网络连接
3. 查看控制台是否有错误信息

### Q: 换设备后数据丢失?
A: 只要使用相同微信号登录,数据会自动从云端同步。

## 📝 开发计划

- [ ] 支持数据导出功能
- [ ] 添加设备分组管理
- [ ] 支持设备分享给其他用户
- [ ] 添加异常报警功能
- [ ] 支持语音控制

## 📄 许可证

本项目仅供学习交流使用。

## 👨‍💻 贡献

欢迎提交Issue和Pull Request!

**祝您使用愉快! 🎉**

