/**
 * 用户控制器
 */
const { query } = require('../config/db');
const crypto = require('crypto');
const axios = require('axios');

// 微信小程序配置
const WX_APPID = 'xxxxxxx';        // 您的真实AppID
const WX_SECRET = 'xxxxxxx';   // 您的真实AppSecret

/**
 * 加密密码
 */
function encryptPassword(password) {
    if (!password) return null;
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 解密密码(SHA256是单向加密,这里实际是返回加密后的密码供对比使用)
 */
function decryptPassword(encryptedPassword) {
    // SHA256是不可逆的,这里只是为了保持接口一致性
    // 实际使用时,前端会发送原始密码,后端加密后对比
    return encryptedPassword;
}

/**
 * 微信登录/注册
 * @param {string} wxId - 微信openid
 * @param {string} nickname - 微信昵称
 * @param {string} avatarUrl - 微信头像
 */
async function wxLogin(wxId, nickname = null, avatarUrl = null) {
    try {
        // 查询用户是否存在
        const checkSql = 'SELECT * FROM userinfo WHERE wx_id = ?';
        const users = await query(checkSql, [wxId]);

        if (users.length > 0) {
            // 用户已存在,返回用户信息
            const user = users[0];
            return {
                success: true,
                isNewUser: false,
                data: {
                    wxId: user.wx_id,
                    nickname: user.nickname,
                    avatarUrl: user.avatar_url,
                    mqttConfig: {
                        host: user.ip,
                        username: user.username,
                        password: user.password
                    }
                }
            };
        } else {
            // 新用户,插入数据库
            const insertSql = 'INSERT INTO userinfo (wx_id, nickname, avatar_url) VALUES (?, ?, ?)';
            await query(insertSql, [wxId, nickname, avatarUrl]);
            
            return {
                success: true,
                isNewUser: true,
                data: {
                    wxId,
                    nickname,
                    avatarUrl,
                    mqttConfig: {
                        host: null,
                        username: null,
                        password: null
                    }
                }
            };
        }
    } catch (error) {
        console.error('微信登录失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 微信登录 - 用code换取openid（生产环境）
 * @param {string} code - 微信登录code
 * @param {string} nickName - 微信昵称
 * @param {string} avatarUrl - 微信头像
 */
async function wxLoginWithCode(code, nickName, avatarUrl) {
    try {
        console.log('收到微信登录请求, code:', code);
        
        // 调用微信接口获取openid
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        console.log('微信接口返回:', data);
        
        if (data.openid) {
            // 获取openid成功，继续登录流程
            console.log('获取openid成功:', data.openid);
            return await wxLogin(data.openid, nickName, avatarUrl);
        } else {
            console.error('获取openid失败:', data);
            return {
                success: false,
                error: data.errmsg || '获取openid失败'
            };
        }
    } catch (error) {
        console.error('微信登录失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 保存/更新MQTT配置
 * @param {string} wxId - 微信openid
 * @param {string} host - MQTT服务器地址
 * @param {string} username - MQTT用户名
 * @param {string} password - MQTT密码
 */
async function saveMqttConfig(wxId, host, username, password) {
    try {
        // 开发环境：暂不加密密码，方便测试MQTT连接
        // 生产环境：建议使用AES等可逆加密，或使用HTTPS保护传输
        // const encryptedPassword = encryptPassword(password);
        
        // 更新用户MQTT配置
        const updateSql = `
            UPDATE userinfo 
            SET ip = ?, username = ?, password = ?, update_time = CURRENT_TIMESTAMP 
            WHERE wx_id = ?
        `;
        const result = await query(updateSql, [host, username, password, wxId]);
        
        return {
            success: result.affectedRows > 0,
            data: {
                host,
                username,
                password: password  // 返回原始密码
            }
        };
    } catch (error) {
        console.error('保存MQTT配置失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 获取用户MQTT配置
 * @param {string} wxId - 微信openid
 */
async function getMqttConfig(wxId) {
    try {
        const sql = 'SELECT ip, username, password FROM userinfo WHERE wx_id = ?';
        const users = await query(sql, [wxId]);
        
        if (users.length > 0) {
            const user = users[0];
            return {
                success: true,
                data: {
                    host: user.ip,
                    username: user.username,
                    password: user.password
                }
            };
        } else {
            return {
                success: false,
                error: '用户不存在'
            };
        }
    } catch (error) {
        console.error('获取MQTT配置失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    wxLogin,
    wxLoginWithCode,
    saveMqttConfig,
    getMqttConfig,
    encryptPassword,
    decryptPassword
};
