function calculateFamilyProtectionResult(answers) {
  const getRisk = (code) => answers[code] && answers[code].risk_value !== undefined ? answers[code].risk_value : 0;
  
  const categories = {};
  
  // 5.1 Family Protection Risk™ — FAM
  categories.FAM = Math.round((getRisk('PER_FAM_001') * 0.30) + (getRisk('PER_FAM_004') * 0.25) + (getRisk('PER_LIF_001') * 0.45));
  
  // 5.2 Income Protection Risk™ — INC
  categories.INC = Math.round((getRisk('PER_FAM_004') * 0.30) + (getRisk('PER_INC_001') * 0.45) + (getRisk('PER_FIN_001') * 0.25));
  
  // 5.3 Health Protection Risk™ — HLT
  // Formula When Dependents Exist vs No Dependents
  if (answers.PER_FAM_001 && answers.PER_FAM_001.value !== 0 && answers.PER_FAM_001.raw_input !== '1' && answers.PER_HLT_002) {
    categories.HLT = Math.round((getRisk('PER_HLT_001') * 0.65) + (getRisk('PER_HLT_002') * 0.35));
  } else {
    categories.HLT = Math.round(getRisk('PER_HLT_001'));
  }

  // 5.4 Financial Resilience Risk™ — FIN
  categories.FIN = Math.round((getRisk('PER_FIN_001') * 0.70) + (getRisk('PER_INC_001') * 0.30));

  // 5.5 Education Continuity Risk™ — EDU
  // Education Continuity Risk™ applies only if PER_FAM_003 is '2', '3', or '4' (raw_input)
  const educationApplies = Boolean(answers.PER_FAM_003 && answers.PER_EDU_002 && answers.PER_FAM_003.raw_input !== '1');
  
  if (educationApplies) {
    categories.EDU = Math.round((getRisk('PER_FAM_003') * 0.35) + (getRisk('PER_EDU_002') * 0.65));
  }

  // 6.0 Weight Redistribution Rules
  const weights = educationApplies
    ? { FAM: 0.30, INC: 0.25, HLT: 0.20, FIN: 0.15, EDU: 0.10 }
    : { FAM: 0.3333, INC: 0.2778, HLT: 0.2222, FIN: 0.1667 };

  // 7.0 Overall Score Formula
  let overall = 0;
  Object.keys(weights).forEach((key) => {
    overall += categories[key] * weights[key];
  });
  overall = Math.round(overall);

  // 8.0 Overall Score Bands
  let band = "Strong";
  let status_label = "Strong Protection Foundation";
  if (overall >= 81) {
    band = "Critical";
    status_label = "Immediate Protection Review Recommended";
  } else if (overall >= 61) {
    band = "Vulnerable";
    status_label = "Significant Protection Gap";
  } else if (overall >= 41) {
    band = "Moderate";
    status_label = "Protection Gap Identified";
  } else if (overall >= 21) {
    band = "Stable";
    status_label = "Stable, With Opportunities to Improve";
  }

  // 9.0 Risk DNA™ Engine
  const riskDna = [];
  const riskDnaCodes = new Set();
  
  // 9.1 Income Exposed™
  if (getRisk('PER_FAM_004') >= 75 && getRisk('PER_INC_001') >= 75) {
    riskDna.push({
      code: "income_exposed",
      name: "Income Exposed™",
      severity: "high",
      explanation: "Your household appears to rely heavily on your income, while your current income-continuity buffer may be limited."
    });
    riskDnaCodes.add("income_exposed");
  }
  
  // 9.2 Family Protection Deficient™
  if (answers.PER_FAM_001 && answers.PER_FAM_001.raw_input !== '1' && getRisk('PER_LIF_001') >= 65) {
    riskDna.push({
      code: "family_protection_deficient",
      name: "Family Protection Deficient™",
      severity: "high",
      explanation: "Your result suggests that family protection may need review, especially because others depend on your financial support."
    });
    riskDnaCodes.add("family_protection_deficient");
  }
  
  // 9.3 Health Vulnerable™
  if (getRisk('PER_HLT_001') >= 70 && getRisk('PER_FIN_001') >= 65) {
    riskDna.push({
      code: "health_vulnerable",
      name: "Health Vulnerable™",
      severity: "high",
      explanation: "Unexpected medical costs may place pressure on your household because health cover and emergency readiness appear limited."
    });
    riskDnaCodes.add("health_vulnerable");
  }
  
  // 9.4 Education Continuity at Risk™
  if (educationApplies && getRisk('PER_EDU_002') >= 80) {
    riskDna.push({
      code: "education_continuity_at_risk",
      name: "Education Continuity at Risk™",
      severity: "high",
      explanation: "Your result suggests that education expenses could become difficult to maintain if household income changes unexpectedly."
    });
    riskDnaCodes.add("education_continuity_at_risk");
  }
  
  // 9.5 Emergency Reserve Gap™
  if (getRisk('PER_FIN_001') >= 65) {
    riskDna.push({
      code: "emergency_reserve_gap",
      name: "Emergency Reserve Gap™",
      severity: "high",
      explanation: "You may not have enough dedicated savings to manage unexpected expenses comfortably."
    });
    riskDnaCodes.add("emergency_reserve_gap");
  }

  // 9.6 Financially Resilient™
  if (getRisk('PER_INC_001') <= 25 && getRisk('PER_FIN_001') <= 30 && getRisk('PER_LIF_001') <= 20 && getRisk('PER_HLT_001') <= 20) {
    riskDna.push({
      code: "financially_resilient",
      name: "Financially Resilient™",
      severity: "low",
      explanation: "You have a strong combination of income continuity, emergency savings, life protection, and health protection."
    });
    riskDnaCodes.add("financially_resilient");
  }

  // Ensure maximum of two DNA labels
  const finalRiskDna = riskDna.slice(0, 2);

  // 10.0 Priority Gap Selection Engine
  const categoryNames = {
    INC: "Income Continuity",
    FAM: "Family Life Protection",
    HLT: "Health Protection",
    FIN: "Emergency Readiness",
    EDU: "Education Continuity"
  };
  
  let rankedCategories = Object.keys(categories).map(code => ({
    code,
    name: categoryNames[code],
    score: categories[code]
  }));

  // Sort logic (highest risk first, use order as tie-breaker)
  const orderFallback = { INC: 1, FAM: 2, HLT: 3, FIN: 4, EDU: 5 };
  rankedCategories.sort((a, b) => {
    // If within 3 points, consider a tie
    if (Math.abs(a.score - b.score) <= 3) {
      // Tie breaker 1: Risk DNA Severity (if a specific Risk DNA covers that category, prioritize it)
      // Since it's complex to map all DNA exact matches, we use the fallback order for ties as requested
      return orderFallback[a.code] - orderFallback[b.code];
    }
    return b.score - a.score;
  });

  rankedCategories = rankedCategories.map((cat, idx) => ({ ...cat, priority_rank: idx + 1 }));

  // 11.0 Recommendation Engine
  const recommendations = [];
  
  // REC-FAM-001
  if (categories.INC >= 61 || riskDnaCodes.has('income_exposed')) {
    recommendations.push({
      recommendation_id: "REC-FAM-001",
      priority: "Immediate",
      priority_val: 1,
      title: "Build an Income Continuity Plan",
      action: "Review how your household would continue meeting normal expenses if your income paused unexpectedly. Start by identifying essential monthly costs, strengthening emergency savings, and reviewing suitable protection options."
    });
  }
  
  // REC-FAM-002
  if (categories.FAM >= 61 || riskDnaCodes.has('family_protection_deficient')) {
    recommendations.push({
      recommendation_id: "REC-FAM-002",
      priority: "High",
      priority_val: 2,
      title: "Review Family Life Protection",
      action: "Consider whether your current protection would support the people who depend on you, including everyday household needs, education expenses, and important financial obligations."
    });
  }
  
  // REC-FAM-003
  if (categories.HLT >= 61 || riskDnaCodes.has('health_vulnerable')) {
    recommendations.push({
      recommendation_id: "REC-FAM-003",
      priority: "High",
      priority_val: 2,
      title: "Strengthen Health Protection",
      action: "Consider how you and your dependents would access care if an unexpected medical need arose. A suitable health plan and emergency medical reserve can reduce pressure on household finances."
    });
  }
  
  // REC-FAM-004
  if (categories.FIN >= 61 || riskDnaCodes.has('emergency_reserve_gap')) {
    recommendations.push({
      recommendation_id: "REC-FAM-004",
      priority: "High",
      priority_val: 2,
      title: "Build an Emergency Reserve",
      action: "Create a simple plan to build savings for unexpected expenses. Begin with a realistic monthly target and work toward an emergency reserve that can support essential household needs."
    });
  }
  
  // REC-FAM-005
  if (educationApplies && (categories.EDU >= 61 || riskDnaCodes.has('education_continuity_at_risk'))) {
    recommendations.push({
      recommendation_id: "REC-FAM-005",
      priority: "High",
      priority_val: 2,
      title: "Protect Education Continuity",
      action: "Consider how school fees and education expenses would continue if your income changed unexpectedly. A clear education funding and protection plan can reduce disruption."
    });
  }
  
  // REC-FAM-006 (Annual Review)
  if (overall <= 40 && riskDna.filter(r => r.severity === 'high').length === 0) {
    recommendations.push({
      recommendation_id: "REC-FAM-006",
      priority: "Low",
      priority_val: 4,
      title: "Maintain and Review Your Protection Plan",
      action: "You have a useful protection foundation. Review your plans at least once a year, or whenever your income, family responsibilities, health needs, or major expenses change."
    });
  }

  // 12.0 Recommendation Selection Rules
  recommendations.sort((a, b) => a.priority_val - b.priority_val);
  
  // Ensure first recommendation addresses highest-risk category
  const topCategoryCode = rankedCategories[0].code;
  const catRecMap = {
    INC: 'REC-FAM-001',
    FAM: 'REC-FAM-002',
    HLT: 'REC-FAM-003',
    FIN: 'REC-FAM-004',
    EDU: 'REC-FAM-005'
  };
  const topExpectedRecId = catRecMap[topCategoryCode];
  
  let finalRecommendations = [];
  const topExpectedRec = recommendations.find(r => r.recommendation_id === topExpectedRecId);
  if (topExpectedRec) {
    finalRecommendations.push(topExpectedRec);
  }
  
  for (const rec of recommendations) {
    if (!finalRecommendations.find(r => r.recommendation_id === rec.recommendation_id)) {
      finalRecommendations.push(rec);
    }
  }
  
  finalRecommendations = finalRecommendations.slice(0, 3).map(r => {
    delete r.priority_val;
    return r;
  });

  // 13.0 Risk Story Matching Engine
  let risk_story = null;
  if (riskDnaCodes.has('income_exposed')) {
    risk_story = { story_id: "STORY-FAM-001", title: "Income Interruption", summary: "Many households depend heavily on one income source. When that income is interrupted, rent, food, school fees, and other regular obligations can become difficult to manage.\n\nYour result shows that income continuity is one area worth reviewing." };
  } else if (riskDnaCodes.has('family_protection_deficient')) {
    risk_story = { story_id: "STORY-FAM-002", title: "Family Protection Gap", summary: "When people depend on one person financially, a protection gap can affect everyday household needs and long-term responsibilities.\n\nYour result shows that family life protection is one area worth reviewing." };
  } else if (riskDnaCodes.has('health_vulnerable')) {
    risk_story = { story_id: "STORY-FAM-003", title: "Health Expense Pressure", summary: "Unexpected medical expenses can affect both wellbeing and household finances when health cover or emergency savings are limited.\n\nYour result shows that health protection is one area worth strengthening." };
  } else if (riskDnaCodes.has('education_continuity_at_risk')) {
    risk_story = { story_id: "STORY-FAM-004", title: "Education Continuity", summary: "Education expenses can become difficult to sustain when household income changes unexpectedly.\n\nYour result shows that education continuity is one area worth planning for." };
  } else if (riskDnaCodes.has('emergency_reserve_gap')) {
    risk_story = { story_id: "STORY-FAM-005", title: "Emergency Savings", summary: "Unexpected expenses can create pressure when there is little or no emergency reserve available.\n\nYour result shows that emergency readiness is one area worth strengthening." };
  } else {
    // Highest-risk category fallback
    if (topCategoryCode === 'INC') risk_story = { story_id: "STORY-FAM-001", title: "Income Interruption", summary: "Many households depend heavily on one income source. When that income is interrupted, rent, food, school fees, and other regular obligations can become difficult to manage.\n\nYour result shows that income continuity is one area worth reviewing." };
    if (topCategoryCode === 'FAM') risk_story = { story_id: "STORY-FAM-002", title: "Family Protection Gap", summary: "When people depend on one person financially, a protection gap can affect everyday household needs and long-term responsibilities.\n\nYour result shows that family life protection is one area worth reviewing." };
    if (topCategoryCode === 'HLT') risk_story = { story_id: "STORY-FAM-003", title: "Health Expense Pressure", summary: "Unexpected medical expenses can affect both wellbeing and household finances when health cover or emergency savings are limited.\n\nYour result shows that health protection is one area worth strengthening." };
    if (topCategoryCode === 'EDU') risk_story = { story_id: "STORY-FAM-004", title: "Education Continuity", summary: "Education expenses can become difficult to sustain when household income changes unexpectedly.\n\nYour result shows that education continuity is one area worth planning for." };
    if (topCategoryCode === 'FIN') risk_story = { story_id: "STORY-FAM-005", title: "Emergency Savings", summary: "Unexpected expenses can create pressure when there is little or no emergency reserve available.\n\nYour result shows that emergency readiness is one area worth strengthening." };
  }

  // 14.0 Academy Learning Recommendation Engine
  let academy_recommendation = null;
  const academyOptions = {
    INC: { course_code: "ACA-INC-001", course_name: "Income Protection Basics™", reason: "Your result shows that income continuity is one of your priority areas." },
    FAM: { course_code: "ACA-FAM-001", course_name: "Family Protection Basics™", reason: "Your result shows that family life protection is one of your priority areas." },
    HLT: { course_code: "ACA-HLT-001", course_name: "Health Protection Essentials™", reason: "Your result shows that health protection is one of your priority areas." },
    FIN: { course_code: "ACA-FIN-001", course_name: "Emergency Readiness Basics™", reason: "Your result shows that emergency readiness is one of your priority areas." },
    EDU: { course_code: "ACA-EDU-001", course_name: "Education Planning Essentials™", reason: "Your result shows that education continuity is one of your priority areas." }
  };
  
  if (overall <= 40 && riskDnaCodes.size === 0) {
    academy_recommendation = {
      course_code: "ACA-REV-001",
      course_name: "Annual Protection Review™",
      reason: "Your result shows a stable foundation. This course will help you maintain it."
    };
  } else {
    academy_recommendation = academyOptions[topCategoryCode];
  }

  // 15.0 Opportunity Priority Engine
  let opportunity_priority = "Nurture";
  let target_hours = 48;
  
  if (overall >= 81) { opportunity_priority = "Urgent"; target_hours = 2; }
  else if (overall >= 61) { opportunity_priority = "High"; target_hours = 24; }
  else if (overall >= 41) { opportunity_priority = "Standard"; target_hours = 24; }
  
  if (riskDnaCodes.has('income_exposed') && overall >= 61) {
    opportunity_priority = "Urgent"; target_hours = 2;
  }
  if (riskDnaCodes.has('family_protection_deficient') && answers.PER_FAM_001 && ['4', '5'].includes(answers.PER_FAM_001.raw_input)) {
    if (opportunity_priority !== "Urgent") { opportunity_priority = "High"; target_hours = 12; }
  }
  if (riskDnaCodes.has('health_vulnerable') && overall >= 61) {
    if (opportunity_priority !== "Urgent") { opportunity_priority = "High"; target_hours = 12; }
  }

  return {
    score: {
      overall,
      band,
      status_label
    },
    category_scores: rankedCategories,
    risk_dna: finalRiskDna,
    priority_actions: finalRecommendations,
    risk_story,
    academy_recommendation,
    advisor_opportunity: {
      eligible: true,
      create_only_if_consent: true,
      priority: opportunity_priority.toLowerCase(),
      response_target_hours: target_hours
    },
    report_disclaimer: "This assessment is educational and is not a guarantee of insurance suitability, policy approval, claim payment, medical outcome, or financial result."
  };
}

module.exports = {
  calculateFamilyProtectionResult
};
