module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _wxCanvas = __webpack_require__(1);

var _wxCanvas2 = _interopRequireDefault(_wxCanvas);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ctx = void 0;

function compareVersion(v1, v2) {
  v1 = v1.split('.');
  v2 = v2.split('.');
  var len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (var i = 0; i < len; i++) {
    var num1 = parseInt(v1[i]);
    var num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },

    echarts: {
      type: Object
    },

    ec: {
      type: Object
    },

    forceUseOldCanvas: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isUseNewCanvas: false
  },

  ready: function ready() {
    if (!this.data.echarts) {
      console.warn('组件需要传入 echarts');
      return;
    }

    // Disable prograssive because drawImage doesn't support DOM as parameter
    // See https://developers.weixin.qq.com/miniprogram/dev/api/canvas/CanvasContext.drawImage.html
    this.data.echarts.registerPreprocessor(function (option) {
      if (option && option.series) {
        if (option.series.length > 0) {
          option.series.forEach(function (series) {
            series.progressive = 0;
          });
        } else if (_typeof(option.series) === 'object') {
          option.series.progressive = 0;
        }
      }
    });

    if (!this.data.ec) {
      console.warn('组件需绑定 ec 变量，例：<ec-canvas id="mychart-dom-bar" ' + 'canvas-id="mychart-bar" ec="{{ ec }}"></ec-canvas>');
      return;
    }

    if (!this.data.ec.lazyLoad) {
      this.init();
    }
  },

  methods: {
    init: function init(callback) {
      var version = wx.getSystemInfoSync().SDKVersion;

      var canUseNewCanvas = compareVersion(version, '2.9.0') >= 0;
      var forceUseOldCanvas = this.data.forceUseOldCanvas;
      var isUseNewCanvas = canUseNewCanvas && !forceUseOldCanvas;
      this.setData({ isUseNewCanvas: isUseNewCanvas });

      if (forceUseOldCanvas && canUseNewCanvas) {
        console.warn('开发者强制使用旧canvas,建议关闭');
      }

      if (isUseNewCanvas) {
        // console.log('微信基础库版本大于2.9.0，开始使用<canvas type="2d"/>');
        // 2.9.0 可以使用 <canvas type="2d"></canvas>
        this.initByNewWay(callback);
      } else {
        var isValid = compareVersion(version, '1.9.91') >= 0;
        if (!isValid) {
          console.error('微信基础库版本过低，需大于等于 1.9.91。' + '参见：https://github.com/ecomfe/echarts-for-weixin' + '#%E5%BE%AE%E4%BF%A1%E7%89%88%E6%9C%AC%E8%A6%81%E6%B1%82');
          return;
        } else {
          console.warn('建议将微信基础库调整大于等于2.9.0版本。升级后绘图将有更好性能');
          this.initByOldWay(callback);
        }
      }
    },

    initByOldWay: function initByOldWay(callback) {
      var _this = this;

      // 1.9.91 <= version < 2.9.0：原来的方式初始化
      ctx = wx.createCanvasContext(this.data.canvasId, this);
      var canvas = new _wxCanvas2.default(ctx, this.data.canvasId, false);

      this.data.echarts.setCanvasCreator(function () {
        return canvas;
      });
      // const canvasDpr = wx.getSystemInfoSync().pixelRatio // 微信旧的canvas不能传入dpr
      var canvasDpr = 1;
      var query = wx.createSelectorQuery().in(this);
      query.select('.ec-canvas').boundingClientRect(function (res) {
        if (typeof callback === 'function') {
          _this.chart = callback(canvas, res.width, res.height, canvasDpr);
        } else if (_this.data.ec && typeof _this.data.ec.onInit === 'function') {
          _this.chart = _this.data.ec.onInit(canvas, res.width, res.height, canvasDpr);
        } else {
          _this.triggerEvent('init', {
            canvas: canvas,
            width: res.width,
            height: res.height,
            canvasDpr: canvasDpr // 增加了dpr，可方便外面echarts.init
          });
        }
      }).exec();
    },
    initByNewWay: function initByNewWay(callback) {
      var _this2 = this;

      // version >= 2.9.0：使用新的方式初始化
      var query = wx.createSelectorQuery().in(this);
      query.select('.ec-canvas').fields({ node: true, size: true }).exec(function (res) {
        var canvasNode = res[0].node;
        _this2.canvasNode = canvasNode;

        var canvasDpr = wx.getSystemInfoSync().pixelRatio;
        var canvasWidth = res[0].width;
        var canvasHeight = res[0].height;

        var ctx = canvasNode.getContext('2d');

        var canvas = new _wxCanvas2.default(ctx, _this2.data.canvasId, true, canvasNode);
        _this2.data.echarts.setCanvasCreator(function () {
          return canvas;
        });

        if (typeof callback === 'function') {
          _this2.chart = callback(canvas, canvasWidth, canvasHeight, canvasDpr);
        } else if (_this2.data.ec && typeof _this2.data.ec.onInit === 'function') {
          _this2.chart = _this2.data.ec.onInit(canvas, canvasWidth, canvasHeight, canvasDpr);
        } else {
          _this2.triggerEvent('init', {
            canvas: canvas,
            width: canvasWidth,
            height: canvasHeight,
            dpr: canvasDpr
          });
        }
      });
    },
    canvasToTempFilePath: function canvasToTempFilePath(opt) {
      var _this3 = this;

      if (this.data.isUseNewCanvas) {
        // 新版
        var query = wx.createSelectorQuery().in(this);
        query.select('.ec-canvas').fields({ node: true, size: true }).exec(function (res) {
          var canvasNode = res[0].node;
          opt.canvas = canvasNode;
          wx.canvasToTempFilePath(opt);
        });
      } else {
        // 旧的
        if (!opt.canvasId) {
          opt.canvasId = this.data.canvasId;
        }
        ctx.draw(true, function () {
          wx.canvasToTempFilePath(opt, _this3);
        });
      }
    },
    touchStart: function touchStart(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousedown', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'start');
      }
    },
    touchMove: function touchMove(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'change');
      }
    },
    touchEnd: function touchEnd(e) {
      if (this.chart) {
        var touch = e.changedTouches ? e.changedTouches[0] : {};
        var handler = this.chart.getZr().handler;
        handler.dispatch('mouseup', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.dispatch('click', {
          zrX: touch.x,
          zrY: touch.y
        });
        handler.processGesture(wrapTouch(e), 'end');
      }
    }
  }
});

