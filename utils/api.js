/**
 * API服务 - 封装所有后端接口调用
 */
const config = require('./config');

// 后端服务器地址 - 自动根据环境配置
const API_BASE_URL = config.getApiBaseUrl();

console.log('API配置:', {
    环境: config.getEnv(),
    API地址: API_BASE_URL,
    真实登录: config.useRealWxLogin()
});

/**
 * 通用请求方法
 */
function request(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `${API_BASE_URL}${url}`,
            method: method,
            header: {
                'Content-Type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(res.data.error || '请求失败'));
                }
            },
            fail: (err) => {
                console.error('API请求失败:', err);
                reject(err);
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.data = data;
        }

        wx.request(options);
    });
}

/**
 * ==================== 用户相关接口 ====================
 */

/**
 * 微信登录/注册（开发测试用）
 * @param {string} wxId - 微信openid
 * @param {string} nickname - 微信昵称
 * @param {string} avatarUrl - 微信头像
 */
function wxLogin(wxId, nickname = null, avatarUrl = null) {
    return request('/user/login', 'POST', { wxId, nickname, avatarUrl });
}

/**
 * 微信登录 - 用code换取openid（生产环境）
 * @param {string} code - 微信登录code
 * @param {string} nickName - 微信昵称
 * @param {string} avatarUrl - 微信头像
 */
function wxLoginWithCode(code, nickName = null, avatarUrl = null) {
    return request('/user/wx-login', 'POST', { code, nickName, avatarUrl });
}

/**
 * 保存MQTT配置
 * @param {string} wxId - 微信openid
 * @param {object} mqttConfig - MQTT配置 {host, username, password}
 */
function saveMqttConfig(wxId, mqttConfig) {
    return request('/user/mqtt-config', 'POST', {
        wxId,
        host: mqttConfig.host,
        username: mqttConfig.username,
        password: mqttConfig.password
    });
}

/**
 * 获取MQTT配置
 * @param {string} wxId - 微信openid
 */
function getMqttConfig(wxId) {
    return request(`/user/mqtt-config/${wxId}`, 'GET');
}

/**
 * ==================== 设备相关接口 ====================
 */

/**
 * 获取用户设备列表
 * @param {string} wxId - 微信openid
 */
function getDevices(wxId) {
    return request(`/device/list/${wxId}`, 'GET');
}

/**
 * 添加设备
 * @param {string} wxId - 微信openid
 * @param {object} device - 设备信息
 */
function addDevice(wxId, device) {
    return request('/device/add', 'POST', { wxId, device });
}

/**
 * 更新设备
 * @param {string} wxId - 微信openid
 * @param {object} device - 设备信息
 */
function updateDevice(wxId, device) {
    return request('/device/update', 'PUT', { wxId, device });
}

/**
 * 删除设备
 * @param {string} wxId - 微信openid
 * @param {string} deviceId - 设备ID
 */
function deleteDevice(wxId, deviceId) {
    return request(`/device/delete/${wxId}/${deviceId}`, 'DELETE');
}

/**
 * 批量同步设备
 * @param {string} wxId - 微信openid
 * @param {array} devices - 设备列表
 */
function syncDevices(wxId, devices) {
    return request('/device/sync', 'POST', { wxId, devices });
}

/**
 * ==================== 导出所有接口 ====================
 */
module.exports = {
    // 用户接口
    wxLogin,
    wxLoginWithCode,  // 新增
    saveMqttConfig,
    getMqttConfig,
    
    // 设备接口
    getDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    syncDevices
};

