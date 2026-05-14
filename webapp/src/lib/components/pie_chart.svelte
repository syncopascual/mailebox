<script lang="ts">
    import type { ApexOptions } from "apexcharts";
  	import { Chart } from "@flowbite-svelte-plugins/chart";

    let {
        percent_avail = 50.8,
        percent_occ = 28.8,
        percent_over = 20.4
    } = $props();

	const options: ApexOptions = {
        series: [percent_avail, percent_occ, percent_over],
            colors: ["#22c55e", "#ff7c00", "#ef4444"],
            chart: {
            height: 420,
            width: "100%",
            type: "pie"
        },
        stroke: {
            colors: ["white"]
        },
        plotOptions: {
        pie: {
            dataLabels: {
                offset: -25
            }
        }
        },
        labels: ["Available", "Occupied", "Overdue"],
        dataLabels: {
            enabled: true,
        },
        legend: {
            position: "bottom",
        },
        yaxis: {
        labels: {
            formatter: function (value) {
                return value + "%";
            }
        }
        },
        xaxis: {
        labels: {
            formatter: function (value) {
                return value + "%";
            }
        },
        axisTicks: {
            show: false
        },
        axisBorder: {
            show: false
        }
        }
    };
</script>

<Chart {options} class="py-6" />