const KNOWLEDGE_RULES = [
  // ===== SCHOOL =====
  {
    id: 'gpa_students',
    productCode: 'GPA',
    productName: 'Group Personal Accident',
    icon: 'g',
    needId: 'protect_students_against_accidental_injury',
    assessmentTypes: ['school', 'SCH'],
    conditions: { pillar: ['studentSafety', 'Student Safety'], maxScore: 60 },
    baseConfidence: 95,
    factors: ['Student safety preparedness needs improvement'],
    strategyLabel: 'Provide accident cover for students and staff',
    category: 'Immediate Priority',
  },
  {
    id: 'fire_school',
    productCode: 'FIRE',
    productName: 'Fire & Special Perils',
    icon: 'o',
    needId: 'protect_buildings_and_contents_against_fire_and_damage',
    assessmentTypes: ['school', 'SCH'],
    conditions: { pillar: ['propertyProtection', 'Property Protection'] },
    baseConfidence: 97,
    factors: ['School buildings and contents need protection'],
    strategyLabel: 'Insure buildings and contents against fire and perils',
    category: 'Immediate Priority',
  },
  {
    id: 'pl_school',
    productCode: 'PL',
    productName: 'Public Liability',
    icon: 'b',
    needId: 'protect_against_third_party_liability_claims',
    assessmentTypes: ['school', 'SCH', 'church', 'CHR', 'hospital', 'HOS', 'sme', 'SME'],
    conditions: { pillar: ['legalLiability', 'Legal Liability', 'premisesSafety', 'Premises Safety', 'clinicalLiability'] },
    baseConfidence: 98,
    factors: ['Third-party liability exposure identified'],
    strategyLabel: 'Cover legal liability to third parties',
    category: 'Immediate Priority',
  },
  {
    id: 'motor_school',
    productCode: 'MOTOR',
    productName: 'Comprehensive Motor',
    icon: 'g',
    needId: 'protect_school_buses_and_student_transport',
    assessmentTypes: ['school', 'SCH'],
    conditions: { pillar: ['transportSafety', 'Transport Safety'] },
    baseConfidence: 95,
    factors: ['Student transport vehicles need comprehensive cover'],
    strategyLabel: 'Insure school transport vehicles comprehensively',
    category: 'Immediate Priority',
  },
  {
    id: 'bi_school',
    productCode: 'BI',
    productName: 'Business Interruption',
    icon: 'o',
    needId: 'maintain_cash_flow_and_operations_during_disruptions',
    assessmentTypes: ['school', 'SCH', 'sme', 'SME', 'hospital', 'HOS', 'church', 'CHR', 'manufacturing', 'MFG'],
    conditions: { pillar: ['businessContinuity', 'Business Continuity', 'businessInterruption'] },
    baseConfidence: 88,
    factors: ['Business continuity risk identified'],
    strategyLabel: 'Protect income during operational disruptions',
    category: 'Strongly Recommended',
  },

  // ===== HOSPITAL =====
  {
    id: 'malpractice_hospital',
    productCode: 'MED_MALPRACTICE',
    productName: 'Medical Malpractice',
    icon: 'b',
    needId: 'protect_against_medical_malpractice_claims',
    assessmentTypes: ['hospital', 'HOS'],
    conditions: { pillar: ['clinicalLiability', 'Clinical Liability'] },
    baseConfidence: 99,
    factors: ['Clinical liability exposure identified'],
    strategyLabel: 'Cover medical malpractice and professional liability',
    category: 'Immediate Priority',
  },
  {
    id: 'gpa_hospital',
    productCode: 'GPA',
    productName: 'Group Personal Accident',
    icon: 'g',
    needId: 'protect_patients_against_medical_incidents',
    assessmentTypes: ['hospital', 'HOS'],
    conditions: { pillar: ['patientSafety', 'Patient Safety'] },
    baseConfidence: 92,
    factors: ['Patient safety preparedness needs improvement'],
    strategyLabel: 'Provide accident cover for patients and staff',
    category: 'Immediate Priority',
  },
  {
    id: 'ee_hospital',
    productCode: 'EE',
    productName: 'Electronic Equipment',
    icon: 'o',
    needId: 'protect_diagnostic_and_medical_equipment_against_breakdown',
    assessmentTypes: ['hospital', 'HOS'],
    conditions: { pillar: ['equipmentProtection', 'Equipment Protection'] },
    baseConfidence: 93,
    factors: ['Medical equipment needs breakdown protection'],
    strategyLabel: 'Insure diagnostic and medical equipment',
    category: 'Strongly Recommended',
  },

  // ===== MANUFACTURING =====
  {
    id: 'fire_mfg',
    productCode: 'FIRE',
    productName: 'Fire & Special Perils',
    icon: 'o',
    needId: 'protect_factory_buildings_and_stock_against_fire',
    assessmentTypes: ['manufacturing', 'MFG'],
    conditions: { pillar: ['fireAndProperty', 'Fire & Property Risk'] },
    baseConfidence: 99,
    factors: ['Factory fire risk identified with asset concentration'],
    strategyLabel: 'Insure factory buildings, stock, and equipment',
    category: 'Immediate Priority',
  },
  {
    id: 'mb_mfg',
    productCode: 'MB',
    productName: 'Machinery Breakdown',
    icon: 'o',
    needId: 'protect_production_machinery_against_breakdown',
    assessmentTypes: ['manufacturing', 'MFG'],
    conditions: { pillar: ['machineryAndEquipment', 'Machinery & Equipment', 'machinery.*breakdown'] },
    baseConfidence: 95,
    factors: ['Production machinery needs breakdown protection'],
    strategyLabel: 'Cover production machinery against breakdown',
    category: 'Immediate Priority',
  },
  {
    id: 'bi_mfg',
    productCode: 'BI',
    productName: 'Business Interruption',
    icon: 'o',
    needId: 'maintain_income_during_production_stoppages',
    assessmentTypes: ['manufacturing', 'MFG'],
    conditions: { pillar: ['businessInterruption', 'Business Interruption'] },
    baseConfidence: 96,
    factors: ['Production stoppage would cause significant revenue loss'],
    strategyLabel: 'Protect income during production stoppages',
    category: 'Immediate Priority',
  },

  // ===== SME =====
  {
    id: 'fire_sme',
    productCode: 'FIRE',
    productName: 'Fire & Special Perils',
    icon: 'o',
    needId: 'protect_business_assets_and_inventory_against_loss',
    assessmentTypes: ['sme', 'SME'],
    conditions: { pillar: ['assetProtection', 'Asset Protection'] },
    baseConfidence: 97,
    factors: ['Business assets need fire and perils protection'],
    strategyLabel: 'Insure business assets and inventory',
    category: 'Immediate Priority',
  },
  {
    id: 'pl_sme',
    productCode: 'PL',
    productName: 'Public Liability',
    icon: 'b',
    needId: 'protect_against_third_party_liability_claims',
    assessmentTypes: ['sme', 'SME'],
    conditions: { pillar: ['legalLiability', 'Legal Liability', 'liability'] },
    baseConfidence: 96,
    factors: ['Third-party liability exposure identified'],
    strategyLabel: 'Cover legal liability to third parties',
    category: 'Immediate Priority',
  },
  {
    id: 'employers_liability',
    productCode: 'EMPLOYERS_LIABILITY',
    productName: 'Employers Liability',
    icon: 'b',
    needId: 'protect_employees_with_adequate_benefits_and_cover',
    assessmentTypes: ['sme', 'SME', 'manufacturing', 'MFG'],
    conditions: { pillar: ['workforce', 'Workforce', 'workforceSafety', 'Workforce Safety', 'employee'] },
    baseConfidence: 94,
    factors: ['Employee workplace injury risk identified'],
    strategyLabel: 'Cover employer liability to employees',
    category: 'Immediate Priority',
  },
  {
    id: 'gpa_workforce',
    productCode: 'GPA',
    productName: 'Group Personal Accident',
    icon: 'g',
    needId: 'protect_employees_with_adequate_benefits_and_cover',
    assessmentTypes: ['sme', 'SME', 'manufacturing', 'MFG', 'hospital', 'HOS', 'school', 'SCH', 'church', 'CHR'],
    conditions: { pillar: ['workforce', 'Workforce', 'workforceSafety', 'Workforce Safety', 'people'] },
    baseConfidence: 91,
    factors: ['Workforce accident risk identified'],
    strategyLabel: 'Provide accident cover for employees',
    category: 'Strongly Recommended',
  },
  {
    id: 'goods_in_transit',
    productCode: 'GOODS_IN_TRANSIT',
    productName: 'Goods in Transit',
    icon: 'o',
    needId: 'safeguard_business_operations_and_logistics',
    assessmentTypes: ['sme', 'SME'],
    conditions: { pillar: ['operations', 'Operations', 'supplyChain', 'Supply Chain'] },
    baseConfidence: 82,
    factors: ['Logistics and supply chain risk identified'],
    strategyLabel: 'Cover goods during transportation',
    category: 'Strongly Recommended',
  },
  {
    id: 'cyber_sme',
    productCode: 'CYBER_LIABILITY',
    productName: 'Cyber Liability',
    icon: 'b',
    needId: 'protect_digital_assets_and_customer_data',
    assessmentTypes: ['sme', 'SME'],
    conditions: { pillar: ['cyberAndData', 'Cyber & Data Risk', 'cyberExposure', 'Cyber Exposure'] },
    baseConfidence: 85,
    factors: ['Cyber and data risk exposure identified'],
    strategyLabel: 'Cover cyber attacks and data breaches',
    category: 'Strongly Recommended',
  },

  // ===== CHURCH =====
  {
    id: 'pl_church',
    productCode: 'PL',
    productName: 'Public Liability',
    icon: 'b',
    needId: 'protect_congregants_and_visitors_against_injury',
    assessmentTypes: ['church', 'CHR'],
    conditions: { pillar: ['premisesSafety', 'Premises Safety', 'crowdManagement'] },
    baseConfidence: 97,
    factors: ['Church premises liability exposure identified'],
    strategyLabel: 'Cover liability to congregants and visitors',
    category: 'Immediate Priority',
  },
  {
    id: 'fg_church',
    productCode: 'FG',
    productName: 'Fidelity Guarantee',
    icon: 'o',
    needId: 'protect_church_funds_against_theft_or_mismanagement',
    assessmentTypes: ['church', 'CHR'],
    conditions: { pillar: ['financialStewardship', 'Financial Stewardship'] },
    baseConfidence: 78,
    factors: ['Financial stewardship risk identified'],
    strategyLabel: 'Cover church funds against employee dishonesty',
    category: 'Consider Next',
  },

  // ===== PERSONAL — FAMILY =====
  {
    id: 'term_life',
    productCode: 'TERM_LIFE',
    productName: 'Term Life Insurance',
    icon: 'g',
    needId: 'provide_financial_security_for_dependents',
    assessmentTypes: ['family', 'FAM', 'young_professional', 'YPR', 'entrepreneur', 'ENT'],
    conditions: { pillar: ['familyProtection', 'Family Protection'] },
    baseConfidence: 93,
    factors: ['Family financial dependency risk identified'],
    strategyLabel: 'Provide life cover for income earners',
    category: 'Immediate Priority',
  },
  {
    id: 'personal_accident',
    productCode: 'PERSONAL_ACCIDENT',
    productName: 'Personal Accident Insurance',
    icon: 'g',
    needId: 'replace_income_if_unable_to_work_due_to_illness_or_injury',
    assessmentTypes: ['family', 'FAM', 'income', 'INC', 'young_professional', 'YPR', 'entrepreneur', 'ENT'],
    conditions: { pillar: ['incomeProtection', 'Income Protection', 'incomeStability', 'Income Stability'] },
    baseConfidence: 91,
    factors: ['Income protection gap identified'],
    strategyLabel: 'Provide income replacement in case of accident',
    category: 'Immediate Priority',
  },
  {
    id: 'health_individual',
    productCode: 'INDIVIDUAL_HEALTH',
    productName: 'Individual Health Insurance',
    icon: 'h',
    needId: 'access_quality_healthcare_without_financial_strain',
    assessmentTypes: ['family', 'FAM', 'health', 'HLT', 'young_professional', 'YPR', 'entrepreneur', 'ENT'],
    conditions: { pillar: ['healthSecurity', 'Health Security', 'healthAccess', 'Health Access'] },
    baseConfidence: 94,
    factors: ['Health coverage gap identified'],
    strategyLabel: 'Provide comprehensive health insurance',
    category: 'Immediate Priority',
  },
  {
    id: 'critical_illness',
    productCode: 'CRITICAL_ILLNESS',
    productName: 'Critical Illness Cover',
    icon: 'h',
    needId: 'access_quality_healthcare_without_financial_strain',
    assessmentTypes: ['family', 'FAM', 'health', 'HLT'],
    conditions: { pillar: ['criticalIllness', 'Critical Illness', 'healthSecurity'] },
    baseConfidence: 87,
    factors: ['Serious illness would cause financial strain'],
    strategyLabel: 'Provide lump-sum payment on diagnosis of critical illness',
    category: 'Strongly Recommended',
  },
  {
    id: 'education_plan',
    productCode: 'EDUCATION',
    productName: 'Education Plan',
    icon: 'g',
    needId: 'secure_funding_for_children_education',
    assessmentTypes: ['family', 'FAM'],
    conditions: { pillar: ['educationFunding', 'Education Funding'] },
    baseConfidence: 82,
    factors: ['Education funding gap identified'],
    strategyLabel: 'Save for children education with guaranteed maturity',
    category: 'Strongly Recommended',
  },
  {
    id: 'retirement_plan',
    productCode: 'RETIREMENT',
    productName: 'Retirement Plan',
    icon: 'g',
    needId: 'build_adequate_retirement_savings',
    assessmentTypes: ['family', 'FAM', 'young_professional', 'YPR', 'retirement', 'RET', 'entrepreneur', 'ENT'],
    conditions: { pillar: ['retirementReadiness', 'Retirement Readiness', 'retirementSavings', 'Retirement Savings'] },
    baseConfidence: 89,
    factors: ['Retirement savings gap identified'],
    strategyLabel: 'Build retirement savings systematically',
    category: 'Strongly Recommended',
  },

  // ===== PERSONAL — HEALTH =====
  {
    id: 'family_health',
    productCode: 'FAMILY_HEALTH',
    productName: 'Family Health Plan',
    icon: 'h',
    needId: 'access_quality_healthcare_without_financial_strain',
    assessmentTypes: ['health', 'HLT', 'family', 'FAM'],
    conditions: { pillar: ['healthAccess', 'Health Access', 'healthSecurity'] },
    baseConfidence: 96,
    factors: ['Family health coverage gap identified'],
    strategyLabel: 'Provide comprehensive family health plan',
    category: 'Immediate Priority',
  },
  {
    id: 'hospital_cash',
    productCode: 'HOSPITAL_CASH',
    productName: 'Hospital Cash Plan',
    icon: 'h',
    needId: 'access_quality_healthcare_without_financial_strain',
    assessmentTypes: ['health', 'HLT', 'family', 'FAM'],
    conditions: { pillar: ['treatmentAffordability', 'Treatment Affordability'] },
    baseConfidence: 75,
    factors: ['Hospitalization would cause financial pressure'],
    strategyLabel: 'Provide daily cash benefit during hospitalization',
    category: 'Consider Next',
  },

  // ===== PERSONAL — INCOME =====
  {
    id: 'income_protection',
    productCode: 'INCOME_PROTECTION',
    productName: 'Income Protection',
    icon: 'g',
    needId: 'replace_income_if_unable_to_work_due_to_illness_or_injury',
    assessmentTypes: ['income', 'INC', 'entrepreneur', 'ENT', 'young_professional', 'YPR'],
    conditions: { pillar: ['incomeStability', 'Income Stability', 'disabilityProtection', 'Disability Protection'] },
    baseConfidence: 92,
    factors: ['Income stability risk identified'],
    strategyLabel: 'Replace monthly income during illness or disability',
    category: 'Immediate Priority',
  },

  // ===== PERSONAL — YOUNG PROFESSIONAL =====
  {
    id: 'yp_health',
    productCode: 'INDIVIDUAL_HEALTH',
    productName: 'Individual Health Insurance',
    icon: 'h',
    needId: 'secure_personal_health_and_accident_cover',
    assessmentTypes: ['young_professional', 'YPR'],
    conditions: { pillar: ['healthAndProtection', 'Health & Protection'] },
    baseConfidence: 90,
    factors: ['Personal health coverage gap identified'],
    strategyLabel: 'Provide personal health and accident cover',
    category: 'Immediate Priority',
  },

  // ===== PERSONAL — ENTREPRENEUR =====
  {
    id: 'ent_liability',
    productCode: 'PL',
    productName: 'Public Liability',
    icon: 'b',
    needId: 'protect_personal_assets_from_business_liabilities',
    assessmentTypes: ['entrepreneur', 'ENT'],
    conditions: { pillar: ['personalLiability', 'Personal Liability', 'businessPersonalSeparation'] },
    baseConfidence: 88,
    factors: ['Personal liability exposure from business activities'],
    strategyLabel: 'Cover personal liability from business operations',
    category: 'Strongly Recommended',
  },

  // ===== CROSS-CUTTING =====
  {
    id: 'keyman',
    productCode: 'KEYMAN',
    productName: 'Keyman Insurance',
    icon: 'g',
    needId: 'protect_against_loss_of_key_personnel',
    assessmentTypes: ['sme', 'SME', 'manufacturing', 'MFG', 'hospital', 'HOS'],
    conditions: { pillar: ['workforce', 'operations', 'businessContinuity'] },
    baseConfidence: 72,
    factors: ['Key person dependency risk identified'],
    strategyLabel: 'Protect business against loss of key personnel',
    category: 'Consider Next',
  },
  {
    id: 'fg_standard',
    productCode: 'FG',
    productName: 'Fidelity Guarantee',
    icon: 'o',
    needId: 'protect_church_funds_against_theft_or_mismanagement',
    assessmentTypes: ['sme', 'SME', 'church', 'CHR', 'hospital', 'HOS'],
    conditions: { pillar: ['financialStewardship', 'Financial Stewardship', 'assetProtection'] },
    baseConfidence: 68,
    factors: ['Employee handling of funds identified'],
    strategyLabel: 'Cover against employee dishonesty and fraud',
    category: 'Consider Next',
  },
  {
    id: 'd_and_o',
    productCode: 'D_O',
    productName: 'Directors & Officers Liability',
    icon: 'b',
    needId: 'meet_regulatory_and_compliance_obligations',
    assessmentTypes: ['sme', 'SME', 'manufacturing', 'MFG'],
    conditions: { pillar: ['regulatoryReadiness', 'regulatoryCompliance'] },
    baseConfidence: 62,
    factors: ['Regulatory compliance obligations identified'],
    strategyLabel: 'Cover directors and officers against claims',
    category: 'Consider Next',
  },
  {
    id: 'cyber_general',
    productCode: 'CYBER_LIABILITY',
    productName: 'Cyber Liability',
    icon: 'b',
    needId: 'protect_against_cyber_threats_and_data_loss',
    assessmentTypes: ['sme', 'SME', 'manufacturing', 'MFG', 'hospital', 'HOS', 'church', 'CHR'],
    conditions: { pillar: ['cyberExposure', 'Cyber Exposure', 'cyberAndData', 'Cyber & Data Risk'] },
    baseConfidence: 72,
    factors: ['General cyber risk exposure identified'],
    strategyLabel: 'Cover cyber attacks and data breaches',
    category: 'Consider Next',
  },
];

