exports.rate = ({ className, rate, minPremium, inputs }) => {
  const salaryRoll = parseFloat(inputs.salaryRoll) || 0;
  const benefitMultiple = parseInt(inputs.benefitMultiple) || 36;

  if (salaryRoll === 0) {
    return {
      premium: 0, breakdown: [], minPremium,
      finalPremium: minPremium,
      rateUsed: rate, className,
      needsInputs: true,
      missingFields: ['salaryRoll']
    };
  }

  const rawPremium = Math.round(salaryRoll * rate);
  const finalPremium = Math.max(rawPremium, minPremium);

  return {
    premium: finalPremium,
    breakdown: [
      { label: `Total Salary Roll: ₦${salaryRoll.toLocaleString()}`, value: salaryRoll, rate, premium: finalPremium },
      { label: `Benefit Multiple: ${benefitMultiple}x` }
    ],
    salaryRoll,
    benefitMultiple,
    minPremium,
    finalPremium,
    rateUsed: rate,
    className
  };
};
