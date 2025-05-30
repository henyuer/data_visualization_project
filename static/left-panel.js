let chartFont, chartStele, chartPrint;
let allItems = [];
let selectedItemIds = new Set();

const DYNASTY_ORDER = [
  '秦', '汉', '魏', '晋', '南北朝', '隋', '唐', '五代', '宋',
  '辽', '金', '元', '明', '清', '民国', '现代', '未知', 'unknown'
];
const FONT_ORDER = ['篆书', '隶书', '草书', '行书', '楷书', '未知', 'unknown'];

function initCharts() {
  chartFont = echarts.init(document.getElementById('chart-font-style'));
  chartStele = echarts.init(document.getElementById('chart-stele-dynasty'));
  chartPrint = echarts.init(document.getElementById('chart-print-dynasty'));

  window.addEventListener('resize', () => {
    chartFont.resize();
    chartStele.resize();
    chartPrint.resize();
  });
}

async function loadData() {
  try {
    const response = await fetch('/items');
    allItems = await response.json();
    renderAllCharts();
  } catch (err) {
    console.error('加载 items.json 失败:', err);
  }
}

function prepareScatterData(grouped, preferredOrder = null) {
  const actualCategories = Object.entries(grouped)
    .filter(([_, items]) => items.length > 0)
    .map(([cat]) => cat);

  const categories = preferredOrder
    ? preferredOrder.filter(cat => actualCategories.includes(cat))
    : actualCategories;

  const result = [];
  categories.forEach((cat, index) => {
    grouped[cat].forEach((item, j) => {
      result.push({
        value: [index, j],
        itemId: parseInt(item.id),
        itemName: item.name,
        category: cat
      });
    });
  });

  return { result, categories };
}

function renderAllCharts() {
  const fontMap = {}, steleMap = {}, printMap = {};

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

  drawHexChart(chartFont, prepareScatterData(fontMap, FONT_ORDER), '字体统计');
  drawHexChart(chartStele, prepareScatterData(steleMap, DYNASTY_ORDER), '碑刻立朝代');
  drawHexChart(chartPrint, prepareScatterData(printMap, DYNASTY_ORDER), '帖拓印朝代');
}

function drawHexChart(chartInstance, dataObj, title) {
  const option = {
    title: { text: title, left: 'center', top: 10 },
    grid: { top: 40, bottom: 100, left: 60, right: 60 },
    tooltip: {
      formatter: function (params) {
        return `${params.data.category}<br/>${params.data.itemName}`;
      }
    },
    xAxis: {
      type: 'category',
      data: dataObj.categories,
      axisLabel: {
        rotate: 45,
        margin: 20,
        fontSize: 12,
        color: '#333'
      }
    },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'scatter',
      symbolSize: 20,
      data: dataObj.result,
      itemStyle: {
        color: function (param) {
          return selectedItemIds.has(parseInt(param.data.itemId)) ? '#ff7f50' : '#3399cc';
        },
        borderColor: '#fff',
        borderWidth: 1
      }
    }]
  };

  chartInstance.setOption(option);

  chartInstance.off('click');
  chartInstance.on('click', function (params) {
    if (params.seriesType === 'scatter' && params.data?.itemId !== undefined) {
      selectedItemIds = new Set([parseInt(params.data.itemId)]);
      renderAllCharts();
      dispatchIdSelection([...selectedItemIds]);
    } else {
      selectedItemIds.clear();
      renderAllCharts();
      dispatchIdSelection([]);
    }
  });
}

document.addEventListener('idsShared', (e) => {
  const ids = e.detail.ids;
  selectedItemIds = new Set((ids || []).map(id => parseInt(id)));
  renderAllCharts();
});

function dispatchIdSelection(ids) {
  const event = new CustomEvent('idsShared', {
    detail: {
      ids: ids || [],
      module: 'left-panel'
    },
    bubbles: true
  });
  document.dispatchEvent(event);
}

window.addEventListener('DOMContentLoaded', async () => {
  initCharts();
  await loadData();
});
