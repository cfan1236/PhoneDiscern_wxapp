// pages/discern/discern.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    baseUrl: "https://*********",
    width: 0,
    height: 0,
    image_y: 70,
    image_x: 10,
    image_height: 70,
    canvas_top: -50,
    // 标记列表
    markList: [],
    // 识别结果
    discernResult: {},
    // 是否显示结果
    showResult: false,
    // 用户标记字符
    userMark: [],
    // 提交标记flag
    markFlag: false,
    showMarkTips: false,
    // 最终号码 用户可能修改后的
    realPhone: "",
    showNonePhone: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    var that = this
    // console.log("执行完了");
    that.path = options.path
    if (that.isEmpty(that.path))
      return;
    wx.getSystemInfo({
      success: function(res) {
        var width = res.windowWidth
        var height = res.windowHeight
        // console.log("width:" + width + " height:" + height);
        that.setData({
          width: width,
          height: height
        })
        wx.getImageInfo({
          src: that.path,
          success: function(res) {
            that.canvas = wx.createCanvasContext("image-canvas", that)
            // 过渡页面中，图片的路径坐标和大小
            that.canvas.drawImage(that.path, 0, 0, that.data.width, that.data.height)
            wx.showLoading({
              title: '数据处理中',
              mask: true
            })
            that.canvas.setStrokeStyle('Orange')
           //  console.log("裁剪后的宽度:" + (that.data.width - that.data.image_y * 2));
            that.canvas.strokeRect(that.data.image_x, that.data.image_y, that.data.width - 10, that.data.image_height);
            that.canvas.draw();
            that.canvasToTempFile();

          }
        })
      }
    })
  },
  canvasToTempFile: function() {
    var that = this;
    setTimeout(function() {
      wx.canvasToTempFilePath({ // 裁剪对参数
        canvasId: "image-canvas",
        x: that.data.image_x, // 画布x轴起点
        y: that.data.image_y, // 画布y轴起点 
        width: that.data.width, // 画布宽度
        height: that.data.image_height, // 画布高度
        destWidth: that.data.width, // 输出图片宽度
        destHeight: that.data.image_height, // 输出图片高度
        canvasId: 'image-canvas',
        success: function(res) {
          that.filePath = res.tempFilePath;
          // 清除画布上在该矩形区域内的内容。
          that.canvas.clearRect(0, 0, that.data.width, that.data.height);
          that.canvas.drawImage(that.filePath, that.data.image_x, that.data.image_y, that.data.width - 20, that.data.image_height);
          that.canvas.draw();
          wx.hideLoading();
          // 开始请求识别接口
          that.startDiscern(res.tempFilePath);
          // 开始获取标记类型
          that.getMarkType();
        },
        fail: function(e) {
         // console.log("出错了:" + e);
          wx.hideLoading()
          wx.showToast({
            title: '请稍后...',
            icon: 'loading'
          })
          // 出错后继续执行一次。
          that.canvasToTempFile();
        }
      });
    }, 1000);
  },

  /**
   * 开始识别
   */
  startDiscern: function(filePath) {
    var that = this;
    wx.showLoading({
      title: '正在识别...',
      mask: true
    })
    // 将图片转换成base64
    wx.getFileSystemManager().readFile({
      filePath: filePath, // 选择图片返回的相对路径
      encoding: 'base64', // 编码格式
      success: res => { // 成功的回调
        // console.log('data:image/png;base64,' + res.data)
        var base64_img = res.data;
        that.sendDiscernReq(base64_img);
      }
    })

  },
  /**
   * 发送识别请求
   */
  sendDiscernReq(base64_img) {
    var that = this;
    wx.request({
      url: that.data.baseUrl + 'phonediscern',
      method: "Post",
      data: {
        base64_image: base64_img
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        var data = res.data;
        // console.log("开始识别结果:", JSON.stringify(data));
        // 获取数据成功
        if (data.status == 1) {
          that.setData({
            discernResult: data.data,
            realPhone: data.data.text,
            userMark: data.data.phoneMark
          });
          if (that.data.userMark.length <= 0) {
            that.setData({
              showMarkTips: true
            })
          }
          that.setData({
            showResult: true
          });
        } else {
         // console.log("识别号码失败:", JSON.stringify(data));
          that.setData({
            showNonePhone: true
          })
        }
        // 关闭loadding
        wx.hideLoading();
      }
    })
  },
  /**
   * 号码变化
   */
  phoneNumberInput: function(e) {
    // console.log("实际号码:" + e.detail.value);
    this.setData({
      realPhone: e.detail.value
    })
  },
  /**
   * 拨打电话
   */
  callPhone: function() {
    var that = this;
    // console.log("拨打号码:" + that.data.realPhone);
    wx.showToast({
      title: '正在打开电话..',
      icon: 'none',
      duration: 2000
    });
    wx.makePhoneCall({
      phoneNumber: that.data.realPhone
    });

  },
  /**
   * 提交标记
   */
  submitMark: function(event) {
    var that = this;
    if (!that.data.markFlag) {
      // console.info("标记id:" + event.target.dataset.id);
      var index = event.target.dataset.id;
      wx.request({
        url: that.data.baseUrl + 'addusermark',
        method: "Post",
        data: {
          phone: that.data.realPhone,
          mark_index: index
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success(res) {
          var data = res.data;
          //获取数据成功
          if (data.status == 1 && data.data == true) {
            that.setData({
              markFlag: true
            });
            wx.showToast({
              title: '提交成功',
              icon: 'success',
              duration: 2000
            });
          } else {
           // console.log("提交标记失败:", JSON.stringify(data));
            wx.showToast({
              title: '提交失败',
              icon: 'none',
              duration: 2000
            });
          }

        }
      })
    } else {
      wx.showToast({
        title: '你已提交!',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 获取标记类型
   */
  getMarkType: function() {
    var that = this;
    wx.request({
      url: that.data.baseUrl + 'getmark',
      success(res) {
        var data = res.data;
        //获取数据成功
        if (data.status == 1) {
          that.setData({
            markList: data.data
          })
        } else {
          // console.log("获取标记数据失败:", JSON.stringify(data));
        }

      }
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

  },
  isEmpty: function(obj) {
    if (typeof obj == "undefined" || obj == null || obj == "") {
      return true;
    } else {
      return false;
    }
  }
})