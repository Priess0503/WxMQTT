Page({
  data: {
    config: {
      host: '',
      username: '',
      password: ''
    }
  },

  onLoad() {
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
  saveConfig() {
    const { config } = this.data;
    
    // 验证配置
    if (!config.host) {
      wx.showToast({
        title: '请输入服务器地址',
        icon: 'none'
      });
      return;
    }

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
  }
}); 