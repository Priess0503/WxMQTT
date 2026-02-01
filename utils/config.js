/**
 * 环境配置文件
 * 用于切换本地开发和线上生产环境
 */

// ==================== 环境配置 ====================

// 当前环境: 'development' 或 'production'
const ENV = 'production';  // 本地测试改为 'development'，上线改为 'production'

// ==================== API配置 ====================

const API_CONFIG = {
    // 开发环境（本地测试）
    development: {
        baseUrl: 'https://xiaoyaozi.bbskali.cn/api',
        useRealWxLogin: false,  // 是否使用真实微信登录
        mockWxId: 'test_openid_001'  // 模拟的微信ID
    },
    
    // 生产环境（线上部署）
    production: {
        baseUrl: 'https://xiaoyaozi.bbskali.cn/api',  // 您的真实域名
        useRealWxLogin: true,  // 使用真实微信登录
        mockWxId: null
    }
};

// 获取当前环境配置
function getConfig() {
    return API_CONFIG[ENV];
}

// 获取API基础URL
function getApiBaseUrl() {
    return getConfig().baseUrl;
}

// 是否使用真实微信登录
function useRealWxLogin() {
    return getConfig().useRealWxLogin;
}

// 获取模拟微信ID（仅开发环境）
function getMockWxId() {
    return getConfig().mockWxId;
}

// 获取当前环境名称
function getEnv() {
    return ENV;
}

module.exports = {
    getConfig,
    getApiBaseUrl,
    useRealWxLogin,
    getMockWxId,
    getEnv
};

