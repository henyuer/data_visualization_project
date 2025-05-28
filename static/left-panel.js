// static/left-panel.js

let chartFont, chartStele, chartPrint;
let allItems = [];
let selectedItemId = null; // 当前高亮的碑帖 ID

// 初始化图表实例
function initCharts() {
  chartFont = echarts.init(document.getElementById('chart-font-style'));
  chartStele = echarts.init(document.getElementById('chart-stele-dynasty'));
  chartPrint = echarts.init(document.getElementById('chart-print-dynasty'));
}

// 加载 items 数据
async function loadData() {
  try {
    const response = await fetch('/items');
    allItems = await response.json();
    renderAllCharts();
  } catch (err) {
    console.error('加载 items.json 失败:', err);
  }
}

// 将数据按分类整理为 scatter 点阵数据
function prepareScatterData(grouped) {
  const result = [];
  const categories = Object.keys(grouped);

  categories.forEach((cat, i) => {
    grouped[cat].forEach((item, j) => {
      result.push({
        value: [i, j],
        itemId: parseInt(item.id),
        itemName: item.name,
        category: cat
      });
    });
  });

  return { result, categories };
}

// 渲染所有图表
function renderAllCharts() {
  const fontMap = {};
  const steleMap = {};
  const printMap = {};

  allItems.forEach(item => {
    const font = item.calligraphyStyle || '未知';
    const stele = item.stele?.temporal || '未知';
    const print = item.temporal || '未知';

    if (!fontMap[font]) fontMap[font] = [];
    if (!steleMap[stele]) steleMap[stele] = [];
    if (!printMap[print]) printMap[print] = [];

    fontMap[font].push(item);
    steleMap[stele].push(item);
    printMap[print].push(item);
  });

  drawHexChart(chartFont, prepareScatterData(fontMap), '字体统计');
  drawHexChart(chartStele, prepareScatterData(steleMap), '碑帖朝代统计');
  drawHexChart(chartPrint, prepareScatterData(printMap), '刻印朝代统计');
}

// 渲染单张蜂窝图
function drawHexChart(chartInstance, dataObj, title) {
  // 统计每个分类的数量
  const countMap = {};
  dataObj.result.forEach(d => {
    countMap[d.category] = (countMap[d.category] || 0) + 1;
  });
  const counts = dataObj.categories.map(cat => countMap[cat] || 0);

  const option = {
    title: {
      text: title,
      left: 'center',
      top: 10
    },
    grid: {
      top: 40,
      bottom: 80, // 更多底部空间
      left: 40,
      right: 10
    },
    tooltip: {
      formatter: function (params) {
        return `${params.data.category}<br/>${params.data.itemName || '数量：' + params.data}`;
      }
    },
    xAxis: {
      type: 'category',
      data: dataObj.categories,
      axisLabel: {
        rotate: 45,
        margin: 12, // 增加标签与轴线的间距
        fontSize: 12,
        color: '#333'
      }
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      // 蜂窝图 scatter
      {
        type: 'scatter',
        symbolSize: 20,
        data: dataObj.result,
        itemStyle: {
          color: function (param) {
            return parseInt(param.data.itemId) === selectedItemId ? '#ff7f50' : '#3399cc';
          },
          borderColor: '#fff',
          borderWidth: 1
        }
      },
      // 显示数量的透明柱状图
      {
        type: 'bar',
        data: counts,
        barWidth: '40%',
        itemStyle: {
          color: 'rgba(0,0,0,0)'
        },
        label: {
          show: true,
          position: 'top',
          color: '#333',
          fontWeight: 'bold',
          formatter: '{c}'
        },
        tooltip: {
          show: false
        },
        z: 0
      }
    ]
  };

  chartInstance.setOption(option);

  // 点击事件：高亮并通知其他模块
  chartInstance.off('click');
  chartInstance.on('click', function (params) {
    if (params.seriesType === 'scatter' && params.data && params.data.itemId !== undefined) {
      selectedItemId = parseInt(params.data.itemId);
      renderAllCharts();
      dispatchIdSelection(selectedItemId);
    } else {
      // 点击空白区域取消高亮
      selectedItemId = null;
      renderAllCharts();
      dispatchIdSelection(null);
    }
  });
}

// 监听其他模块的选中事件（如地图）
document.addEventListener('idsShared', (e) => {
  const ids = e.detail.ids;
  if (!ids || ids.length === 0) {
    selectedItemId = null;
  } else {
    selectedItemId = parseInt(ids[0]);
  }
  renderAllCharts();
});

// 向其他模块广播选中的 ID（地图、详情等）
function dispatchIdSelection(id) {
  const event = new CustomEvent('idsShared', {
    detail: {
      ids: id ? [id] : [],
      module: 'left-panel'
    },
    bubbles: true
  });
  document.dispatchEvent(event);
}

// 页面初始化
window.addEventListener('DOMContentLoaded', async () => {
  initCharts();
  await loadData();
});
