const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
];

const CURRENCY = {
  // CODE: "USD",
  // SYMBOL: "$",
  CODE: "INR",
  SYMBOL: "₹",
  PRECISION: 2,
};

// function to format currency
const formatCurrency = (value: unknown): string => {
  let numberValue: number;

  if (typeof value === "number") {
    numberValue = value;
  } else {
    numberValue = Number(value);
    if (isNaN(numberValue)) return `${CURRENCY.SYMBOL}0.00`;
  }

  return `${CURRENCY.SYMBOL}${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: CURRENCY.PRECISION,
    maximumFractionDigits: CURRENCY.PRECISION,
  }).format(numberValue)}`;
};

export { COLORS, CURRENCY, formatCurrency };
