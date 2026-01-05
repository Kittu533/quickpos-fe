"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamic import to avoid SSR issues with ApexCharts
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
    ),
});

interface ChartProps {
    options: ApexOptions;
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    type: "area" | "bar" | "line" | "pie" | "donut" | "radialBar";
    height?: number | string;
    width?: number | string;
}

export function Chart({ options, series, type, height = 350, width = "100%" }: ChartProps) {
    return (
        <ReactApexChart
            options={options}
            series={series}
            type={type}
            height={height}
            width={width}
        />
    );
}

// Pre-configured chart components
export function AreaChart({
    data,
    categories,
    colors = ["#3B82F6"],
    height = 300,
}: {
    data: number[];
    categories: string[];
    colors?: string[];
    height?: number;
}) {
    const options: ApexOptions = {
        chart: {
            type: "area",
            toolbar: { show: false },
            fontFamily: "inherit",
            sparkline: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100],
            },
        },
        xaxis: {
            categories,
            labels: {
                style: { colors: "#6B7280", fontSize: "12px" },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: "#6B7280", fontSize: "12px" },
                formatter: (val) => `Rp${(val / 1000).toFixed(0)}K`,
            },
        },
        grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 4,
        },
        colors,
        tooltip: {
            y: {
                formatter: (val) => `Rp ${val.toLocaleString("id-ID")}`,
            },
        },
    };

    return (
        <Chart
            options={options}
            series={[{ name: "Sales", data }]}
            type="area"
            height={height}
        />
    );
}

export function BarChart({
    data,
    categories,
    colors = ["#3B82F6"],
    height = 300,
}: {
    data: number[];
    categories: string[];
    colors?: string[];
    height?: number;
}) {
    const options: ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: "60%",
                distributed: false,
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories,
            labels: {
                style: { colors: "#6B7280", fontSize: "11px" },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: "#6B7280", fontSize: "12px" },
                formatter: (val) => `${(val / 1000).toFixed(0)}K`,
            },
        },
        grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 4,
        },
        colors,
        tooltip: {
            y: {
                formatter: (val) => `Rp ${val.toLocaleString("id-ID")}`,
            },
        },
    };

    return (
        <Chart
            options={options}
            series={[{ name: "Sales", data }]}
            type="bar"
            height={height}
        />
    );
}

export function RadialChart({
    value,
    label,
    color = "#3B82F6",
    height = 280,
}: {
    value: number;
    label: string;
    color?: string;
    height?: number;
}) {
    const options: ApexOptions = {
        chart: {
            type: "radialBar",
            fontFamily: "inherit",
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    size: "65%",
                },
                track: {
                    background: "#E5E7EB",
                    strokeWidth: "100%",
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: "14px",
                        color: "#6B7280",
                        offsetY: 30,
                    },
                    value: {
                        show: true,
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "#1F2937",
                        offsetY: -10,
                        formatter: (val) => `${val}%`,
                    },
                },
            },
        },
        fill: {
            type: "solid",
            colors: [color],
        },
        stroke: {
            lineCap: "round",
        },
        labels: [label],
    };

    return (
        <Chart
            options={options}
            series={[value]}
            type="radialBar"
            height={height}
        />
    );
}

export function DonutChart({
    data,
    labels,
    colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    height = 280,
}: {
    data: number[];
    labels: string[];
    colors?: string[];
    height?: number;
}) {
    const options: ApexOptions = {
        chart: {
            type: "donut",
            fontFamily: "inherit",
        },
        labels,
        colors,
        legend: {
            position: "bottom",
            fontSize: "13px",
        },
        dataLabels: {
            enabled: false,
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "70%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total",
                            fontSize: "14px",
                            color: "#6B7280",
                            formatter: (w) => {
                                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return `Rp ${(total / 1000).toFixed(0)}K`;
                            },
                        },
                    },
                },
            },
        },
        tooltip: {
            y: {
                formatter: (val) => `Rp ${val.toLocaleString("id-ID")}`,
            },
        },
    };

    return <Chart options={options} series={data} type="donut" height={height} />;
}

export function MixedChart({
    barData,
    lineData,
    categories,
    height = 300,
}: {
    barData: number[];
    lineData: number[];
    categories: string[];
    height?: number;
}) {
    const options: ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: "50%",
            },
        },
        dataLabels: { enabled: false },
        stroke: { width: [0, 3], curve: "smooth" },
        xaxis: {
            categories,
            labels: {
                style: { colors: "#6B7280", fontSize: "11px" },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: [
            {
                labels: {
                    style: { colors: "#6B7280", fontSize: "12px" },
                    formatter: (val) => `${(val / 1000).toFixed(0)}K`,
                },
            },
        ],
        grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 4,
        },
        colors: ["#3B82F6", "#10B981"],
        tooltip: {
            y: {
                formatter: (val) => `Rp ${val.toLocaleString("id-ID")}`,
            },
        },
        legend: {
            position: "top",
            horizontalAlign: "right",
        },
    };

    const series = [
        { name: "Revenue", type: "bar", data: barData },
        { name: "Profit", type: "line", data: lineData },
    ];

    return <Chart options={options} series={series} type="bar" height={height} />;
}
