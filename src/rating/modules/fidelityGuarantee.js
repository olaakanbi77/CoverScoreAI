exports.rate = ({ className, rate, minPremium, inputs }) => {
  const bondAmount = parseFloat(inputs.bondAmount) || 0;
  const employeeCount = parseInt(inputs.employeeCount) || 1;

  if (bondAmount === 0) {
    return {
      premium: 0, breakdown: [], minPremium,
      finalPremium: minPremium,
      rateUsed: rate, className,
      needsInputs: true,
      missingFields: ['bondAmount']
    };
  }

  const rawPremium = Math.round(bondAmount * rate);
  const finalPremium = Math.max(rawPremium, minPremium);

  return {
    premium: finalPremium,
    breakdown: [
      { label: `Bond Amount: ₦${bondAmount.toLocaleString()}`, value: bondAmount, rate, premium: finalPremium },
      { label: `Employees Covered: ${employeeCount}` }
    ],
    bondAmount,
    employeeCount,
    minPremium,
    finalPremium,
    rateUsed: rate,
    className
  };
};
