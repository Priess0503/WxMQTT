/**
 * 数据库配置文件
 */
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
    host: 'xx.xxx.xxx.xxx',           // 数据库服务器地址
    user: 'iot',                // 数据库用户名
    password: 'password',   // 数据库密码 - 请修改为您的实际密码
    database: 'iot_miniapp',     // 数据库名
    waitForConnections: true,
    connectionLimit: 10,         // 连接池最大连接数
    queueLimit: 0,
    charset: 'utf8mb4'
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 执行查询
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    testConnection
};

