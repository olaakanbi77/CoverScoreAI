exports.rate = ({ className, rate, minPremium, inputs }) => {
  const vehicleValue = parseFloat(inputs.vehicleValue) || 0;

  if (vehicleValue === 0) {
    return {
      premium: 0, breakdown: [], minPremium,
      finalPremium: minPremium,
      rateUsed: rate, className,
      needsInputs: true,
      missingFields: ['vehicleValue']
    };
  }

  const rawPremium = Math.round(vehicleValue * rate);
  const finalPremium = Math.max(rawPremium, minPremium);

  return {
    premium: finalPremium,
    breakdown: [
      { label: `Vehicle Value: ₦${vehicleValue.toLocaleString()}`, value: vehicleValue, rate, premium: finalPremium }
    ],
    vehicleValue,
    minPremium,
    finalPremium,
    rateUsed: rate,
    className
  };
};
