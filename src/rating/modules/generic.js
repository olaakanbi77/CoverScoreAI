exports.rate = ({ className, rate, minPremium, inputs, assessmentData, prefix }) => {
  const sumInsured = parseFloat(inputs.sumInsured) || 0;
  const basis = parseFloat(inputs.basis) || sumInsured;
  const quantity = parseFloat(inputs.quantity) || 1;

  if (sumInsured === 0 && basis === 0) {
    return {
      premium: 0, breakdown: [], minPremium,
      finalPremium: minPremium,
      rateUsed: rate, className,
      needsInputs: true,
      missingFields: ['sumInsured']
    };
  }

  const rawPremium = Math.round(basis * rate * quantity);
  const finalPremium = Math.max(rawPremium, minPremium);

  const items = [];
  if (sumInsured > 0) items.push({ label: 'Sum Insured', value: sumInsured, rate, premium: rawPremium });
  if (quantity > 1) items.push({ label: 'Quantity', value: quantity });

  if (inputs.loading) {
    const loadingPct = parseFloat(inputs.loading) || 0;
    const loadingAmount = Math.round(finalPremium * loadingPct);
    items.push({ label: 'Loading (' + (loadingPct * 100) + '%)', value: loadingAmount });
  }
  if (inputs.discount) {
    const discountPct = parseFloat(inputs.discount) || 0;
    const discountAmount = Math.round(finalPremium * discountPct);
    items.push({ label: 'Discount (' + (discountPct * 100) + '%)', value: -discountAmount });
  }

  const adjustedPremium = Math.max(rawPremium, minPremium);

  return {
    premium: adjustedPremium,
    breakdown: items,
    totalSumInsured: sumInsured,
    minPremium,
    finalPremium: adjustedPremium,
    rateUsed: rate,
    className,
    needsInputs: sumInsured === 0,
    missingFields: sumInsured === 0 ? ['sumInsured'] : []
  };
};