function wrapTouch(event) {
  for (var i = 0; i < event.touches.length; ++i) {
    var touch = event.touches[i];
    touch.offsetX = touch.x;
    touch.offsetY = touch.y;
  }
  return event;
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WxCanvas = function () {
  function WxCanvas(ctx, canvasId, isNew, canvasNode) {
    _classCallCheck(this, WxCanvas);

    this.ctx = ctx;
    this.canvasId = canvasId;
    this.chart = null;
    this.isNew = isNew;
    if (isNew) {
      this.canvasNode = canvasNode;
    } else {
      this._initStyle(ctx);
    }

    // this._initCanvas(zrender, ctx);

    this._initEvent();
  }

  WxCanvas.prototype.getContext = function getContext(contextType) {
    if (contextType === '2d') {
      return this.ctx;
    }
  };

  // canvasToTempFilePath(opt) {
  //   if (!opt.canvasId) {
  //     opt.canvasId = this.canvasId;
  //   }
  //   return wx.canvasToTempFilePath(opt, this);
  // }

  WxCanvas.prototype.setChart = function setChart(chart) {
    this.chart = chart;
  };

  WxCanvas.prototype.attachEvent = function attachEvent() {
    // noop
  };

  WxCanvas.prototype.detachEvent = function detachEvent() {
    // noop
  };

  WxCanvas.prototype._initCanvas = function _initCanvas(zrender, ctx) {
    zrender.util.getContext = function () {
      return ctx;
    };

    zrender.util.$override('measureText', function (text, font) {
      ctx.font = font || '12px sans-serif';
      return ctx.measureText(text);
    });
  };

  WxCanvas.prototype._initStyle = function _initStyle(ctx) {
    var _arguments = arguments;

    var styles = ['fillStyle', 'strokeStyle', 'globalAlpha', 'textAlign', 'textBaseAlign', 'shadow', 'lineWidth', 'lineCap', 'lineJoin', 'lineDash', 'miterLimit', 'fontSize'];

    styles.forEach(function (style) {
      Object.defineProperty(ctx, style, {
        set: function set(value) {
          if (style !== 'fillStyle' && style !== 'strokeStyle' || value !== 'none' && value !== null) {
            ctx['set' + style.charAt(0).toUpperCase() + style.slice(1)](value);
          }
        }
      });
    });

    ctx.createRadialGradient = function () {
      return ctx.createCircularGradient(_arguments);
    };
  };

  WxCanvas.prototype._initEvent = function _initEvent() {
    var _this = this;

    this.event = {};
    var eventNames = [{
      wxName: 'touchStart',
      ecName: 'mousedown'
    }, {
      wxName: 'touchMove',
      ecName: 'mousemove'
    }, {
      wxName: 'touchEnd',
      ecName: 'mouseup'
    }, {
      wxName: 'touchEnd',
      ecName: 'click'
    }];

    eventNames.forEach(function (name) {
      _this.event[name.wxName] = function (e) {
        var touch = e.touches[0];
        _this.chart.getZr().handler.dispatch(name.ecName, {
          zrX: name.wxName === 'tap' ? touch.clientX : touch.x,
          zrY: name.wxName === 'tap' ? touch.clientY : touch.y
        });
      };
    });
  };

  _createClass(WxCanvas, [{
    key: 'width',
    set: function set(w) {
      if (this.canvasNode) this.canvasNode.width = w;
    },
    get: function get() {
      if (this.canvasNode) return this.canvasNode.width;
      return 0;
    }
  }, {
    key: 'height',
    set: function set(h) {
      if (this.canvasNode) this.canvasNode.height = h;
    },
    get: function get() {
      if (this.canvasNode) return this.canvasNode.height;
      return 0;
    }
  }]);

  return WxCanvas;
}();

exports.default = WxCanvas;

/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map