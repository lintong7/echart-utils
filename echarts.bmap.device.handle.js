/*!
 * 百度地图 封装类
 * https://github.com/lintong7
 *
 * Copyright 2019-2020 Tong Lin
 * Released under the MIT license
 *
 * Date: 2020-08-05 19:21:45
 */
;(function (window) {
    let m = {};
    let el, x, y;
    //实例化百度地图
    m.mapInit = params => {
        el = params.hasOwnProperty('id') ? params.id : 'allmap';
        x = params.x;
        y = params.y;
        m.map = new BMap.Map(el);
        m.point = new BMap.Point(x, y);

        m.map.centerAndZoom(m.point, 12);
        m.map.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放
    };

    //实例化Echarts
    m.echartsInit = params => {
        m.normalDevices = params.normalDevices;
        m.alarmDevices = params.alarmDevices;

        m.mapChart = echarts.init(document.getElementById(el));
        let option = {
            bmap: {center: [x, y], zoom: 14, roam: true},
            series: [
                {
                    name: '正常设备',
                    type: 'scatter',
                    symbolSize: 22,
                    data: convertData(params.normalDevices),

                    coordinateSystem: 'bmap',
                    symbol: "image:///map/marker_blue_sprite.png",
                    hoverAnimation: true,
                    avoidLabelOverlap: true,
                    label: {
                        normal: {
                            formatter: '{b}',
                            distance: 3,
                            backgroundColor: '#fff',
                            borderWidth: 1,
                            borderColor: '#4990e2',
                            padding: 5,
                            fontFamily: 'PingFangSC-Regular, sans-serif',
                            fontSize: 13,
                            fontWeight: 'bold',
                            position: 'top',
                            show: true
                        }
                    },
                    itemStyle: {fontSize: 25, color: '#4990e2', shadowBlur: 5, shadowColor: '#333'},
                    zlevel: 99999
                },
                {
                    name: '报警设备',
                    type: 'effectScatter',  // 涟漪散点图
                    symbolSize: 25,
                    data: convertData(params.alarmDevices),

                    coordinateSystem: 'bmap',
                    symbol: "image:///map/marker_red_sprite.png",
                    hoverAnimation: true,
                    avoidLabelOverlap: true,
                    label: {
                        normal: {
                            formatter: '{b}',
                            distance: 3,
                            backgroundColor: '#fff',
                            borderWidth: 1,
                            borderColor: '#ff0000',
                            padding: 5,
                            fontFamily: 'PingFangSC-Regular, sans-serif',
                            fontSize: 13,
                            fontWeight: 'bold',
                            position: 'top',
                            show: true
                        }
                    },
                    itemStyle: {color: '#ff0000', shadowBlur: 5, shadowColor: '#333'},
                    zlevel: 99999
                }
            ]
        };
        m.mapChart.setOption(option);

        m.mapChart.on('click', function (params) {
            // TODO
        });
        //地图缩放 事件
        m.map.addEventListener('zoomend', function () {
            //当前 地图缩放级别
            let curr_zoom = m.map.getZoom();
            // 更新地图
            const option = m.mapChart.getOption();

            if (curr_zoom == 12) {
                option.series[0].symbolSize = 22;
                option.series[1].symbolSize = 25;
            } else {
                option.series[0].symbolSize = 22 * (curr_zoom / 14) / 1.2;
                option.series[1].symbolSize = 25 * (curr_zoom / 14) / 1.2;
            }

            //修改label样式
            option.series[0]['label'].fontSize = 14 * (curr_zoom / 14) / 1.2;
            option.series[1]['label'].fontSize = 14 * (curr_zoom / 14) / 1.2;
            option.series[0]['label'].padding = 5 * (curr_zoom / 14) / 1.2;
            option.series[1]['label'].padding = 5 * (curr_zoom / 14) / 1.2;

            m.mapChart.setOption(option);
        });
    };

    //添加设备（正常、报警）
    m.addDevices = res => {
        let deviceid = res.deviceid;
        let lnid = res.desired.arrays[0].device.id;
        let alarm_erro = res.desired.arrays[0].status[0].error;

        let normalDevices = m.normalDevices;
        let alarmDevices = m.alarmDevices;

        // 移除 正常设备 数组中的数据（如果有）
        normalDevices.every((item, key) => {
            if (item.deviceid == deviceid) {
                //删除指定下标的数据
                normalDevices.splice(key, 1);
                return false;
            } else {
                return true;
            }
        });

        // 查找旧数据中该设备的下标，查找不到，返回null
        let existDeviceIndex = null;
        Object.keys(alarmDevices).forEach(key => {
            if (alarmDevices[key].deviceid == deviceid) {
                existDeviceIndex = key;
                return false;
            }
        });

        //获取报警设备信息
        getAjaxJsonByAsync('/ceoadmin/smartdevice.devices/getDevice', {deviceid, lnid}, 'post').then(result => {
            if (result.subDevice == null || result.device.latitude == '' || result.device.longitude == '') {
                console.log('暂无数据');
                return false;
            }

            let tempObj = {alarm_erro, "ln": result.subDevice.ln};
            //该设备是否已存在报警设备数组中
            if (existDeviceIndex) {
                handleDevicesObj = alarmDevices[existDeviceIndex];
                let alarm_erro_obj = handleDevicesObj.alarm_erro;
                //是否有相同lnid
                if (alarm_erro_obj.hasOwnProperty(lnid)) {
                    alarm_erro_obj[lnid].push(tempObj);
                    alarm_erro_obj[lnid] = _util.array.unique(alarm_erro_obj[lnid]);    // 去重
                } else {
                    alarm_erro_obj[lnid] = [tempObj];
                }
            } else {
                //过滤掉经纬度为空的报警数据
                if (result.subDevice != null && result.device.latitude != '' && result.device.longitude != '') {
                    let temp_alarm_erro = {};
                    temp_alarm_erro[lnid] = [tempObj];

                    alarmDevices.push({
                        deviceid,
                        title: result.device.title,
                        latitude: result.device.latitude,
                        longitude: result.device.longitude,
                        alarm_erro: temp_alarm_erro
                    });
                }
            }

            // 更新地图
            const option = m.mapChart.getOption();

            option.series[0].data = convertData(normalDevices);
            option.series[1].data = convertData(alarmDevices);

            m.mapChart.setOption(option);
        });

    }

    //添加版权
    m.addCopyRight = (title, param = {}) => {
        let cr = new BMap.CopyrightControl({
            anchor: BMAP_ANCHOR_TOP_RIGHT,
            offset: new BMap.Size(0, 13),
        });   //设置版权控件位置
        m.map.addControl(cr); //添加版权控件
        let bs = m.map.getBounds();   //返回地图可视区域
        cr.addCopyright({
            id: 1,
            content: `<span style='color: #1E9FFF;font-size:20px;padding:10px;background:white;'>${title}</span>`,
            bounds: bs,
        });
        //Copyright(id,content,bounds)类作为CopyrightControl.addCopyright()方法的参数
    }

    //处理地图的数据
    convertData = (data) => {
        let res = [];
        for (let i = 0; i < data.length; i++) {
            let latitude = data[i].latitude;
            let longitude = data[i].longitude;
            if (latitude != '' && longitude != '') {
                let temp = {
                    name: data[i].title,
                    value: [latitude, longitude],
                    deviceid: data[i].deviceid,
                    alarm_erro: data[i].alarm_erro != '' ? data[i].alarm_erro : {}
                };
                res.push(temp);
            }
        }
        return res;
    };

    //判断浏览区是否支持canvas
    isSupportCanvas = () => {
        let elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    /**
     * 处理经纬度二维数组
     * @param arr 传入数组
     * @returns {[]}
     */
    pointDeal = arr => {
        let points = [];
        for (let i = 0; i < arr.length; i++) {
            points.push(new BMap.Point(arr[i]['lat'], arr[i]['lng']));
        }
        return points;
    };

    /**
     * 获取字符串长度（中文+1，其他加0.5）
     * @param string
     * @returns {number}
     */
    getByteLength = string => {
        let len = 0;
        for (let i = 0; i < string.length; i++) {
            len += string.charAt(i).match(/[^\x00-\xff]/ig) != null ? 1 : 0.5;
        }
        return len;
    }
    window._bmapEcharts = m;
})(window)
