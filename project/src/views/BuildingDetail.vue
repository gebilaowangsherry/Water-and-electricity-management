<template>
  <el-container>
    <el-main>
      <!-- 第一行：两个表格 -->
      <el-row :gutter="20" class="row">
        <el-col :span="12">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <span>{{ buildingName }}用水情况</span>
              </div>
            </template>
            <el-table
              :data="waterTableData"
              border
              style="width: 100%"
              height="300"
            >
              <el-table-column prop="floor" label="楼层" width="80" />
              <el-table-column prop="waterUsage" label="用水量(吨)" />
              <el-table-column prop="waterCost" label="费用(元)" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <span>{{ buildingName }}用电情况</span>
              </div>
            </template>
            <el-table
              :data="electricityTableData"
              border
              style="width: 100%"
              height="300"
            >
              <el-table-column prop="floor" label="楼层" width="80" />
              <el-table-column prop="electricityUsage" label="用电量(度)" />
              <el-table-column prop="electricityCost" label="费用(元)" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第二行：用电图表 -->
      <el-row :gutter="20" class="row">
        <el-col :span="12">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <span>每层楼用电分布</span>
              </div>
            </template>
            <div ref="electricityPieChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <span>每层楼用电趋势</span>
              </div>
            </template>
            <div ref="electricityLineChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第三行：用水图表 -->
      <el-row :gutter="20" class="row">
        <el-col :span="12">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <span>每层楼用水分布</span>
              </div>
            </template>
            <div ref="waterPieChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <span>每层楼用水趋势</span>
              </div>
            </template>
            <div ref="waterLineChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import * as echarts from "echarts/core";
import { PieChart, LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
]);
import { useRoute } from "vue-router";
import axios from "axios";

