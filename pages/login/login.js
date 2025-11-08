/**
 * 微信登录页面
 */
const api = require('../../utils/api');
const config = require('../../utils/config');

Page({
    data: {
        userInfo: null,
        hasUserInfo: false,
        canIUseGetUserProfile: wx.canIUse('getUserProfile'),
        loading: false
    },

    onLoad() {
        // 检查是否已经登录
        const wxId = wx.getStorageSync('wxId');
        if (wxId) {
            // 已登录,直接跳转到首页
            wx.reLaunch({
                url: '/pages/index/index'
            });
        }
    },

    /**
     * 获取用户信息并登录
     */
    getUserProfile() {
        const that = this;
        
        // 显示加载提示
        this.setData({ loading: true });
        
        // 获取用户信息
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res) => {
                console.log('获取用户信息成功:', res.userInfo);
                
                const userInfo = res.userInfo;
                that.setData({
                    userInfo: userInfo,
                    hasUserInfo: true
                });
                
                // 调用微信登录接口获取code
                that.wxLogin(userInfo);
            },
            fail: (err) => {
                console.error('获取用户信息失败:', err);
                that.setData({ loading: false });
                wx.showToast({
                    title: '获取用户信息失败',
                    icon: 'none'
                });
            }
        });
    },

    /**
     * 微信登录 - 自动适配开发/生产环境
     */
    wxLogin(userInfo) {
        const that = this;
        
        wx.login({
            success: (res) => {
                if (res.code) {
                    console.log('微信登录成功,code:', res.code);
                    console.log('当前环境:', config.getEnv());
                    console.log('使用真实登录:', config.useRealWxLogin());
                    
                    // 根据配置判断使用真实登录还是测试登录
                    if (config.useRealWxLogin()) {
                        // 生产环境：使用真实微信登录
                        console.log('=== 生产环境：真实微信登录 ===');
                        that.getOpenIdFromServer(res.code, userInfo);
                    } else {
                        // 开发环境：使用模拟登录
                        console.log('=== 开发环境：模拟登录 ===');
                        const mockWxId = config.getMockWxId();
                        console.log('使用模拟wxId:', mockWxId);
                        that.loginToServer(mockWxId, userInfo);
                    }
                } else {
                    console.error('微信登录失败:', res.errMsg);
                    that.setData({ loading: false });
                    wx.showToast({
                        title: '微信登录失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.error('微信登录失败:', err);
                that.setData({ loading: false });
                wx.showToast({
                    title: '微信登录失败',
                    icon: 'none'
                });
            }
        });
    },

    /**
     * 从后端获取openid（生产环境）
     */
    async getOpenIdFromServer(code, userInfo) {
        const that = this;
        
        try {
            console.log('正在从后端获取openid...');
            
            // 调用后端接口，用code换取openid
            const result = await api.wxLoginWithCode(code, userInfo.nickName, userInfo.avatarUrl);
            
            console.log('后端返回结果:', result);
            
            if (result.success && result.data) {
                const wxId = result.data.wxId;
                console.log('获取到真实wxId:', wxId);
                
                // 保存到本地
                wx.setStorageSync('wxId', wxId);
                wx.setStorageSync('userInfo', userInfo);
                
                // 同步MQTT配置和设备数据
                if (!result.isNewUser && result.data.mqttConfig) {
                    const mqttConfig = result.data.mqttConfig;
                    console.log('准备同步MQTT配置:', mqttConfig);
                    
                    if (mqttConfig.host) {
                        wx.setStorageSync('mqttConfig', mqttConfig);
                        console.log('✅ MQTT配置已同步到本地');
                    }
                    
                    console.log('开始同步设备列表...');
                    await that.syncDevicesFromServer(wxId);
                }
                
                that.setData({ loading: false });
                
                wx.showToast({
                    title: result.isNewUser ? '注册成功' : '登录成功',
                    icon: 'success',
                    duration: 1500
                });
                
                setTimeout(() => {
                    wx.reLaunch({ url: '/pages/index/index' });
                }, 1500);
            } else {
                throw new Error(result.error || '获取openid失败');
            }
        } catch (error) {
            console.error('获取openid失败:', error);
            that.setData({ loading: false });
            wx.showToast({
                title: '登录失败: ' + error.message,
                icon: 'none',
                duration: 2000
            });
        }
    },

    /**
     * 调用后端登录接口
     */
    async loginToServer(wxId, userInfo) {
        const that = this;
        
        try {
            // 调用后端登录接口
            const result = await api.wxLogin(
                wxId,
                userInfo.nickName,
                userInfo.avatarUrl
            );
            
            console.log('后端登录结果:', result);
            console.log('是否新用户:', result.isNewUser);
            console.log('MQTT配置:', result.data.mqttConfig);
            
            if (result.success) {
                // 保存微信ID到本地
                wx.setStorageSync('wxId', wxId);
                wx.setStorageSync('userInfo', userInfo);
                
                // 如果不是新用户,同步MQTT配置和设备数据
                if (!result.isNewUser && result.data.mqttConfig) {
                    const mqttConfig = result.data.mqttConfig;
                    console.log('准备同步MQTT配置:', mqttConfig);
                    
                    // 同步MQTT配置
                    if (mqttConfig.host) {
                        wx.setStorageSync('mqttConfig', mqttConfig);
                        console.log('✅ MQTT配置已同步到本地');
                    } else {
                        console.log('⚠️ MQTT配置中没有host');
                    }
                    
                    // 同步设备列表
                    console.log('开始同步设备列表...');
                    that.syncDevicesFromServer(wxId);
                } else {
                    console.log('跳过数据同步，原因:', {
                        isNewUser: result.isNewUser,
                        hasMqttConfig: !!result.data.mqttConfig
                    });
                }
                
                that.setData({ loading: false });
                
                // 登录成功提示
                wx.showToast({
                    title: result.isNewUser ? '注册成功' : '登录成功',
                    icon: 'success',
                    duration: 1500
                });
                
                // 跳转到首页
                setTimeout(() => {
                    wx.reLaunch({
                        url: '/pages/index/index'
                    });
                }, 1500);
            } else {
                throw new Error(result.error || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            that.setData({ loading: false });
            wx.showToast({
                title: '登录失败: ' + error.message,
                icon: 'none',
                duration: 2000
            });
        }
    },

    /**
     * 从服务器同步设备列表
     */
    async syncDevicesFromServer(wxId) {
        try {
            console.log('正在从服务器获取设备列表, wxId:', wxId);
            const result = await api.getDevices(wxId);
            
            console.log('服务器返回的设备数据:', result);
            
            if (result.success && result.data) {
                // 保存设备列表到本地
                wx.setStorageSync('devices', result.data);
                console.log('✅ 设备列表已同步到本地:', result.data.length, '个设备');
                console.log('设备详情:', result.data);
            } else {
                console.log('⚠️ 获取设备列表失败或无设备:', result);
            }
        } catch (error) {
            console.error('❌ 同步设备列表失败:', error);
        }
    }
});

