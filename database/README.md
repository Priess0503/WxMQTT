# 数据库配置说明

## 一、安装MySQL

### Windows系统:
1. 下载MySQL安装包: https://dev.mysql.com/downloads/mysql/
2. 运行安装程序并按照向导完成安装
3. 记住设置的root密码

### 快速命令行安装(已安装MySQL的情况):
```bash
# 检查MySQL服务状态
net start mysql

# 如果未启动,启动MySQL服务
net start mysql
```

## 二、执行数据库初始化脚本

### 方法1: 使用命令行执行
```bash
# 1. 登录MySQL (会提示输入密码)
mysql -u root -p

# 2. 执行初始化脚本
source F:\xiaochengxu\database\init.sql

# 或者在命令行直接执行
mysql -u root -p < F:\xiaochengxu\database\init.sql
```

### 方法2: 使用MySQL Workbench (图形界面)
1. 打开MySQL Workbench
2. 连接到本地MySQL服务器
3. 打开 `init.sql` 文件
4. 点击执行按钮(闪电图标)

### 方法3: 使用Navicat或其他数据库管理工具
1. 连接到MySQL服务器
2. 新建查询
3. 复制 `init.sql` 内容并执行

## 三、验证数据库创建成功

```sql
-- 查看数据库
SHOW DATABASES;

-- 使用数据库
USE iot_miniapp;

-- 查看表
SHOW TABLES;

-- 查看用户表结构
DESC userinfo;

-- 查看设备表结构
DESC device_info;
```

## 四、数据库表结构说明

### 1. userinfo 表(用户信息表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 自增主键 |
| wx_id | VARCHAR(100) | 微信openid(唯一) |
| nickname | VARCHAR(100) | 微信昵称 |
| avatar_url | VARCHAR(255) | 微信头像 |
| ip | VARCHAR(255) | MQTT服务器地址 |
| username | VARCHAR(100) | MQTT用户名 |
| password | VARCHAR(255) | MQTT密码 |
| create_time | TIMESTAMP | 创建时间 |
| update_time | TIMESTAMP | 更新时间 |

### 2. device_info 表(设备信息表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 自增主键 |
| device_id | VARCHAR(50) | 设备ID |
| wx_id | VARCHAR(100) | 微信用户ID |
| name | VARCHAR(100) | 设备名称 |
| type | VARCHAR(50) | 设备类型 |
| topic | VARCHAR(255) | 订阅主题 |
| publish_topic | VARCHAR(255) | 发布主题 |
| on_command | VARCHAR(255) | 开启命令 |
| off_command | VARCHAR(255) | 关闭命令 |
| create_time | TIMESTAMP | 创建时间 |
| update_time | TIMESTAMP | 更新时间 |

## 五、配置后端服务器连接

在 `server/config/db.js` 中配置数据库连接信息:
```javascript
host: 'localhost',      // 数据库地址
user: 'root',           // 数据库用户名
password: 'your_password', // 数据库密码
database: 'iot_miniapp'    // 数据库名
```

## 六、注意事项

1. **密码安全**: 生产环境中应使用强密码,并考虑使用专门的数据库用户而非root
2. **数据备份**: 定期备份数据库数据
3. **编码格式**: 使用utf8mb4编码以支持emoji等特殊字符
4. **防火墙**: 如果后端服务器和数据库不在同一台机器,需要配置防火墙规则

