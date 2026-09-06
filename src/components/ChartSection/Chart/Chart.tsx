import { useRef } from 'react';

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';

import { BG_COLORS, LINE_COLORS } from '../../domain/colors';

import styles from './Chart.module.css';
import { formatPrice } from '../../lib/price';
import { useColors } from '../../hooks/useColors';
import { usePricesContext } from '../../context/PricesContext';

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip);

function Chart() {
  const { prices, bestPrice, worstPrice, avgPrice } = usePricesContext();
  const { color: currentColor, getColor } = useColors();
  const isProvisionalPricesAvailable = useRef(false);
  const nextPrices = prices?.slice(0, 24) || [];

  if (!prices?.length) {
    return <div className={styles.wrapper} >No hi ha dades disponibles</div>;
  }

  const formatDate = (date: string) => `${dayjs(date).format('HH')}h`;

  const getValue = (dataIndex: number, dataset) => dataset.data[dataIndex];

  /**
   * Special case has different styling (current price, max, min)
   * @param {string} value
   * @param {number} dataIndex
   * @param {number} length
   * @returns {boolean}
   */
  const isBestPrice = (value: string, dataIndex: number, length: number) =>
    dataIndex && dataIndex < length - 1 && value === formatPrice(bestPrice.price);

  const pointBorderColor = ({ dataIndex, dataset }: { dataIndex: number; dataset: any }) => {
    const value = getValue(dataIndex, dataset);
    return LINE_COLORS[getColor(value)];
  };

  const pointRadius = ({ dataIndex, dataset }: { dataIndex: number; dataset: any }) => {
    const value = getValue(dataIndex, dataset);
    const BEST_POINT = 6;
    const DEFAULT_POINT = 3;
    return isBestPrice(value, dataIndex, dataset.data.length) ? BEST_POINT : DEFAULT_POINT;
  };

  const pointBorderWidth = ({ dataIndex, dataset }: { dataIndex: number; dataset: any }) => {
    const value = getValue(dataIndex, dataset);
    const BEST_POINT = 2;
    const DEFAULT_POINT = 2;
    return isBestPrice(value, dataIndex, dataset.data.length) ? BEST_POINT : DEFAULT_POINT;
  };

  const pointStyle = ({ dataIndex, dataset }: { dataIndex: number; dataset: any }) => {
    const value = getValue(dataIndex, dataset);
    const BEST_POINT = 'crossRot';
    const DEFAULT_POINT = 'circle';
    return isBestPrice(value, dataIndex, dataset.data.length) ? BEST_POINT : DEFAULT_POINT;
  };

  const getChartData = () => {
    let lastPrice = null;

    const data = nextPrices.filter(({ simulated }) => !simulated);
    const prices = data.map(({ price }) => formatPrice(price));

    const simulatedData = nextPrices.filter((price) => price.simulated);
    const simulatedPrices = simulatedData.map(() => null);

    if (simulatedData.length !== 0) {
      prices.push(formatPrice(simulatedData[0].price));
      isProvisionalPricesAvailable.current = true;
    } else {
      lastPrice = prices[prices.length - 1];
    }

    return [...prices, ...simulatedPrices, lastPrice];
  };

  const getSimulatedChartData = () => {
    const prices = nextPrices.map(({ price, simulated }) =>
      simulated ? formatPrice(price) : null,
    );
    return [...prices, prices[prices.length - 1]];
  };

  const lineData = nextPrices && {
    labels: [...nextPrices.map(({ date }) => formatDate(date)), '00h'],
    datasets: [
      {
        datasetIdKey: 'prices',
        label: 'Preu',
        backgroundColor: BG_COLORS[currentColor],
        borderColor: BG_COLORS.grey,
        borderWidth: 2,
        data: getChartData(),
        fill: true,
        pointBackgroundColor: pointBorderColor,
        pointBorderColor,
        pointBorderWidth,
        pointRadius,
        pointStyle,
        stepped: 'before',
      },
      {
        datasetIdKey: 'provisionalPrice',
        label: 'PProvisional',
        beginAtZero: true,
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
        data: [...nextPrices.map(() => formatPrice(avgPrice)), formatPrice(avgPrice)], // all with same value
        backgroundColor: 'transparent',
        borderColor: '#999',
        pointRadius: 0,
      },
    ],
  };

  const max = formatPrice(worstPrice?.price) + 0.03;

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max,
      },
    },
    interaction: {
      mode: 'index',
    },
    plugins: {
      legend: false,
      tooltip: {
        position: 'nearest',
      },
    },
  };

  return (
    <>
      <div className={styles.wrapper}>
        {nextPrices && nextPrices.length > 0 && <Line data={lineData} options={options} />}
      </div>
    </>
  );
}

export default Chart;
