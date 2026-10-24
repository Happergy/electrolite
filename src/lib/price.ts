export const formatPrice = (price: number = 0): number => {
  if (!Number.isFinite(price)) {
    return 0;
  }

  if (Math.abs(price) < 1) {
    return price;
  }

  return (Math.sign(price) * Math.round(Math.abs(price) / 1000)) / 100;
};

export const printPrice = (price: number = 0, showUnits: boolean = false) => {
  const printablePrice: string = (Math.round(formatPrice(price) * 100) / 100).toFixed(2);
  return `${Number(printablePrice) !== 0 ? printablePrice : '0.00'}€${showUnits ? ' / kWh' : ''}`;
};
