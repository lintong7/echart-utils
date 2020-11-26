/*!
 * K线图 Echarts封装类
 * https://github.com/lintong7
 *
 * Copyright 2019-2020 Tong Lin
 * Released under the MIT license
 *
 * Date: 2020-09-17 09:08:41
 */
;(window => {
    let b = {};
    let el;
    // echarts实例化
    b.init = params => {
        el = params.hasOwnProperty('id') ? params.id : 'myChart';
        b.myChart = echarts.init(document.getElementById(el));

        let title = params.title;
        let series = params.series;

        let option = {
            title: {
                text: title,
                left: 'center',
                marginBottom: 130,
                textStyle: {fontWeight: 'normal', fontSize: 22}
            },
            xAxis: {
                type: 'category',
                axisTick: {show: false},
                data: params.xAxis.data,
                name: params.xAxis.title,
                axisLabel: {},
            },
            yAxis: {type: 'value', name: params.yAxis.title},
            grid: {
                top: 70,
            },
            series
        };

        //自定义X轴
        if (params.xAxis.hasOwnProperty('axisLabel')) {
            option.xAxis.axisLabel = {...params.xAxis.axisLabel, ...option.xAxis.axisLabel};
        }
        //自定义 图例组件
        if (params.hasOwnProperty('legend')) {
            option.legend = {
                ...params.legend,
                top: 10,
                itemWidth: 40,
                itemHeight: 20,
                itemGap: 18,
                textStyle: {
                    fontSize: 14,
                }
            }
        }
        b.myChart.clear();
        b.myChart.setOption(option);
    };

    // 处理series
    b.convertSeries = (seriesData) => {
        let series = [];
        Object.values(seriesData).forEach(item => {
            series.push({
                name: item.name,
                type: 'bar',
                data: item.data,
                label: {
                    show: true,
                    position: 'top'
                },
            });
        });
        return series;
    }

    window._barEcharts = b;
})(window)