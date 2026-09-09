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
  CODE: "INR",
  SYMBOL: "₹",
  PRECISION: 2,
};

// Function to format currency with proper negative sign placement and dynamic currency code
const formatCurrency = (value: unknown, currencyCode = "INR"): string => {
  let numberValue: number;

  if (typeof value === "number") {
    numberValue = value;
  } else {
    numberValue = Number(value);
    if (isNaN(numberValue)) {
      numberValue = 0;
    }
  }

  const validCode =
    currencyCode?.length === 3 ? currencyCode.toUpperCase() : "INR";
  const locale = validCode === "INR" ? "en-IN" : "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: validCode,
      minimumFractionDigits: CURRENCY.PRECISION,
      maximumFractionDigits: CURRENCY.PRECISION,
    }).format(numberValue);
  } catch {
    const prefix = validCode === "INR" ? "₹" : "$";
    const sign = numberValue < 0 ? "-" : "";
    return `${sign}${prefix}${Math.abs(numberValue).toFixed(CURRENCY.PRECISION)}`;
  }
};

export { COLORS, CURRENCY, formatCurrency };
