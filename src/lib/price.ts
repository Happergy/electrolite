export const formatPrice = (price: number = 0): number => {
  if (!Number.isFinite(price)) {
    return 0;
  }

  if (Math.abs(price) < 1) {
    return price;
  }

  return (Math.sign(price) * Math.round(Math.abs(price) / 1000)) / 100;
};

export const printPrice = (
  price: number = 0,
  showUnits: boolean = false,
  preserveSmallNegative = false,
) => {
  const formattedPrice = formatPrice(price);
  const decimalPlaces =
    preserveSmallNegative && formattedPrice < 0 && Math.round(formattedPrice * 100) === 0
      ? Math.min(100, Math.max(2, -Math.floor(Math.log10(Math.abs(formattedPrice)))))
      : 2;
  const printablePrice =
    decimalPlaces === 2
      ? (Math.round(formattedPrice * 100) / 100).toFixed(2)
      : formattedPrice.toFixed(decimalPlaces);

  return `${Number(printablePrice) !== 0 ? printablePrice : '0.00'}€${showUnits ? ' / kWh' : ''}`;
};
