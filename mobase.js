/**
 * @title a simple lib for mobile application in namespace M *
 * @notice namespace can be changed in your own ways *
 * @author quenteenfix@gmail.com *
 * @date 2014-01-09
 */
(function(exports) {
    var MOCT, M, mb = MOCT = M = M || {
        version : '1.0'
    };

    // init domain by itself right away
    M.host = function(window, document, undefined) {
        var protocol = 'http';
        var host = 'www.baidu.com';
        var root = '/quenteen';
        var base_url = 'http://wwww.baidu.com/quenteen/';

        function setHost() {
            var loc = window.location;
            host = loc.host || document.domain;
            protocol = loc.protocol;
            var path_name = loc.pathname.substring(1);
            root = '/' + (path_name === '' ? '' : path_name.substring(0, path_name.indexOf('/')));
            base_url = protocol + '://' + host + root + '/';
        }

        function init() {
            setHost();
        }

        init();// init all

        return {
            protocol : protocol,
            host : host,
            root : root,
            base_url : base_url
        };
    }(window, document);

    /**
     * tools
     */
    M.util = function() {
        function browser() {
            var u = navigator.userAgent, app = navigator.appVersion;
            return {// 移动终端浏览器版本信息
                trident : u.indexOf('Trident') > -1, // IE内核
                presto : u.indexOf('Presto') > -1, // opera内核
                webkit : u.indexOf('AppleWebKit') > -1, // 苹果、谷歌内核
                gecko : u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, // 火狐内核
                mobile : !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/), // 是否为移动终端
                ios : !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), // ios终端
                android : u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, // android终端或者uc浏览器
                iphone : u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, // 是否为iPhone或者QQHD浏览器
                ipad : u.indexOf('iPad') > -1, // 是否iPad
                webapp : u.indexOf('Safari') == -1,// 是否web应该程序，没有头部与底部
                google : u.indexOf('Chrome') > -1,
                version : app
            };
        }

        function popup() {
            var base_config = {
                notice : '',
                button : '',
                height : 360,
                width : 260,
                top : 50,
                is_bg_close : false,// 是否点击浮层后关闭弹出框：true-关闭 false-不关闭
                is_border : true,// 是否有边框
                to : ''
            };
            if (typeof (arguments[0]) == 'object') {
                var config = arguments[0];
                for ( var key in config) {
                    base_config[key] = config[key];
                }
            }
            var popup_arr = [];
            popup_arr.push('<div class="popup-wrapper">');
            popup_arr.push('<div class="popup">');
            popup_arr.push('<div class="popup-bg">');
            popup_arr.push('<div class="popup-title">');
            popup_arr.push('<a class="close" href="javascript:;">×</a>');
            popup_arr.push('</div>');
            popup_arr.push('<div class="popup-content">');
            popup_arr.push('<div class="popup-notice" id="popup_notice"></div>');
            popup_arr.push('<div id="popup_button"></div>');
            popup_arr.push('</div>');
            popup_arr.push('</div>');
            popup_arr.push('</div>');
            popup_arr.push('</div>');
            var popup_html = popup_arr.join('');
            $('body').append(popup_html);
            $('body').append('<div class="popup-mask"></div>');
            $('#popup_notice').html(base_config['notice']);
            $('#popup_button').html(base_config['button']);

            var top = base_config['top'];
            var height = base_config['height'];
            var width = base_config['width'];
            var margin_left = 0 - (width / 2);
            $('.popup').css({
                'height' : height + 10,
                'width' : width + 10,
                'margin-left' : margin_left,
                'top' : top
            });
            /*
             * $('.popup-bg').css({ 'height' : height, 'width' : width });
             */

            if (base_config['is_bg_close']) {
                $('.popup-mask').on('click', function() {
                    hidePopup();
                });
            }

            if (base_config['is_border']) {
                $('.popup').css('border', '3px solid #dbdbdb');
            }

            $('.popup .close').on('click', function(event) {
                hidePopup();
            });
            $('.popup-wrapper').show();
            $('.popup-mask').animate({
                opacity : 0.6
            }, 0);
        }

        function hidePopup() {
            $('.popup-wrapper').remove();
            $('.popup-mask').remove();
        }

        //异步执行队列，可用于异步执行，并实时输出结果：M.util.ayncQueue.add(function(){}).add(500).run();
        var ayncQueue = function() {
            var queue = [];

            function add(target){
                if(!/function|number/.test(typeof target)){
                    return;
                }
                queue.push(target);
                return this;
            }

            function run(){
                var source = queue.shift();
                if(!source){
                    return;
                }
                if(typeof source == 'function'){
                    source();
                    run();
                }else{
                    setTimeout(function(){
                        run();
                    }, source);
                }
            }

            return {
                add: add,
                run: run
            };
        }();

        return {
            browser : browser,
            popup : popup,
            hidePopup : hidePopup,
            ayncQueue: ayncQueue
        };
    }();

    /**
     * auto complete the textarea on changing through ajax
     */
    M.auto = function() {
        var xhr_cnt = 0;
        var xhr_arr = [];
        var fill_tpl = '<div class="fill-item#deep" data-uuap="#user_name">#cn_name,[#email],#dpt</div>';

        function fill(config) {
            var xhr_url = config['xhr_url'];
            var dom = config['dom'];
            var replace_kv = config['replace_kv'];
            fill_tpl = config['tpl'] || fill_tpl;

            // abort last xhr in order to reduce invalid http request
            if (xhr_cnt > 0) {
                xhr_arr[xhr_cnt - 1].abort();
            }

            var render_results = [];
            var xhr_vo = $.get(xhr_url, function(response) {
                var data = eval('(' + response + ')');
                var vo = null, exe_tpl = null, is_deep = null, regex = null;
                for ( var ind in data) {
                    vo = data[ind];
                    exe_tpl = fill_tpl;
                    is_deep = parseInt(ind, 10) % 2 == 1 ? '' : ' deep';

                    for ( var key in replace_kv) {
                        regex = new RegExp(key, 'g');
                        exe_tpl = exe_tpl.replace(regex, replace_kv[key]);
                    }

                    render_results.push(exe_tpl);
                }

                // render target dom
                $(dom).html(render_results.join(''));
            });

            xhr_cnt++;
            xhr_arr.push(xhr_vo);
        }

        return {
            fill : fill
        };
    }();

    M.browser = {};
    M.base = {};
    /**
     * Initialization Entrace define a function and execute it, so the function
     * will be exist and other object will be init.
     */
    M.base.start = function() {
        M.browser = M.util.browser();
    }();

    // you can change the global invoked var here
    exports.M = M;
})(window);
