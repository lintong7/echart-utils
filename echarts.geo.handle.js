/*!
 * Echarts中国地图 省市区联动 封装类
 * https://github.com/lintong7
 *
 * Copyright 2019-2020 Tong Lin
 * Released under the MIT license
 *
 * Date: 2020-08-10 10:34:37
 */
;(window => {
    //let publicUrl = 'https://geo.datav.aliyun.com/areas_v2/bound/';
    let localUrl = '/map/datav/';
    let g = {};
    let myChart;
    g.target;
    g.alladcode = {};
    g.params;

    //实例化
    g.init = params => {
        //获取全国地区的坐标数据
        g.params = params;
        g.alladcode = {} ? g.alladcode = params.alladcode : null;
        g.target = params.target;

        myChart = echarts.init(params.id);

        //带搜索
        if (params.mapType != 'china') {
            g.updateMap(params.mapType, params.target);
        }

        //基础配置
        g.option = {
            title: {
                text: params.title,
                subtext: formatSubTitle(params.date.start_date, params.date.end_date),
                left: 'center',
                top: 58,
                textStyle: {fontWeight: 'normal', fontSize: 24}
            },
            visualMap: {
                inRange: {color: ['#cecece', '#96d2f6', '#a0cfad', '#f1aac8', '#dddf4e', '#acca4e', '#f9b041', '#ec6e3c']},
                type: 'piecewise', //类型为分段型
                pieces: [
                    {min: 1, max: 10},
                    {min: 10, max: 30},
                    {min: 30, max: 50},
                    {min: 50, max: 70},
                    {min: 70, max: 90},
                    {min: 90, max: 110},
                    {min: 110, max: 130},
                    {min: 130}
                ], //自定义『分段式视觉映射组件（visualMapPiecewise）』的每一段的范围，以及每一段的文字，以及每一段的特别的样式。
                inverse: true, //是否反转。
                itemWidth: 40, //图形的宽度，即每个小块的宽度。
                itemHeight: 20, //图形的高度，即每个小块的高度。
                left: 50, //visualMap 组件离容器左侧的距离。
                bottom: 50,
                text: ["单位：" + (params.unit ? params.unit : '个')], //两端的文本，如['High', 'Low']。兼容 ECharts2，当有 text 时，label不显示。
                showLabel: true, //是否显示每项的文本标签。默认情况是，如果 visualMap-piecewise.text 被使用则不显示文本标签，否则显示。
                show: true,
            },
            series: convertData(params.seriesData)
        };
        // 监听屏幕变化自动缩放图表
        window.addEventListener('resize', function () {
            myChart.resize();
        });
        myChart.setOption(g.option);
        //解绑click事件
        myChart.off('click');
        //给地图添加监听事件
        myChart.on('click', function (e) {
            let mapType = e.name; //要进入的区域名称：地图包名称（中文），比如：广东，深圳，宝安区
            let target = g.target;
            g.updateMap(mapType, target);
        });
    };

    //点击地图、URL指定地图更新地图
    g.updateMap = (mapType, target) => {
        //市级地图
        if (target === "province" || target == '') {
            //console.log('进入省级地图');
            const provinces = [
                'shanghai', 'hebei', 'shanxi', 'neimenggu', 'liaoning', 'jilin', 'heilongjiang',
                'jiangsu', 'zhejiang', 'anhui', 'fujian', 'jiangxi', 'shandong', 'henan', 'hubei',
                'hunan', 'guangdong', 'guangxi', 'hainan', 'sichuan', 'guizhou', 'yunnan',
                'xizang', 'shanxi1', 'gansu', 'qinghai', 'ningxia', 'xinjiang', 'beijing', 'tianjin',
                'chongqing', 'xianggang', 'aomen', 'taiwan'
            ];
            const provincesText = [
                '上海', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建',
                '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '四川', '贵州', '云南', '西藏',
                '陕西', '甘肃', '青海', '宁夏', '新疆', '北京', '天津', '重庆', '香港', '澳门', '台湾'
            ];

            let index = provincesText.indexOf(mapType);
            let province_map_name = provinces[index]; // ehcarts省级地图包js
            target = target == '' ? 'province' : target;
            return showMap({'url': g.params.url, province_map_name, mapType, target});
        }
        //市级地图
        else if (target === 'city') {
            //console.log('进入市级地图');
        }
        //区镇地图
        else if (target === 'area') {
            //console.log('进入区镇地图');
        } else if (target === 'town' || target === 'china') {
            //console.log('进入街道地图');
            //由于没有街道地图，直接跳转回中国地图
            //showMap({'mapType': 'china', target: ''}, 'china');
            return false;//没有下一级了，不响应
        }

        let alladcode = g.alladcode;
        let clickRegionCode = alladcode.filter(areaJson => areaJson.name === mapType)[0].adcode;
        showMap({clickRegionCode, mapType, target}, 'datav');
    }

    //获取地图json数据
    g.getGeoJson = async jsonName => {
        return await $.get(localUrl + jsonName);
    }

    //展示对应的地图，并异步获取重新加载新的数据
    const showMap = (show_param, map_type = 'province') => {
        //后台获取要打开的地图数据
        return new Promise(resolve => {
            const data = {
                'mapType': show_param.mapType,
                'target': show_param.target,
                'start': g.params.date.start_date,
                'end': g.params.date.end_date
            }
            $.post(show_param.url, data, function (res) {
                resolve(res);
            });
        }).then(result => {
            result = JSON.parse(result);
            g.target = result.target; // 更新当前的区域级别
            g.params.count = result.count; // 更新当前的总数
            const params = {
                count: result.count,
                target: show_param.target,
                mapType: show_param.mapType,
                title: result.title, // 必选项
                map_title: result.map_title, // 必选项
                unit: result.unit, // 选填，默认值：个
                seriesData: result.seriesData, // 必选项
            };
            if (map_type == 'china') {
                $.getScript(`/map/china.js`, function () {
                    setShowMapOption(params);
                });
            }
            if (map_type == 'province') {
                $.getScript(`/map/${show_param.target}/${show_param.province_map_name}.js`, function () {
                    setShowMapOption(params);
                });
            } else if (map_type == 'datav') {
                g.getGeoJson(show_param.clickRegionCode + '_full.json')
                    .then(
                        regionGeoJson => {
                            // 注册datav地图包
                            echarts.registerMap(show_param.mapType, regionGeoJson);
                            setShowMapOption(params);
                        }
                    )
                    .catch(err => {
                        console.log('捕获到JS异常');
                    });
            }
        });
    }

    //配置展开的新地图参数
    const setShowMapOption = (params) => {
        g.params.mapType = params.mapType;
        g.params.target = params.target;
        g.option.title.text = params.title;
        g.option.title.subtext = params.map_title;
        g.option.visualMap.text = ["单位：" + (params.unit ? params.unit : '个')];
        g.option.series = convertData(params.seriesData);
        myChart.setOption(g.option);
        //点击地图，触发自定义函数。存储当前展开地图的区域级别，以便查询日期时，准确找到该地图。
        g.params.hasOwnProperty('clickEvent') ? window[g.params.clickEvent].call(this) : null;
    }

    //处理数据
    const convertData = arr => {
        let data = [];
        for (let name in arr) {
            data.push({
                name,
                type: 'map',
                mapType: arr[name]['mapType'],
                //地图区域的多边形 图形样式
                itemStyle: {
                    //正常状态
                    normal: {
                        label: {
                            show: true,
                            fontWeight: 'bold',
                            //格式化标签名，隔行显示数据
                            formatter: function (params) {
                                let name = params.name + '\n';
                                if (g.params.target != 'area') {
                                    name += addChineseUnit(params.value ? params.value : 0, 2);
                                } else {
                                    name += g.params.count;
                                }
                                return name;
                            },
                        }
                    },
                    //高亮状态下的多边形和标签样式（鼠标聚焦时的区域颜色）
                    emphasis: {
                        label: {show: true}
                    }
                },
                data: arr[name]['data']
            });
        }
        return data;
    };

    //副标题（带筛选时间条件）
    const formatSubTitle = (start, end) => {
        let subTitle = "";
        if (start || end) {
            subTitle += "日期筛选：";
            start ? subTitle += start : null;
            end ? start ? subTitle += "至" + end : subTitle += end : null;
        }
        return subTitle;
    };

    /**
     * 为数字加上单位：万或亿
     * 例如：
     * 1000.01 => 1000.01
     * 10000 => 1万
     * 99000 => 9.9万
     * 444400000 => 4.44亿
     * @param {number} number 输入数字.
     * @param {number} decimalDigit 小数点后最多位数，默认为2
     * @return {string} 加上单位后的数字
     */
    const addChineseUnit = (number, decimalDigit) => {
        addWan = (integer, number, mutiple, decimalDigit) => {
            let digit = getDigit(integer);
            if (digit > 3) {
                let remainder = digit % 8;
                if (remainder >= 5) { // ‘十万’、‘百万’、‘千万’显示为‘万’
                    remainder = 4;
                }
                return Math.round(number / Math.pow(10, remainder + mutiple - decimalDigit)) / Math.pow(10, decimalDigit) + '万';
            } else {
                return Math.round(number / Math.pow(10, mutiple - decimalDigit)) / Math.pow(10, decimalDigit);
            }
        };
        getDigit = integer => {
            let digit = -1;
            while (integer >= 1) {
                digit++;
                integer = integer / 10;
            }
            return digit;
        }
        decimalDigit = decimalDigit == null ? 2 : decimalDigit;
        let integer = Math.floor(number);
        let digit = getDigit(integer);
        // ['个', '十', '百', '千', '万', '十万', '百万', '千万'];
        let unit = [];
        if (digit > 3) {
            let multiple = Math.floor(digit / 8);
            if (multiple >= 1) {
                let tmp = Math.round(integer / Math.pow(10, 8 * multiple));
                unit.push(addWan(tmp, number, 8 * multiple, decimalDigit));
                for (let i = 0; i < multiple; i++) {
                    unit.push('亿');
                }
                return unit.join('');
            } else {
                return addWan(integer, number, 0, decimalDigit);
            }
        } else {
            return number;
        }
    }

    window._geoEcharts = g;
})(window)
