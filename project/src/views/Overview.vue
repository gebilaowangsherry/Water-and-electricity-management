<template>
  <div class="overview-container">
    <h3>第一周教学楼用水用电量</h3>
    <!-- 第一行：四栋教学楼的用水用电量卡片 -->

    <el-row :gutter="20" class="card-row" id="chart-container">
      <el-col :span="6" v-for="building in buildings" :key="building.name">
        <el-card shadow="hover" class="building-card">
          <template #header>
            <div class="card-header">
              <span>{{ building.name }}</span>
            </div>
          </template>
          <div class="card-content">
            <div class="stat-item">
              <!-- <el-icon><Water /></el-icon> -->
              <span>用水量：{{ building.totalWaterUsage }}吨</span>
            </div>
            <div class="stat-item">
              <!-- <el-icon><Lightning /></el-icon> -->
              <span>用电量：{{ building.totalElectricityUsage }}度</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：两个图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24" class="chart-switch">
        <el-radio-group v-model="activeChartType" @change="handleChartChange">
          <el-radio-button value="water">用水量</el-radio-button>
          <el-radio-button value="electricity">用电量</el-radio-button>
        </el-radio-group>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ chartTitle }}（饼图）</span>
            </div>
          </template>
          <div id="pie-chart" class="chart-container1"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ chartTitle }}（折线图）</span>
            </div>
          </template>
          <div id="line-chart" class="chart-container2"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import axios from "axios";
import { ElRadioGroup, ElRadioButton, ElMessage } from "element-plus";

// 请求数据
const buildings = ref([]);
const pieChart = ref(null);
const lineChart = ref(null);
const activeChartType = ref("water");
const chartsInitialized = ref(false);
const isLoading = ref(false);
const isChartsLoading = ref(false);

const chartTitle = computed(() => {
  return activeChartType.value === "water" ? "用水量统计" : "用电量统计";
});

const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// 计算每栋楼的总用水量和总用电量
const calculateBuildingTotals = (building) => {
  const { water, electricity } = building.floors.reduce(
    (acc, floor) => {
      floor.weeklyUsage.forEach((day) => {
        acc.water += day.waterUsage;
        acc.electricity += day.electricityUsage;
      });
      return acc;
    },
    { water: 0, electricity: 0 }
  );

  return {
    totalWaterUsage: water.toFixed(2),
    totalElectricityUsage: electricity.toFixed(2),
  };
};

// 动态加载 ECharts
const loadECharts = async () => {
  if (window.echarts) return window.echarts;

  isChartsLoading.value = true;
  try {
    const echarts = await import("echarts/core");
    const { PieChart, LineChart } = await import("echarts/charts");
    const { TitleComponent, TooltipComponent, LegendComponent, GridComponent } =
      await import("echarts/components");
    const { CanvasRenderer } = await import("echarts/renderers");

    echarts.use([
      PieChart,
      LineChart,
      TitleComponent,
      TooltipComponent,
      LegendComponent,
      GridComponent,
      CanvasRenderer,
    ]);

    window.echarts = echarts;
    return echarts;
  } finally {
    isChartsLoading.value = false;
  }
};

// 初始化图表
const initCharts = async () => {
  try {
    await loadECharts();

    const pieElement = document.getElementById("pie-chart");
    const lineElement = document.getElementById("line-chart");

    if (pieElement && lineElement) {
      pieChart.value = window.echarts.init(pieElement);
      lineChart.value = window.echarts.init(lineElement);
      chartsInitialized.value = true;
      updateCharts();
    }
  } catch (error) {
    console.error("初始化图表失败:", error);
  }
};

// 更新图表
const updateCharts = () => {
  if (!chartsInitialized.value || buildings.value.length === 0) return;

  try {
    // 饼图数据
    const pieData = buildings.value.map((building) => ({
      value:
        activeChartType.value === "water"
          ? parseFloat(building.totalWaterUsage)
          : parseFloat(building.totalElectricityUsage),
      name: building.name,
    }));

    // 折线图数据
    const seriesData = buildings.value.map((building) => {
      const weeklyData = [0, 0, 0, 0, 0, 0, 0];

      building.floors.forEach((floor) => {
        floor.weeklyUsage.forEach((day, index) => {
          weeklyData[index] +=
            activeChartType.value === "water"
              ? day.waterUsage
              : day.electricityUsage;
        });
      });

      return {
        name: building.name,
        type: "line",
        data: weeklyData.map((value) => parseFloat(value.toFixed(1))),
        smooth: true,
        showSymbol: true,
      };
    });

    // 饼图配置
    pieChart.value.setOption({
      title: {
        text: "各教学楼占比",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
        data: buildings.value.map((b) => b.name),
      },
      series: [
        {
          name: activeChartType.value === "water" ? "用水量(吨)" : "用电量(度)",
          type: "pie",
          radius: "50%",
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    });

    // 折线图配置
    lineChart.value.setOption({
      title: {
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },

        formatter: (params) => {
          const unit = activeChartType.value === "water" ? "吨" : "度";
          return params.reduce(
            (str, item) =>
              `${str}${item.marker} ${item.seriesName}: ${item.value}${unit}<br/>`,
            `${params[0].axisValue}<br/>`
          );
        },
      },
      legend: {
        data: buildings.value.map((b) => b.name),
        bottom: 10,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: weekDays,
      },
      yAxis: {
        type: "value",
        name: activeChartType.value === "water" ? "用水量(吨)" : "用电量(度)",
      },
      series: seriesData,
    });
  } catch (error) {
    console.error("更新图表时出错:", error);
  }
};

// 获取数据
const fetchData = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const { data } = await axios.get("http://localhost:3000/buildings");
    const dataArray = Array.isArray(data) ? data : [];

    buildings.value = dataArray.map((building) => ({
      name: building.name,
      floors: building.floors || [],
      ...calculateBuildingTotals(building),
    }));

    if (!chartsInitialized.value) {
      await initCharts();
    } else {
      updateCharts();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    ElMessage.error("数据加载失败");
  } finally {
    isLoading.value = false;
  }
};

// 图表类型切换
const handleChartChange = () => {
  updateCharts();
};

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  if (pieChart.value) pieChart.value.resize();
  if (lineChart.value) lineChart.value.resize();
};

let pollingInterval;

onMounted(() => {
  fetchData();
  pollingInterval = setInterval(fetchData, 5000);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (pieChart.value) pieChart.value.dispose();
  if (lineChart.value) lineChart.value.dispose();
  clearInterval(pollingInterval);
});
</script>
<style scoped>
@import url(../style/css1.css);
</style>
