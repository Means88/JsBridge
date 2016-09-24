var CustomJavascript = window.CustomJavascript = {

    testDiv: function () {
        document.getElementById("show").innerHTML = document.getElementsByTagName("html")[0].innerHTML;
    },

    testClick: function () {
        var str1 = document.getElementById("text1").value;
        var str2 = document.getElementById("text2").value;

        //send message to native
        var data = {id: 1, content: "这是一个图片 <img src=\"a.png\"/> test\r\nhahaha"};
        window.WebViewJavascriptBridge.send(
            data,
            function(responseData) {
                document.getElementById("show").innerHTML = "repsonseData from java, data = " + responseData
            }
        );
    },

    testClick1: function () {
        var str1 = document.getElementById("text1").value;
        var str2 = document.getElementById("text2").value;

        //call native method
        window.WebViewJavascriptBridge.callHandler(
            'submitFromWeb',
            {'param': '中文测试'},
            function(responseData) {
                document.getElementById("show").innerHTML = "send get responseData from java, data = " + responseData
            }
        );
    },

    bridgeLog: function (logContent) {
        document.getElementById("show").innerHTML = logContent;
    }

};

var readyEvent = document.createEvent('Events');
readyEvent.initEvent('CustomJavascriptReady');
document.dispatchEvent(readyEvent);