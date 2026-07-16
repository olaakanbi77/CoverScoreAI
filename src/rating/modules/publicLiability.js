exports.rate = ({ className, rate, minPremium, inputs }) => {
  const limit = parseFloat(inputs.limitIndemnity) || 20000000;
  const rawPremium = Math.round(limit * rate);
  const finalPremium = Math.max(rawPremium, minPremium);

  return {
    premium: finalPremium,
    breakdown: [{ label: `Limit of Indemnity: ₦${limit.toLocaleString()}`, value: limit, rate, premium: finalPremium }],
    limitOfIndemnity: limit,
    minPremium,
    finalPremium,
    rateUsed: rate,
    className
  };
};
