exports.rate = ({ className, rate, minPremium, inputs, assessmentData, prefix }) => {
  const bv = parseFloat(inputs.buildingValue) || 0;
  const cv = parseFloat(inputs.contentsValue) || 0;
  const sv = parseFloat(inputs.stockValue) || 0;

  const totalSumInsured = bv + cv + sv;

  if (totalSumInsured === 0) {
    if (assessmentData) {
      const ans = assessmentData.answers || {};
      const estBuilding = parseInt(ans[`${prefix}_013`]) || parseInt(ans[`${prefix}_011`]) || 0;
      return {
        premium: Math.round(estBuilding * rate),
        breakdown: [{ label: 'Estimated Value', value: estBuilding, rate, premium: Math.round(estBuilding * rate) }],
        minPremium,
        finalPremium: Math.max(Math.round(estBuilding * rate), minPremium),
        rateUsed: rate,
        className,
        needsInputs: true,
        missingFields: ['buildingValue']
      };
    }
    return {
      premium: 0, breakdown: [], minPremium,
      finalPremium: minPremium,
      rateUsed: rate, className,
      needsInputs: true,
      missingFields: ['buildingValue']
    };
  }

  const items = [];
  if (bv > 0) items.push({ label: 'Building', value: bv, rate, premium: Math.round(bv * rate) });
  if (cv > 0) items.push({ label: 'Contents', value: cv, rate, premium: Math.round(cv * rate) });
  if (sv > 0) items.push({ label: 'Stock', value: sv, rate, premium: Math.round(sv * rate) });

  const rawPremium = items.reduce((s, i) => s + i.premium, 0);
  const finalPremium = Math.max(rawPremium, minPremium);

  return {
    premium: finalPremium,
    breakdown: items,
    totalSumInsured,
    minPremium,
    finalPremium,
    rateUsed: rate,
    className
  };
};
