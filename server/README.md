# 后端服务器说明

## 一、安装依赖

在 `server` 目录下执行:

```bash
cd server
npm install
```

## 二、配置数据库

1. 修改 `server/config/db.js` 文件中的数据库配置:

```javascript
const dbConfig = {
    host: 'localhost',           // 数据库地址
    user: 'root',                // 数据库用户名
    password: 'your_password',   // 修改为您的数据库密码
    database: 'iot_miniapp',     // 数据库名
    // ...其他配置
};
```

2. 确保已执行数据库初始化脚本 `database/init.sql`

## 三、启动服务器

### 开发模式(自动重启):
```bash
npm run dev
```

### 生产模式:
```bash
npm start
```

启动成功后,会看到如下提示:
```
========================================
  智慧物联网监控小程序后端服务
========================================
🚀 服务器已启动: http://localhost:3000
📝 API文档: http://localhost:3000
💚 健康检查: http://localhost:3000/health
========================================
```

## 四、API接口说明

### 基础URL
```
http://localhost:3000/api
```

### 用户相关接口

#### 1. 微信登录/注册
- **URL**: `POST /api/user/login`
- **请求体**:
```json
{
  "wxId": "微信openid",
  "nickname": "微信昵称",
  "avatarUrl": "微信头像URL"
}
```
- **响应**:
```json
{
  "success": true,
  "isNewUser": false,
  "data": {
    "wxId": "xxx",
    "nickname": "xxx",
    "avatarUrl": "xxx",
    "mqttConfig": {
      "host": "服务器地址",
      "username": "用户名",
      "password": "密码"
    }
  }
}
```

#### 2. 保存MQTT配置
- **URL**: `POST /api/user/mqtt-config`
- **请求体**:
```json
{
  "wxId": "微信openid",
  "host": "MQTT服务器地址",
  "username": "MQTT用户名",
  "password": "MQTT密码"
}
```

#### 3. 获取MQTT配置
- **URL**: `GET /api/user/mqtt-config/:wxId`
- **响应**:
```json
{
  "success": true,
  "data": {
    "host": "服务器地址",
    "username": "用户名",
    "password": "加密后的密码"
  }
}
```

### 设备相关接口

#### 1. 获取设备列表
- **URL**: `GET /api/device/list/:wxId`
- **响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "设备ID",
      "name": "设备名称",
      "type": "设备类型",
      "topic": "订阅主题",
      "publishTopic": "发布主题",
      "onCommand": "开启命令",
      "offCommand": "关闭命令"
    }
  ]
}
```

#### 2. 添加设备
- **URL**: `POST /api/device/add`
- **请求体**:
```json
{
  "wxId": "微信openid",
  "device": {
    "id": "设备ID",
    "name": "设备名称",
    "type": "设备类型",
    "topic": "订阅主题",
    "publishTopic": "发布主题",
    "onCommand": "开启命令",
    "offCommand": "关闭命令"
  }
}
```

#### 3. 更新设备
- **URL**: `PUT /api/device/update`
- **请求体**: 同添加设备

#### 4. 删除设备
- **URL**: `DELETE /api/device/delete/:wxId/:deviceId`

#### 5. 批量同步设备
- **URL**: `POST /api/device/sync`
- **请求体**:
```json
{
  "wxId": "微信openid",
  "devices": [
    // 设备数组
  ]
}
```

## 五、测试接口

### 使用curl测试:

```bash
# 健康检查
curl http://localhost:3000/health

# 测试登录
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"wxId":"test_wx_id","nickname":"测试用户"}'
```

### 使用Postman或其他API测试工具
导入以上接口进行测试

## 六、注意事项

1. **端口占用**: 默认使用3000端口,如需修改,设置环境变量 `PORT`
2. **跨域**: 已配置CORS允许所有来源,生产环境请根据需要限制
3. **密码加密**: 使用SHA256单向加密存储密码
4. **错误处理**: 所有接口返回统一格式的JSON响应
5. **日志**: 控制台会输出所有API请求日志

## 七、部署建议

### 生产环境部署:
1. 使用PM2进程管理:
```bash
npm install -g pm2
pm2 start app.js --name iot-server
pm2 startup
pm2 save
```

2. 配置Nginx反向代理
3. 使用HTTPS协议
4. 配置数据库连接池
5. 添加日志文件记录

