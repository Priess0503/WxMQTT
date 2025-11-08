/**
 * 智慧物联网监控小程序后端服务
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRouter = require('./routes/api');
const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// 跨域配置
app.use(cors());

// 解析JSON请求体
app.use(bodyParser.json());

// 解析URL编码的请求体
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ==================== 路由配置 ====================

// API路由
app.use('/api', apiRouter);

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '智慧物联网监控小程序后端API服务',
        version: '1.0.0',
        endpoints: {
            user: {
                login: 'POST /api/user/login',
                saveMqttConfig: 'POST /api/user/mqtt-config',
                getMqttConfig: 'GET /api/user/mqtt-config/:wxId'
            },
            device: {
                getList: 'GET /api/device/list/:wxId',
                add: 'POST /api/device/add',
                update: 'PUT /api/device/update',
                delete: 'DELETE /api/device/delete/:wxId/:deviceId',
                sync: 'POST /api/device/sync'
            }
        }
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

// ==================== 启动服务器 ====================

async function startServer() {
    try {
        // 测试数据库连接
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('⚠️  数据库连接失败,但服务器仍将启动');
        }
        
        // 启动HTTP服务器
        app.listen(PORT, () => {
            console.log('');
            console.log('========================================');
            console.log('  智慧物联网监控小程序后端服务');
            console.log('========================================');
            console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
            console.log(`📝 API文档: http://localhost:${PORT}`);
            console.log(`💚 健康检查: http://localhost:${PORT}/health`);
            console.log('========================================');
            console.log('');
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    process.exit(0);
});

module.exports = app;

