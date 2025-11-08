# 部署指南

本文档详细说明如何将项目部署到生产环境。

## 📋 部署前准备

### 1. 服务器要求
- 操作系统: Linux (推荐Ubuntu 20.04+) 或 Windows Server
- 内存: 至少 1GB
- 硬盘: 至少 10GB
- 网络: 公网IP,开放80、443、3000端口

### 2. 域名准备
- 一个已备案的域名
- 配置DNS解析到服务器IP
- 申请SSL证书(推荐Let's Encrypt免费证书)

### 3. 必需软件
- Node.js (v14+)
- MySQL (v5.7+)
- Nginx
- PM2 (进程管理器)

## 🗄 数据库部署

### 1. 安装MySQL

#### Ubuntu:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### Windows:
下载并安装 MySQL 安装包

### 2. 创建数据库和用户

```bash
# 登录MySQL
mysql -u root -p

# 执行以下SQL命令
CREATE DATABASE iot_miniapp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建专用用户(推荐)
CREATE USER 'iot_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON iot_miniapp.* TO 'iot_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
exit;
```

### 3. 导入数据表

```bash
# 上传 init.sql 到服务器
mysql -u iot_user -p iot_miniapp < /path/to/init.sql
```

### 4. 配置数据库连接

编辑 `server/config/db.js`:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'iot_user',
    password: 'your_secure_password',
    database: 'iot_miniapp',
    // ...
};
```

## 🚀 后端部署

### 1. 上传代码到服务器

```bash
# 使用Git
git clone your-repo-url
cd your-project/server

# 或使用FTP/SCP上传
```

### 2. 安装依赖

```bash
cd server
npm install --production
```

### 3. 安装PM2

```bash
npm install -g pm2
```

### 4. 启动应用

```bash
# 启动应用
pm2 start app.js --name iot-server

# 查看状态
pm2 status

# 查看日志
pm2 logs iot-server

# 设置开机自启
pm2 startup
pm2 save
```

### 5. PM2 常用命令

```bash
# 重启应用
pm2 restart iot-server

# 停止应用
pm2 stop iot-server

# 删除应用
pm2 delete iot-server

# 查看实时日志
pm2 logs iot-server --lines 100
```

## 🔧 Nginx配置

### 1. 安装Nginx

#### Ubuntu:
```bash
sudo apt install nginx
```

#### Windows:
下载并安装 Nginx

### 2. 配置反向代理

创建配置文件 `/etc/nginx/sites-available/iot-miniapp`:

```nginx
# HTTP配置(用于重定向到HTTPS)
server {
    listen 80;
    server_name yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 日志配置
    access_log /var/log/nginx/iot-miniapp-access.log;
    error_log /var/log/nginx/iot-miniapp-error.log;
    
    # 反向代理到Node.js应用
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
    }
    
    # 静态文件(可选)
    location / {
        root /var/www/html;
        index index.html;
    }
}
```

### 3. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/iot-miniapp /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 4. 配置防火墙

```bash
# Ubuntu UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # 如果需要直接访问Node.js
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 🔐 SSL证书配置

### 使用Let's Encrypt免费证书(推荐)

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置SSL
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 或使用已有证书

将证书文件上传到服务器,并在Nginx配置中指定路径。

## 📱 小程序配置

### 1. 修改API地址

编辑 `utils/api.js`:
```javascript
const API_BASE_URL = 'https://yourdomain.com/api';
```

### 2. 微信公众平台配置

登录[微信公众平台](https://mp.weixin.qq.com/):

1. **开发管理 -> 开发设置 -> 服务器域名**
   - request合法域名: `https://yourdomain.com`
   - socket合法域名: `wss://your-mqtt-server.com`

2. **开发管理 -> 版本管理**
   - 上传代码
   - 提交审核
   - 发布

### 3. 配置微信登录

编辑后端代码,添加真实的AppID和AppSecret:

```javascript
// server/controllers/userController.js
const appid = 'your_real_appid';
const secret = 'your_real_appsecret';
```

**⚠️ 安全建议**: 使用环境变量存储敏感信息:

```bash
# 设置环境变量
export WX_APPID=your_appid
export WX_SECRET=your_secret
```

```javascript
// 代码中读取
const appid = process.env.WX_APPID;
const secret = process.env.WX_SECRET;
```

## 🧪 部署后测试

### 1. 测试后端API

```bash
# 健康检查
curl https://yourdomain.com/health

# 测试API
curl -X POST https://yourdomain.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"wxId":"test","nickname":"测试"}'
```

### 2. 测试小程序

1. 在微信开发者工具中切换到"体验版"
2. 测试登录功能
3. 测试MQTT连接
4. 测试设备添加和控制

## 📊 监控和日志

### 1. PM2监控

```bash
# 查看应用状态
pm2 monit

# 查看内存和CPU使用
pm2 list
```

### 2. Nginx日志

```bash
# 实时查看访问日志
tail -f /var/log/nginx/iot-miniapp-access.log

# 实时查看错误日志
tail -f /var/log/nginx/iot-miniapp-error.log
```

### 3. 应用日志

配置日志记录到文件:

```javascript
// server/app.js
const fs = require('fs');
const path = require('path');

const logFile = fs.createWriteStream(
    path.join(__dirname, 'logs', 'app.log'), 
    { flags: 'a' }
);

app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    logFile.write(log);
    console.log(log);
    next();
});
```

## 🔄 更新部署

### 更新后端代码

```bash
# 拉取最新代码
git pull

# 安装新依赖(如果有)
cd server
npm install --production

# 重启应用
pm2 restart iot-server
```

### 更新小程序

1. 修改代码
2. 在微信开发者工具中上传
3. 提交审核
4. 审核通过后发布

## 🛡 安全建议

### 1. 数据库安全
- 使用强密码
- 只允许本地连接
- 定期备份数据

```bash
# 数据库备份
mysqldump -u iot_user -p iot_miniapp > backup_$(date +%Y%m%d).sql

# 设置定时备份(crontab)
0 2 * * * /path/to/backup.sh
```

### 2. 服务器安全
- 禁用root登录
- 使用SSH密钥认证
- 配置防火墙
- 定期更新系统

### 3. 应用安全
- 使用HTTPS
- 验证所有输入
- 防止SQL注入
- 使用环境变量存储敏感信息

## 📝 故障排查

### 后端无法启动
1. 检查端口是否被占用: `lsof -i:3000`
2. 检查数据库连接
3. 查看PM2日志: `pm2 logs`

### 小程序无法访问API
1. 检查服务器域名配置
2. 检查SSL证书
3. 检查防火墙设置
4. 查看Nginx错误日志

### 数据库连接失败
1. 检查MySQL服务状态: `systemctl status mysql`
2. 检查数据库配置
3. 检查用户权限

## 📞 技术支持

**祝部署顺利! 🚀**

