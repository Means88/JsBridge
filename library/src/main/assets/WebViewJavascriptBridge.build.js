'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//notation: js file can only use this kind of comments
//since comments will cause error when use in webview.loadurl,
//comments will be remove by java use regexp
if (!window.WebViewJavascriptBridgeClass) {
  var WebViewJavascriptBridgeClass = function () {
    function WebViewJavascriptBridgeClass(options) {
      var _this = this;

      _classCallCheck(this, WebViewJavascriptBridgeClass);

      this.messagingIframe = null;
      this.sendMessageQueue = [];
      this.receiveMessageQueue = [];
      this.messageHandlers = {};
      this.responseCallbacks = {};
      this.uniqueId = 1;

      this.CUSTOM_PROTOCOL_SCHEMA = options.CUSTOM_PROTOCOL_SCHEMA || 'schema';
      this.QUEUE_HAS_MESSAGE = options.QUEUE_HAS_MESSAGE || '__QUEUE_MESSAGE__/';

      setTimeout(function () {
        _this._createQueueReadyIframe(document);
        var readyEvent = document.createEvent('Events');
        readyEvent.initEvent('WebViewJavascriptBridgeReady');
        readyEvent.bridge = _this;
        document.dispatchEvent(readyEvent);
      });
    }

    _createClass(WebViewJavascriptBridgeClass, [{
      key: '_createQueueReadyIframe',
      value: function _createQueueReadyIframe(doc) {
        this.messagingIframe = doc.createElement('iframe');
        this.messagingIframe.style.display = 'none';
        doc.documentElement.appendChild(this.messagingIframe);
      }
    }, {
      key: 'init',


      //set default messageHandler
      value: function init(messageHandler) {
        if (this._messageHandler) {
          throw new Error('WebViewJavascriptBridge.init called twice');
        }

        this._messageHandler = messageHandler;
        var receivedMessages = this.receiveMessageQueue;
        this.receiveMessageQueue = null;
        for (var i = 0; i < receivedMessages.length; i++) {
          this._dispatchMessageFromNative(receivedMessages[i]);
        }
      }
    }, {
      key: 'send',
      value: function send(data, responseCallback) {
        this._doSend({
          data: data
        }, responseCallback);
      }
    }, {
      key: 'registerHandler',
      value: function registerHandler(handlerName, handler) {
        this.messageHandlers[handlerName] = handler;
      }
    }, {
      key: 'callHandler',
      value: function callHandler(handlerName, data, responseCallback) {
        this._doSend({
          handlerName: handlerName,
          data: data
        }, responseCallback);
      }

      //sendMessage add message, 触发native处理 sendMessage

    }, {
      key: '_doSend',
      value: function _doSend(message, responseCallback) {
        if (responseCallback) {
          var callbackId = 'cb_' + this.uniqueId++ + '_' + new Date().getTime();
          this.responseCallbacks[callbackId] = responseCallback;
          message.callbackId = callbackId;
        }

        this.sendMessageQueue.push(message);
        this.messagingIframe.src = this.CUSTOM_PROTOCOL_SCHEMA + '://' + this.QUEUE_HAS_MESSAGE;
      }

      // 提供给native调用,该函数作用:获取sendMessageQueue返回给native,由于android不能直接获取返回的内容,所以使用url shouldOverrideUrlLoading 的方式返回内容

    }, {
      key: '_fetchQueue',
      value: function _fetchQueue() {
        var messageQueueString = JSON.stringify(this.sendMessageQueue);
        this.sendMessageQueue = [];
        //android can't read directly the return data, so we can reload iframe src to communicate with java
        this.messagingIframe.src = this.CUSTOM_PROTOCOL_SCHEMA + '://return/_fetchQueue/' + encodeURIComponent(messageQueueString);
      }

      //提供给native使用,

    }, {
      key: '_dispatchMessageFromNative',
      value: function _dispatchMessageFromNative(messageJSON) {
        var _this2 = this;

        var doSend = this._doSend;
        setTimeout(function () {
          var message = JSON.parse(messageJSON);
          var responseCallback = void 0;
          //java call finished, now need to call js callback function
          if (message.responseId) {
            responseCallback = _this2.responseCallbacks[message.responseId];
            if (!responseCallback) {
              return;
            }
            responseCallback(message.responseData);
            delete _this2.responseCallbacks[message.responseId];
          } else {
            //直接发送
            if (message.callbackId) {
              (function () {
                var callbackResponseId = message.callbackId;
                responseCallback = function responseCallback(responseData) {
                  doSend({
                    responseId: callbackResponseId,
                    responseData: responseData
                  });
                };
              })();
            }

            var handler = _this2._messageHandler;
            if (message.handlerName) {
              handler = _this2.messageHandlers[message.handlerName];
            }
            //查找指定handler
            try {
              handler(message.data, responseCallback);
            } catch (exception) {
              if (typeof console != 'undefined') {
                console.log("WebViewJavascriptBridge: WARNING: javascript handler threw." + message.data + exception);
              }
            }
          }
        });
      }

      //提供给native调用,receiveMessageQueue 在会在页面加载完后赋值为null,所以

    }, {
      key: '_handleMessageFromNative',
      value: function _handleMessageFromNative(messageJSON) {
        console.log(messageJSON);
        if (this.receiveMessageQueue && this.receiveMessageQueue.length > 0) {
          this.receiveMessageQueue.push(messageJSON);
        } else {
          this._dispatchMessageFromNative(messageJSON);
        }
      }
    }]);

    return WebViewJavascriptBridgeClass;
  }();

  window.WebViewJavascriptBridgeClass = WebViewJavascriptBridgeClass;
}

//# sourceMappingURL=WebViewJavascriptBridge.build.js.map