App({
  globalData: {
    wxId: null,
    userInfo: null
  },

  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function () {
    // 检查用户登录状态
    this.checkLoginStatus();
  },

  /**
   * 检查用户登录状态
   */
  checkLoginStatus: function () {
    const wxId = wx.getStorageSync('wxId');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (wxId) {
      // 用户已登录
      this.globalData.wxId = wxId;
      this.globalData.userInfo = userInfo;
      console.log('用户已登录, wxId:', wxId);
    } else {
      // 用户未登录,保持在当前页面
      console.log('用户未登录,保持在当前页面');
      this.globalData.wxId = null;
      this.globalData.userInfo = null;
    }
  },

  /**
   * 获取微信ID
   */
  getWxId: function () {
    return this.globalData.wxId || wx.getStorageSync('wxId');
  },

  /**
   * 获取用户信息
   */
  getUserInfo: function () {
    return this.globalData.userInfo || wx.getStorageSync('userInfo');
  },

  /**
   * 退出登录
   */
  logout: function () {
    // 清除本地存储
    wx.removeStorageSync('wxId');
    wx.removeStorageSync('userInfo');
    
    // 清除全局数据
    this.globalData.wxId = null;
    this.globalData.userInfo = null;
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    });
  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {
    
  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {
    
  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {
    
  }
})
