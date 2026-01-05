"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { transactionsAPI, productsAPI, customersAPI } from "@/lib/api";
import { AreaChart, BarChart, RadialChart, MixedChart } from "@/components/charts/ApexCharts";

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalCustomers: number;
  totalProducts: number;
  salesGrowth: number;
  transactionGrowth: number;
}

interface TopProduct {
  product_name: string;
  quantity: number;
  revenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    totalCustomers: 0,
    totalProducts: 0,
    salesGrowth: 0,
    transactionGrowth: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "revenue">("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let reportData: {
          summary?: { total_sales?: number; total_transactions?: number };
          top_products?: TopProduct[]
        } = {};

        try {
          const dailyReport = await transactionsAPI.getDailyReport();
          reportData = dailyReport.data.data;
        } catch (e) {
          console.warn("Daily report not available:", e);
        }

        let totalCustomers = 0;
        try {
          const customersRes = await customersAPI.getAll({ limit: 1 });
          totalCustomers = customersRes.data.pagination?.total || 0;
        } catch (e) {
          console.warn("Customers count not available:", e);
        }

        let totalProducts = 0;
        try {
          const productsRes = await productsAPI.getAll({ limit: 1 });
          totalProducts = productsRes.data.pagination?.total || 0;
        } catch (e) {
          console.warn("Products count not available:", e);
        }

        setStats({
          todaySales: reportData.summary?.total_sales || 0,
          todayTransactions: reportData.summary?.total_transactions || 0,
          totalCustomers,
          totalProducts,
          salesGrowth: 11.01,
          transactionGrowth: -9.05,
        });

        setTopProducts(reportData.top_products || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Customers",
      value: formatNumber(stats.totalCustomers),
      icon: Users,
      trend: stats.salesGrowth,
      trendUp: true,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Orders",
      value: formatNumber(stats.todayTransactions),
      icon: ShoppingCart,
      trend: Math.abs(stats.transactionGrowth),
      trendUp: stats.transactionGrowth >= 0,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Products",
      value: formatNumber(stats.totalProducts),
      icon: Package,
      trend: 5.2,
      trendUp: true,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.todaySales),
      icon: DollarSign,
      trend: 8.5,
      trendUp: true,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  // Chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySalesData = [180000, 320000, 280000, 450000, 380000, 290000, 350000, 420000, 380000, 480000, 520000, 620000];
  const monthlyProfitData = [45000, 80000, 70000, 112500, 95000, 72500, 87500, 105000, 95000, 120000, 130000, 155000];

  // Calculate target percentage based on current month's sales vs target
  const currentMonth = new Date().getMonth();
  const currentSales = monthlySalesData[currentMonth] || 0;
  const monthlyTarget = 600000; // 600K target
  const targetPercentage = Math.min(Math.round((currentSales / monthlyTarget) * 100), 100);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500">Overview of your QuickPOS business</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-3 ${stat.iconBg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-500'
                  }`}>
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.trend}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Sales Chart */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Monthly Sales</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-500">Revenue</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthlySalesData}
              categories={months}
              colors={["#3B82F6"]}
              height={280}
            />
          </CardContent>
        </Card>

        {/* Monthly Target */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Monthly Target</CardTitle>
            <p className="text-sm text-gray-500">Target you've set for this month</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <RadialChart
              value={targetPercentage}
              label="Achieved"
              color="#3B82F6"
              height={220}
            />
            <p className="mt-2 text-center text-sm text-gray-600">
              You earned <strong className="text-blue-600">{formatCurrency(currentSales)}</strong> this month
            </p>

            {/* Target Stats */}
            <div className="mt-4 grid w-full grid-cols-3 gap-4 border-t pt-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-semibold text-gray-800">{formatCurrency(monthlyTarget)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Achieved</p>
                <p className="font-semibold text-green-600">{formatCurrency(currentSales)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="font-semibold text-orange-600">{formatCurrency(Math.max(0, monthlyTarget - currentSales))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">Statistics</CardTitle>
            <p className="text-sm text-gray-500">Revenue and profit overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "overview"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "sales"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
                }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveTab("revenue")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "revenue"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
                }`}
            >
              Revenue
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "overview" && (
            <MixedChart
              barData={monthlySalesData}
              lineData={monthlyProfitData}
              categories={months}
              height={320}
            />
          )}
          {activeTab === "sales" && (
            <BarChart
              data={monthlySalesData}
              categories={months}
              colors={["#10B981"]}
              height={320}
            />
          )}
          {activeTab === "revenue" && (
            <AreaChart
              data={monthlySalesData}
              categories={months}
              colors={["#8B5CF6"]}
              height={320}
            />
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Top Selling Products Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No sales data yet today
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.product_name}</p>
                      <p className="text-sm text-gray-500">{product.quantity} sold</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
