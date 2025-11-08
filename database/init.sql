-- ================================================
-- 智慧物联网监控小程序数据库初始化脚本
-- ================================================

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS iot_miniapp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE iot_miniapp;

-- 2. 创建用户信息表
CREATE TABLE IF NOT EXISTS userinfo (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    wx_id VARCHAR(100) NOT NULL UNIQUE COMMENT '微信用户唯一标识(openid)',
    nickname VARCHAR(100) DEFAULT NULL COMMENT '微信昵称',
    avatar_url VARCHAR(255) DEFAULT NULL COMMENT '微信头像URL',
    ip VARCHAR(255) DEFAULT NULL COMMENT 'MQTT服务器地址',
    username VARCHAR(100) DEFAULT NULL COMMENT 'MQTT用户名',
    password VARCHAR(255) DEFAULT NULL COMMENT 'MQTT密码(加密存储)',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_wx_id (wx_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';

-- 3. 创建设备信息表
CREATE TABLE IF NOT EXISTS device_info (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
    device_id VARCHAR(50) NOT NULL COMMENT '设备ID(前端生成的时间戳ID)',
    wx_id VARCHAR(100) NOT NULL COMMENT '微信用户ID',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    type VARCHAR(50) NOT NULL COMMENT '设备类型(temperature/humidity/switch/waterquality/turang/fengsu/led/motor)',
    topic VARCHAR(255) DEFAULT NULL COMMENT '订阅主题(传感器设备使用)',
    publish_topic VARCHAR(255) DEFAULT NULL COMMENT '发布主题(控制设备使用)',
    on_command VARCHAR(255) DEFAULT NULL COMMENT '开启命令(开关/灯带设备使用)',
    off_command VARCHAR(255) DEFAULT NULL COMMENT '关闭命令(开关/灯带设备使用)',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_wx_id (wx_id),
    INDEX idx_device_id (device_id),
    UNIQUE KEY uk_wx_device (wx_id, device_id) COMMENT '用户+设备ID唯一索引',
    FOREIGN KEY (wx_id) REFERENCES userinfo(wx_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备信息表';

-- 4. 创建数据库用户(可选,用于后端服务器连接)
-- 注意: 请根据实际情况修改密码
-- CREATE USER 'iot_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON iot_miniapp.* TO 'iot_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 5. 查看表结构
SHOW TABLES;
DESC userinfo;
DESC device_info;