function findMatchingGap(rule, gaps) {
  if (!rule.conditions || !rule.conditions.pillar) return null;
  for (const condition of rule.conditions.pillar) {
    const match = gaps.find(g => {
      const pillarClean = g.pillarKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const condClean = condition.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return pillarClean.includes(condClean) || condClean.includes(pillarClean);
    });
    if (match) return match;
  }
  return null;
}

function mapStrategiesToProducts(needs, gaps, assessmentType, answers) {
  const productRecs = [];
  const seenProducts = new Set();

  for (const need of needs) {
    for (const rule of KNOWLEDGE_RULES) {
      if (!rule.assessmentTypes.some(t => t.toLowerCase() === assessmentType.toLowerCase())) continue;
      if (rule.needId !== need.id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() &&
          !rule.needId.includes(need.id.substring(0, 20))) continue;

      if (seenProducts.has(rule.productCode)) continue;
      seenProducts.add(rule.productCode);

      const factorAdjustments = computeFactorAdjustments(rule, gaps, answers);
      const confidence = Math.min(100, Math.max(0, rule.baseConfidence + factorAdjustments));
      const matchingGap = findMatchingGap(rule, gaps);

      productRecs.push({
        productCode: rule.productCode,
        productName: rule.productName,
        icon: rule.icon || 'g',
        strategyId: rule.id,
        needId: need.id,
        needLabel: need.label,
        strategyLabel: rule.strategyLabel,
        confidence: Math.round(confidence),
        priority: confidence >= 90 ? 'high' : confidence >= 75 ? 'medium' : 'low',
        category: rule.category,
        factors: [...rule.factors, ...(factorAdjustments > 0 ? ['Additional confirming signals detected'] : [])],
        severity: need.severity,
        matchingGapPillar: matchingGap ? matchingGap.pillarKey : null,
        matchingGapScore: matchingGap ? matchingGap.score : null,
      });
    }
  }

  productRecs.sort((a, b) => b.confidence - a.confidence);
  return productRecs;
}

function computeFactorAdjustments(rule, gaps, answers) {
  let adjustment = 0;
  const gapScore = gaps.find(g => rule.conditions.pillar.some(p => g.pillarKey.includes(p) || p.includes(g.pillarKey)));
  if (gapScore && gapScore.score < 20) adjustment += 5;
  if (gapScore && gapScore.score < 10) adjustment += 3;
  return adjustment;
}

function getStrategyToProductMap() {
  const map = {};
  for (const rule of KNOWLEDGE_RULES) {
    if (!map[rule.needId]) map[rule.needId] = [];
    map[rule.needId].push({
      productCode: rule.productCode,
      productName: rule.productName,
      icon: rule.icon || 'g',
      strategyLabel: rule.strategyLabel,
      confidence: rule.baseConfidence,
      category: rule.category,
    });
  }
  return map;
}

module.exports = { mapStrategiesToProducts, getStrategyToProductMap, KNOWLEDGE_RULES };
