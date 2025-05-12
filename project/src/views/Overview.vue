<template>
  <div class="overview-container">
    <h3>第一周教学楼用水用电量</h3>
    <!-- 第一行：四栋教学楼的用水用电量卡片 -->
    <el-row :gutter="20" class="card-row">
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
import {
  ref,
  onMounted,
  watch,
  computed,
  onBeforeUnmount,
  nextTick,
} from "vue";
import axios from "axios";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";

// 请求数据
const buildings = ref([]);
const pieChart = ref(null);
const lineChart = ref(null);
const activeChartType = ref("water");
const chartsInitialized = ref(false);

const chartTitle = computed(() => {
  return activeChartType.value === "water" ? "用水量统计" : "用电量统计";
});

const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// 计算每栋楼的总用水量和总用电量
const calculateBuildingTotals = (building) => {
  let totalWater = 0;
  let totalElectricity = 0;

  building.floors.forEach((floor) => {
    floor.weeklyUsage.forEach((day) => {
      totalWater += day.waterUsage;
      totalElectricity += day.electricityUsage;
    });
  });

  return {
    totalWaterUsage: totalWater.toFixed(2),
    totalElectricityUsage: totalElectricity.toFixed(2),
  };
};

// 获取数据
const fetchData = async () => {
  try {
    const response = await axios.get("http://localhost:3000/buildings");
    const data = Array.isArray(response.data) ? response.data : [];

    buildings.value = data.map((building) => {
      const totals = calculateBuildingTotals(building);
      return {
        ...building,
        ...totals,
      };
    });

    initCharts();
  } catch (error) {
    ElMessage.error("数据加载失败");
    console.error("Error fetching data:", error);
  }
};

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    const pieElement = document.getElementById("pie-chart");
    const lineElement = document.getElementById("line-chart");

    // 确保DOM元素存在
    if (!pieElement || !lineElement) {
      console.warn("图表容器未找到，将在下次尝试");
      return;
    }

    // 如果图表已经初始化，先销毁
    if (pieChart.value) {
      pieChart.value.dispose();
    }
    if (lineChart.value) {
      lineChart.value.dispose();
    }

    // 初始化新图表
    pieChart.value = echarts.init(pieElement);
    lineChart.value = echarts.init(lineElement);
    chartsInitialized.value = true;

    updateCharts();
  });
};

// 更新图表
const updateCharts = () => {
  // 确保图表已初始化且数据可用
  if (!chartsInitialized.value || buildings.value.length === 0) {
    return;
  }

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
      const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // 初始化7天的数据

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
      };
    });

    // 饼图配置
    const pieOption = {
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
    };

    // 折线图配置
    const lineOption = {
      title: {
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params) {
          let result = params[0].axisValue + "<br/>";
          params.forEach((item) => {
            result += `${item.marker} ${item.seriesName}: ${item.value}${
              activeChartType.value === "water" ? "吨" : "度"
            }<br/>`;
          });
          return result;
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
    };

    // 安全地设置图表选项
    pieChart.value?.setOption(pieOption);
    lineChart.value?.setOption(lineOption);
  } catch (error) {
    console.error("更新图表时出错:", error);
  }
};

// 图表类型切换
const handleChartChange = () => {
  updateCharts();
};

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  pieChart.value?.resize();
  lineChart.value?.resize();
};

onMounted(() => {
  fetchData();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  pieChart.value?.dispose();
  lineChart.value?.dispose();
});

// 监听数据变化
watch(
  buildings,
  () => {
    updateCharts();
  },
  { deep: true }
);
</script>

<style scoped>
h3 {
  margin: 10px;
}

.card-row {
  margin-bottom: 20px;
}

.building-card {
  height: 100%;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.card-content {
  padding: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.stat-item .el-icon {
  margin-right: 8px;
  color: var(--el-color-primary);
}

.chart-row {
  margin-top: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container1 {
  width: 100%;
  height: 350px;
}

.chart-container2 {
  width: 100%;
  height: 320px;
}
</style>
