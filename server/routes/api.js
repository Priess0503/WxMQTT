/**
 * API路由
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const deviceController = require('../controllers/deviceController');

// ==================== 用户相关接口 ====================

/**
 * POST /api/user/wx-login
 * 微信登录 - 用code换取openid（生产环境）
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

/**
 * POST /api/user/login
 * 微信登录/注册（开发测试用）
 * Body: { wxId, nickname, avatarUrl }
 */
router.post('/user/login', async (req, res) => {
    const { wxId, nickname, avatarUrl } = req.body;
    
    if (!wxId) {
        return res.status(400).json({
            success: false,
            error: '缺少微信ID'
        });
    }
    
    const result = await userController.wxLogin(wxId, nickname, avatarUrl);
    res.json(result);
});

/**
 * POST /api/user/mqtt-config
 * 保存MQTT配置
 * Body: { wxId, host, username, password }
 */
router.post('/user/mqtt-config', async (req, res) => {
    const { wxId, host, username, password } = req.body;
    
    if (!wxId) {
        return res.status(400).json({
            success: false,
            error: '缺少微信ID'
        });
    }
    
    const result = await userController.saveMqttConfig(wxId, host, username, password);
    res.json(result);
});

/**
 * GET /api/user/mqtt-config/:wxId
 * 获取MQTT配置
 */
router.get('/user/mqtt-config/:wxId', async (req, res) => {
    const { wxId } = req.params;
    
    if (!wxId) {
        return res.status(400).json({
            success: false,
            error: '缺少微信ID'
        });
    }
    
    const result = await userController.getMqttConfig(wxId);
    res.json(result);
});

// ==================== 设备相关接口 ====================

/**
 * GET /api/device/list/:wxId
 * 获取用户设备列表
 */
router.get('/device/list/:wxId', async (req, res) => {
    const { wxId } = req.params;
    
    if (!wxId) {
        return res.status(400).json({
            success: false,
            error: '缺少微信ID'
        });
    }
    
    const result = await deviceController.getDevices(wxId);
    res.json(result);
});

/**
 * POST /api/device/add
 * 添加设备
 * Body: { wxId, device: {...} }
 */
router.post('/device/add', async (req, res) => {
    const { wxId, device } = req.body;
    
    if (!wxId || !device) {
        return res.status(400).json({
            success: false,
            error: '缺少必要参数'
        });
    }
    
    const result = await deviceController.addDevice(wxId, device);
    res.json(result);
});

/**
 * PUT /api/device/update
 * 更新设备
 * Body: { wxId, device: {...} }
 */
router.put('/device/update', async (req, res) => {
    const { wxId, device } = req.body;
    
    if (!wxId || !device) {
        return res.status(400).json({
            success: false,
            error: '缺少必要参数'
        });
    }
    
    const result = await deviceController.updateDevice(wxId, device);
    res.json(result);
});

/**
 * DELETE /api/device/delete/:wxId/:deviceId
 * 删除设备
 */
router.delete('/device/delete/:wxId/:deviceId', async (req, res) => {
    const { wxId, deviceId } = req.params;
    
    if (!wxId || !deviceId) {
        return res.status(400).json({
            success: false,
            error: '缺少必要参数'
        });
    }
    
    const result = await deviceController.deleteDevice(wxId, deviceId);
    res.json(result);
});

/**
 * POST /api/device/sync
 * 批量同步设备
 * Body: { wxId, devices: [...] }
 */
router.post('/device/sync', async (req, res) => {
    const { wxId, devices } = req.body;
    
    if (!wxId) {
        return res.status(400).json({
            success: false,
            error: '缺少微信ID'
        });
    }
    
    const result = await deviceController.syncDevices(wxId, devices || []);
    res.json(result);
});

module.exports = router;
