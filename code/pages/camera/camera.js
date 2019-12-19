// pages/camera/camera.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    width: 0,
    height: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this
    // 初始化相机
    that.ctx = wx.createCameraContext()
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          width: res.windowWidth,
          height: res.windowHeight
        })
      }
    })

  },
  /**
   * 拍照
   */
  takePhoto: function() {
    var that = this
    that.ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        wx.setStorage({
          key: 'originalImagePath',
          data: res.tempImagePath,
        })

        wx.showLoading({
          title: '请稍后...',
          mask: true
        })
        wx.navigateTo({
          url: '../discern/discern?path=' + res.tempImagePath + '&char=0'
        })
      }
    })
  },
  cancelPhoto: function() {
    console.log("取消拍照");
    wx.navigateTo({
      url: '../index/index'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})