export default {
  name: "BuildingDetail",
  setup() {
    const route = useRoute();
    const buildingId = ref("");
    const buildingName = ref("");
    const buildingData = ref("");
    const buildingIdMap = {
      A: "1",
      B: "2",
      C: "3",
      D: "4",
    };

    // 表格数据
    const waterTableData = ref([]);
    const electricityTableData = ref([]);

    // 图表DOM引用
    const electricityPieChart = ref(null);
    const electricityLineChart = ref(null);
    const waterPieChart = ref(null);
    const waterLineChart = ref(null);

    // 获取建筑数据
    const fetchBuildingData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/buildings");
        const buildings = Array.isArray(response.data)
          ? response.data
          : response.data.buildings;

        // 转换字母ID为数字ID
        const numericId = buildingIdMap[buildingId.value] || buildingId.value;

        console.log("转换后的ID:", numericId);
        console.log(
          "所有建筑ID:",
          buildings.map((b) => b.id)
        );

        // 根据转换后的ID查找建筑
        const building = buildings.find(
          (b) => String(b.id) === String(numericId)
        );
        console.log("找到的建筑:", building);
        return building;
      } catch (error) {
        console.error("获取建筑数据失败:", error);
        return null;
      }
    };

    // 更新建筑信息
    const updateBuildingInfo = async () => {
      buildingId.value = route.params.id;
      buildingData.value = await fetchBuildingData();

      if (buildingData.value) {
        buildingName.value = buildingData.value.name;
        prepareTableData();
        updateCharts();
      }
    };

    // 准备表格数据
    const prepareTableData = () => {
      if (!buildingData.value) return;

      // 准备用水表格数据
      waterTableData.value = buildingData.value.floors.map((floor) => ({
        floor: `${floor.floor}层`,
        waterUsage: floor.monthlyTotal.waterUsage,
        waterCost: floor.monthlyTotal.waterCost,
      }));

      // 准备用电表格数据
      electricityTableData.value = buildingData.value.floors.map((floor) => ({
        floor: `${floor.floor}层`,
        electricityUsage: floor.monthlyTotal.electricityUsage,
        electricityCost: floor.monthlyTotal.electricityCost,
      }));
    };

    // 更新图表数据
    const updateCharts = () => {
      if (!buildingData.value) return;

      const floors = buildingData.value.floors;

      // 用电饼图数据
      const electricityPieData = floors.map((floor) => ({
        value: floor.monthlyTotal.electricityUsage,
        name: `${floor.floor}层`,
      }));

      // 用电折线图数据
      const days = floors[0].weeklyUsage.map((item) => item.day);
      const electricityLineSeries = floors.map((floor) => ({
        name: `${floor.floor}层`,
        type: "line",
        data: floor.weeklyUsage.map((item) => item.electricityUsage),
      }));

      // 用水饼图数据
      const waterPieData = floors.map((floor) => ({
        value: floor.monthlyTotal.waterUsage,
        name: `${floor.floor}层`,
      }));

      // 用水折线图数据
      const waterLineSeries = floors.map((floor) => ({
        name: `${floor.floor}层`,
        type: "line",
        data: floor.weeklyUsage.map((item) => item.waterUsage),
      }));

      // 更新用电饼图
      const pieChart1 = echarts.getInstanceByDom(electricityPieChart.value);
      pieChart1.setOption({
        series: [
          {
            data: electricityPieData,
          },
        ],
      });

      // 更新用电折线图
      const lineChart1 = echarts.getInstanceByDom(electricityLineChart.value);
      lineChart1.setOption({
        legend: {
          data: floors.map((floor) => `${floor.floor}层`),
        },
        xAxis: {
          data: days,
        },
        series: electricityLineSeries,
      });

      // 更新用水饼图
      const pieChart2 = echarts.getInstanceByDom(waterPieChart.value);
      pieChart2.setOption({
        series: [
          {
            data: waterPieData,
          },
        ],
      });

      // 更新用水折线图
      const lineChart2 = echarts.getInstanceByDom(waterLineChart.value);
      lineChart2.setOption({
        legend: {
          data: floors.map((floor) => `${floor.floor}层`),
        },
        xAxis: {
          data: days,
        },
        series: waterLineSeries,
      });
    };

    // 初始化图表
    const initCharts = () => {
      // 用电饼图
      const pieChart1 = echarts.init(electricityPieChart.value);
      pieChart1.setOption({
        title: {
          text: "用电分布",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          right: 10,
          top: "center",
        },
        series: [
          {
            name: "用电量(度)",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "18",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: [],
          },
        ],
      });

      // 用电折线图
      const lineChart1 = echarts.init(electricityLineChart.value);
      lineChart1.setOption({
        title: {
          text: "用电趋势",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: [],
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
          data: [],
        },
        yAxis: {
          type: "value",
          name: "用电量(度)",
        },
        series: [],
      });

      // 用水饼图
      const pieChart2 = echarts.init(waterPieChart.value);
      pieChart2.setOption({
        title: {
          text: "用水分布",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          right: 10,
          top: "center",
        },
        series: [
          {
            name: "用水量(吨)",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "18",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: [],
          },
        ],
      });

      // 用水折线图
      const lineChart2 = echarts.init(waterLineChart.value);
      lineChart2.setOption({
        title: {
          text: "用水趋势",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: [],
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
          data: [],
        },
        yAxis: {
          type: "value",
          name: "用水量(吨)",
        },
        series: [],
      });

      // 窗口大小变化时重新调整图表大小
      window.addEventListener("resize", function () {
        pieChart1.resize();
        lineChart1.resize();
        pieChart2.resize();
        lineChart2.resize();
      });
    };

    onMounted(() => {
      initCharts();
      updateBuildingInfo();
    });

    // 监听路由变化
    watch(
      () => route.params.id,
      (newId, oldId) => {
        if (newId !== oldId) {
          updateBuildingInfo();
        }
      }
    );

    return {
      buildingName,
      waterTableData,
      electricityTableData,
      electricityPieChart,
      electricityLineChart,
      waterPieChart,
      waterLineChart,
    };
  },
};
</script>

<style scoped>
:deep(.el-main) {
  padding: 0;
  overflow-x: hidden;
}

.row {
  margin-bottom: 20px;
}

.card {
  height: 100%;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>
