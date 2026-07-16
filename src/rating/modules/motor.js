const NAICOM_RATE = 0.05; // 5% — NAICOM-mandated flat rate for comprehensive motor in Nigeria
const MIN_PREMIUM = 100000; // ₦100,000 minimum premium

exports.rate = ({ className, rate, minPremium, inputs }) => {
  const vehicleValue = parseFloat(inputs.vehicleValue) || 0;

  if (vehicleValue === 0) {
    return {
      premium: 0, breakdown: [],
      finalPremium: MIN_PREMIUM,
      rateUsed: NAICOM_RATE, className,
      minPremium: MIN_PREMIUM,
      needsInputs: true,
      missingFields: ['vehicleValue']
    };
  }

  const rawPremium = Math.round(vehicleValue * NAICOM_RATE);
  const finalPremium = Math.max(rawPremium, MIN_PREMIUM);

  return {
    premium: finalPremium,
    breakdown: [
      { label: `Vehicle Value: ₦${vehicleValue.toLocaleString()}`, value: vehicleValue, rate: NAICOM_RATE, premium: finalPremium },
      { label: `Rate: ${(NAICOM_RATE * 100).toFixed(0)}% (NAICOM-mandated)`, value: NAICOM_RATE, premium: rawPremium }
    ],
    vehicleValue,
    minPremium: MIN_PREMIUM,
    finalPremium,
    rateUsed: NAICOM_RATE,
    className
  };
};
