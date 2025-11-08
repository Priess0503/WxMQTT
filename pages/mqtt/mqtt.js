<<<<<<< HEAD
const api = require('../../utils/api');

=======
>>>>>>> a83a60444d083c894cf8433ba6f0219844e197de
Page({
  data: {
    config: {
      host: '',
      username: '',
      password: ''
<<<<<<< HEAD
    },
    wxId: null
  },

  onLoad() {
    // 获取微信ID
    const app = getApp();
    const wxId = app.getWxId();
    this.setData({ wxId });

=======
    }
  },

  onLoad() {
>>>>>>> a83a60444d083c894cf8433ba6f0219844e197de
    // 加载已保存的配置
    const mqttConfig = wx.getStorageSync('mqttConfig') || {};
    this.setData({
      config: {
        host: mqttConfig.host || '',
        username: mqttConfig.username || '',
        password: mqttConfig.password || ''
      }
    });
  },

  // 输入事件处理函数
  onHostInput(e) {
    this.setData({
      'config.host': e.detail.value
    });
  },

  onUsernameInput(e) {
    this.setData({
      'config.username': e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      'config.password': e.detail.value
    });
  },

  // 保存配置
<<<<<<< HEAD
  async saveConfig() {
    const { config, wxId } = this.data;
=======
  saveConfig() {
    const { config } = this.data;
>>>>>>> a83a60444d083c894cf8433ba6f0219844e197de
    
    // 验证配置
    if (!config.host) {
      wx.showToast({
        title: '请输入服务器地址',
        icon: 'none'
      });
      return;
    }

<<<<<<< HEAD
    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    try {
      // 1. 保存到本地存储
      wx.setStorageSync('mqttConfig', config);
      
      // 2. 同步到数据库
      if (wxId) {
        const result = await api.saveMqttConfig(wxId, config);
        
        if (result.success) {
          console.log('MQTT配置已同步到数据库');
        } else {
          console.error('同步MQTT配置失败:', result.error);
          // 即使同步失败,本地也已保存,不影响使用
        }
      }
      
      wx.hideLoading();
      
      wx.showToast({
        title: '配置已保存',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      console.error('保存配置失败:', error);
      
      // 即使同步失败,本地也已保存
      wx.showToast({
        title: '配置已保存到本地',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
=======
    // 保存配置
    wx.setStorageSync('mqttConfig', config);
    
    wx.showToast({
      title: '配置已保存',
      icon: 'success'
    });

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
>>>>>>> a83a60444d083c894cf8433ba6f0219844e197de
  }
}); 