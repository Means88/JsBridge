//notation: js file can only use this kind of comments
//since comments will cause error when use in webview.loadurl,
//comments will be remove by java use regexp
if (!window.WebViewJavascriptBridgeClass) {

  class WebViewJavascriptBridgeClass {

    constructor(options) {
      this.messagingIframe = null;
      this.sendMessageQueue = [];
      this.receiveMessageQueue = [];
      this.messageHandlers = {};
      this.responseCallbacks = {};
      this.uniqueId = 1;

      this.CUSTOM_PROTOCOL_SCHEMA = options.CUSTOM_PROTOCOL_SCHEMA || 'schema';
      this.QUEUE_HAS_MESSAGE = options.QUEUE_HAS_MESSAGE || '__QUEUE_MESSAGE__/';

      //sendMessage add message, 触发native处理 sendMessage
      this._doSend = (message, responseCallback) => {
        if (responseCallback) {
          const callbackId = 'cb_' + (this.uniqueId++) + '_' + new Date().getTime();
          this.responseCallbacks[callbackId] = responseCallback;
          message.callbackId = callbackId;
        }

        this.sendMessageQueue.push(message);
        this.messagingIframe.src = this.CUSTOM_PROTOCOL_SCHEMA + '://' + this.QUEUE_HAS_MESSAGE;
      };

      // 提供给native调用,该函数作用:获取sendMessageQueue返回给native,由于android不能直接获取返回的内容,所以使用url shouldOverrideUrlLoading 的方式返回内容
      this._fetchQueue = () => {
        const messageQueueString = JSON.stringify(this.sendMessageQueue);
        this.sendMessageQueue = [];
        //android can't read directly the return data, so we can reload iframe src to communicate with java
        this.messagingIframe.src = this.CUSTOM_PROTOCOL_SCHEMA + '://return/_fetchQueue/' + encodeURIComponent(messageQueueString);
      };

      //提供给native使用,
      this._dispatchMessageFromNative = (messageJSON) => {
        const doSend = this._doSend;
        setTimeout(() => {
          const message = JSON.parse(messageJSON);
          let responseCallback;
          //java call finished, now need to call js callback function
          if (message.responseId) {
            responseCallback = this.responseCallbacks[message.responseId];
            if (!responseCallback) {
              return;
            }
            responseCallback(message.responseData);
            delete this.responseCallbacks[message.responseId];
          } else {
            //直接发送
            if (message.callbackId) {
              const callbackResponseId = message.callbackId;
              responseCallback = function (responseData) {
                doSend({
                  responseId: callbackResponseId,
                  responseData: responseData
                });
              };
            }

            let handler = this._messageHandler;
            if (message.handlerName) {
              handler = this.messageHandlers[message.handlerName];
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
      };

      //提供给native调用,receiveMessageQueue 在会在页面加载完后赋值为null,所以
      this._handleMessageFromNative = (messageJSON) => {
        console.log(messageJSON);
        if (this.receiveMessageQueue && this.receiveMessageQueue.length > 0) {
          this.receiveMessageQueue.push(messageJSON);
        } else {
          this._dispatchMessageFromNative(messageJSON);
        }
      };

      setTimeout(() => {
        this._createQueueReadyIframe(document);
        var readyEvent = document.createEvent('Events');
        readyEvent.initEvent('WebViewJavascriptBridgeReady');
        readyEvent.bridge = this;
        document.dispatchEvent(readyEvent);
      });
    }

    _createQueueReadyIframe(doc) {
      this.messagingIframe = doc.createElement('iframe');
      this.messagingIframe.style.display = 'none';
      doc.documentElement.appendChild(this.messagingIframe);
    };

    //set default messageHandler
    init(messageHandler) {
      if (this._messageHandler) {
        throw new Error('WebViewJavascriptBridge.init called twice');
      }

      this._messageHandler = messageHandler;
      let receivedMessages = this.receiveMessageQueue;
      this.receiveMessageQueue = null;
      for (let i = 0; i < receivedMessages.length; i++) {
        this._dispatchMessageFromNative(receivedMessages[i]);
      }
    }

    send(data, responseCallback) {
      this._doSend({
        data: data
      }, responseCallback);
    }

    registerHandler(handlerName, handler) {
      this.messageHandlers[handlerName] = handler;
    }

    callHandler(handlerName, data, responseCallback) {
      this._doSend({
        handlerName: handlerName,
        data: data
      }, responseCallback);
    }
  }

  window.WebViewJavascriptBridgeClass = WebViewJavascriptBridgeClass;
}