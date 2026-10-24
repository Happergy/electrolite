import {
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Filler,
  LinearScale,
  LineElement,
  type Plugin,
  PointElement,
  type ScriptableContext,
  Title,
  Tooltip,
} from 'chart.js';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { usePricesContext } from '../../../context/PricesContext';
import { BG_COLORS, LINE_COLORS } from '../../../domain/colors';
import { useColors } from '../../../hooks/useColors';
import useTheme from '../../../hooks/useTheme';
import { formatPrice } from '../../../lib/price';

import styles from './Chart.module.css';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Filler,
  Tooltip,
);

function Chart() {
  const { chartPrices, bestPrice, avgPrice } = usePricesContext();
  const { getColor } = useColors();
  const { theme } = useTheme();
  const isProvisionalPricesAvailable = useRef(false);
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const nextPrices =
    chartPrices?.filter(({ date }) => {
      const dateKey = dayjs(date).format('YYYY-MM-DD');
      return dateKey === today || dateKey === tomorrow;
    }) || [];
  const chartAverage =
    nextPrices.length > 0
      ? nextPrices.reduce((sum, { price }) => sum + price, 0) /
        nextPrices.length
      : avgPrice;

  const formatDate = (date: string) => `${dayjs(date).format('HH')}h`;
  const getChartValue = (price: number) => Math.max(0, formatPrice(price));
  const getValue = ({ dataIndex, dataset }: ScriptableContext<'line'>) =>
    dataset.data[dataIndex];

  /**
   * Special case has different styling (current price, max, min)
   * @param {string} value
   * @param {number} dataIndex
   * @param {number} length
   * @returns {boolean}
   */
  const isBestPrice = (value: unknown, dataIndex: number, length: number) =>
    dataIndex > 0 &&
    dataIndex < length - 1 &&
    typeof value === 'number' &&
    value === getChartValue(bestPrice.price);

  const pointBorderColor = (context: ScriptableContext<'line'>) => {
    const value = getValue(context);
    return typeof value === 'number'
      ? LINE_COLORS[getColor(value)]
      : BG_COLORS.grey;
  };

  const pointRadius = (context: ScriptableContext<'line'>) => {
    const value = getValue(context);
    const BEST_POINT = 6;
    const DEFAULT_POINT = 3;
    return isBestPrice(value, context.dataIndex, context.dataset.data.length)
      ? BEST_POINT
      : DEFAULT_POINT;
  };

  const pointBorderWidth = (context: ScriptableContext<'line'>) => {
    const value = getValue(context);
    const BEST_POINT = 2;
    const DEFAULT_POINT = 2;
    return isBestPrice(value, context.dataIndex, context.dataset.data.length)
      ? BEST_POINT
      : DEFAULT_POINT;
  };

  const pointStyle = (context: ScriptableContext<'line'>) => {
    const value = getValue(context);
    const BEST_POINT = 'crossRot';
    const DEFAULT_POINT = 'circle';
    return isBestPrice(value, context.dataIndex, context.dataset.data.length)
      ? BEST_POINT
      : DEFAULT_POINT;
  };

  const getChartData = () => {
    let lastPrice = null;

    const data = nextPrices.filter(({ simulated }) => !simulated);
    const prices = data.map(({ price }) => getChartValue(price));

    const simulatedData = nextPrices.filter((price) => price.simulated);
    const simulatedPrices = simulatedData.map(() => null);

    if (simulatedData.length !== 0) {
      prices.push(getChartValue(simulatedData[0].price));
      isProvisionalPricesAvailable.current = true;
    } else {
      lastPrice = prices[prices.length - 1];
    }

    return [...prices, ...simulatedPrices, lastPrice];
  };

  const getSimulatedChartData = () => {
    const prices = nextPrices.map(({ price, simulated }) =>
      simulated ? getChartValue(price) : null,
    );
    return [...prices, prices[prices.length - 1]];
  };

  const areaFillPlugin: Plugin<'line'> = {
    id: 'price-area-fill',
    beforeDatasetsDraw: (chart) => {
      const meta = chart.getDatasetMeta(0);
      const data = chart.data.datasets[0]?.data;
      if (!meta.visible || !data) {
        return;
      }

      const { ctx, chartArea } = chart;
      const baseline = chartArea.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        chartArea.left,
        chartArea.top,
        chartArea.width,
        chartArea.height,
      );
      ctx.clip();

      for (let index = 0; index < meta.data.length - 1; index += 1) {
        const startValue = data[index];
        const endValue = data[index + 1];
        const start = meta.data[index] as PointElement;
        const end = meta.data[index + 1] as PointElement;

        if (
          typeof startValue !== 'number' ||
          typeof endValue !== 'number' ||
          start.skip ||
          end.skip
        ) {
          continue;
        }

        const { x: startX, y: startY } = start.getProps(['x', 'y'], true);
        const { x: endX, y: endY } = end.getProps(['x', 'y'], true);
        if (
          typeof startX !== 'number' ||
          typeof startY !== 'number' ||
          typeof endX !== 'number' ||
          typeof endY !== 'number'
        ) {
          continue;
        }

        const color = nextPrices[index]?.simulated
          ? BG_COLORS.grey
          : BG_COLORS[getColor(startValue)];

        ctx.beginPath();
        ctx.moveTo(startX, baseline);
        ctx.lineTo(startX, startY);
        ctx.lineTo(endX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(endX, baseline);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.restore();
    },
  };

  const lineData: ChartData<'line'> = {
    labels: [...nextPrices.map(({ date }) => formatDate(date)), '00h'],
    datasets: [
      {
        label: 'Preu',
        borderColor: BG_COLORS.grey,
        borderWidth: 2,
        data: getChartData(),
        fill: false,
        pointBackgroundColor: pointBorderColor,
        pointBorderColor,
        pointBorderWidth,
        pointRadius,
        pointStyle,
        stepped: 'before',
      },
      {
        label: 'PProvisional',
        backgroundColor: BG_COLORS.grey,
        borderColor: BG_COLORS.grey,
        borderWidth: 2,
        data: getSimulatedChartData(),
        fill: true,
        pointBackgroundColor: pointBorderColor,
        pointBorderColor,
        pointBorderWidth,
        pointRadius,
        pointStyle,
        stepped: 'before',
      },
      {
        label: 'Preu mitjà',
        borderWidth: 2,
        borderDash: [4, 2],
        data: [
          ...nextPrices.map(() => getChartValue(chartAverage)),
          getChartValue(chartAverage),
        ], // all with same value
        backgroundColor: 'transparent',
        borderColor: theme === 'dark' ? '#aebcbe' : '#999',
        pointRadius: 0,
      },
    ],
  };

  const max =
    Math.max(0, ...nextPrices.map(({ price }) => getChartValue(price))) + 0.03;

  const options: ChartOptions<'line'> = {
    animation: false,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color:
            theme === 'dark'
              ? 'rgba(241, 245, 244, 0.12)'
              : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#aebcbe' : '#666',
        },
      },
      y: {
        min: 0,
        max,
        grid: {
          color:
            theme === 'dark'
              ? 'rgba(241, 245, 244, 0.12)'
              : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#aebcbe' : '#666',
        },
      },
    },
    interaction: {
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        position: 'nearest',
      },
    },
  };

  return (
    <div className={styles.wrapper}>
      {nextPrices && nextPrices.length > 0 && (
        <Line data={lineData} options={options} plugins={[areaFillPlugin]} />
      )}
    </div>
  );
}

export default Chart;
