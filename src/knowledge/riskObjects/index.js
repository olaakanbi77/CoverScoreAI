const scoringConfigs = require('../../config/scoring');

const RISK_META = {
  HLT: [
    { riskId: 'RISK-HL-001', riskCode: 'HL-NO-INSURANCE', name: 'No Health Insurance', domain: 'Health', category: 'Healthcare Access', subcategory: 'Health Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'The absence of adequate health insurance or healthcare financing, increasing exposure to out-of-pocket medical expenses.', customer: 'You do not have health insurance to cover medical expenses.', technical: 'Customer reports no active health insurance policy or healthcare financing arrangement.' }, businessContext: ['Personal', 'Family'], question: 'HLT_012', triggerAnswers: ['None'], penaltyScore: 25, impacts: ['Financial', 'Health'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-HL-002', riskCode: 'HL-NO-EMERGENCY-FUND', name: 'No Medical Emergency Fund', domain: 'Health', category: 'Financial Preparedness', subcategory: 'Emergency Savings', family: 'Financial Vulnerability', severity: 'High', definition: { official: 'Insufficient or absent emergency savings dedicated to medical expenses, forcing reliance on loans or informal borrowing.', customer: 'You have no dedicated savings for medical emergencies.', technical: 'Customer lacks accessible emergency funds for unexpected medical costs, relying on loans or family support.' }, businessContext: ['Personal', 'Family'], question: 'HLT_013', triggerAnswers: ['Loan', "I don't know"], penaltyScore: 15, impacts: ['Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-HL-003', riskCode: 'HL-CHRONIC-CONDITION', name: 'Unmanaged Chronic Health Condition', domain: 'Health', category: 'Medical History', subcategory: 'Pre-existing Conditions', family: 'Health Vulnerability', severity: 'High', definition: { official: 'Presence of chronic health conditions that require ongoing medical management and specialized insurance coverage.', customer: 'You have a chronic health condition that needs regular medical attention.', technical: 'Customer reports diagnosed chronic condition requiring ongoing treatment and specialized coverage.' }, businessContext: ['Personal', 'Family'], question: 'HLT_014', triggerAnswers: ['Hypertension', 'Diabetes', 'Asthma'], penaltyScore: 15, impacts: ['Health', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-HL-004', riskCode: 'HL-INFREQUENT-CHECKUPS', name: 'Infrequent Health Screenings', domain: 'Health', category: 'Preventive Care', subcategory: 'Check-up Frequency', family: 'Preventable Risk', severity: 'Moderate', definition: { official: 'Irregular or absent preventive health screenings, reducing early detection of potential health issues.', customer: 'You do not attend regular health check-ups.', technical: 'Customer reports infrequent preventive health screenings, limiting early disease detection.' }, businessContext: ['Personal', 'Family'], question: 'HLT_015', triggerAnswers: ['Rarely/Only when sick'], penaltyScore: 10, impacts: ['Health'], detectability: 'High', preventability: 'High', recoverability: 'High' },
    { riskId: 'RISK-HL-005', riskCode: 'HL-INADEQUATE-SURGERY-COVER', name: 'Inadequate Surgery Coverage', domain: 'Health', category: 'Recovery Readiness', subcategory: 'Surgical Cover', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Insufficient insurance coverage for major surgical procedures, creating catastrophic financial exposure.', customer: 'Your current cover is inadequate for major surgical procedures.', technical: 'Customer lacks or is uncertain about surgical procedure coverage under current health plan.' }, businessContext: ['Personal', 'Family'], question: 'HLT_016', triggerAnswers: ['No', 'Not sure'], penaltyScore: 20, impacts: ['Financial', 'Health'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' },
    { riskId: 'RISK-HL-006', riskCode: 'HL-NO-INCOME-PROTECTION', name: 'No Income Protection During Illness', domain: 'Health', category: 'Recovery Readiness', subcategory: 'Financial Resilience', family: 'Financial Vulnerability', severity: 'Critical', definition: { official: 'Lack of financial protection if the primary earner cannot work due to illness or injury.', customer: 'Your household would struggle financially if you became ill and could not work.', technical: 'Customer reports no income protection or sick pay coverage for extended illness absence.' }, businessContext: ['Personal', 'Family'], question: 'HLT_017', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' }
  ],
  INC: [
    { riskId: 'RISK-IN-001', riskCode: 'IN-NO-EMERGENCY-SAVINGS', name: 'No Emergency Savings', domain: 'Financial', category: 'Financial Preparedness', subcategory: 'Emergency Savings', family: 'Financial Vulnerability', severity: 'Critical', definition: { official: 'Insufficient liquid savings to cover essential expenses during income disruption.', customer: 'Your savings would cover less than one month of expenses.', technical: 'Customer has less than one month of essential expenses in liquid savings.' }, businessContext: ['Personal', 'Family'], question: 'INC_012', triggerAnswers: ['Less than 1 month'], penaltyScore: 25, impacts: ['Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-IN-002', riskCode: 'IN-INCOME-INSTABILITY', name: 'Income Instability', domain: 'Financial', category: 'Income Security', subcategory: 'Employment Risk', family: 'Income Vulnerability', severity: 'High', definition: { official: 'Uncertain or unstable income stream creating vulnerability to financial disruption.', customer: 'Your household is vulnerable to income disruption.', technical: 'Customer lacks confidence in income stability over the near term.' }, businessContext: ['Personal', 'Family'], question: 'INC_013', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Financial'], detectability: 'Medium', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-IN-003', riskCode: 'IN-NO-INCOME-INSURANCE', name: 'No Income Protection Insurance', domain: 'Financial', category: 'Income Security', subcategory: 'Insurance', family: 'Protection Gap', severity: 'High', definition: { official: 'Absence of income protection insurance to replace earnings during disability or illness.', customer: 'You have no insurance to replace your income if you cannot work.', technical: 'Customer does not hold any income protection or disability insurance policy.' }, businessContext: ['Personal', 'Family'], question: 'INC_014', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' },
    { riskId: 'RISK-IN-004', riskCode: 'IN-HIGH-DEBT-EXPOSURE', name: 'High Debt Exposure', domain: 'Financial', category: 'Debt Management', subcategory: 'Liability Risk', family: 'Financial Vulnerability', severity: 'High', definition: { official: 'Significant debt obligations that depend on continued income for repayment.', customer: 'Your debts depend on continued income, creating financial vulnerability.', technical: 'Customer has significant debt obligations requiring ongoing income to service.' }, businessContext: ['Personal', 'Family'], question: 'INC_015', triggerAnswers: ['Yes'], penaltyScore: 15, impacts: ['Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' }
  ],
  FAM: [
    { riskId: 'RISK-FM-001', riskCode: 'FM-MULTIPLE-DEPENDENTS', name: 'Multiple Dependents Exposure', domain: 'Personal', category: 'Family Structure', subcategory: 'Dependents', family: 'Family Vulnerability', severity: 'Moderate', definition: { official: 'Multiple dependents creating increased financial pressure and cumulative risk exposure.', customer: 'Multiple dependents increase your family\'s financial pressure.', technical: 'Customer has three or more dependents, amplifying financial and protection needs.' }, businessContext: ['Family'], question: 'FAM_011', triggerAnswers: ['3 or more'], penaltyScore: 10, impacts: ['Financial'], detectability: 'High', preventability: 'Low', recoverability: 'Medium' },
    { riskId: 'RISK-FM-002', riskCode: 'FM-LOW-INCOME-BUFFER', name: 'Low Family Income Buffer', domain: 'Financial', category: 'Financial Preparedness', subcategory: 'Emergency Savings', family: 'Financial Vulnerability', severity: 'Critical', definition: { official: 'Insufficient family savings to maintain stability during income disruption.', customer: 'Your family would struggle within three months of income loss.', technical: 'Family has less than three months of essential expenses in accessible savings.' }, businessContext: ['Family'], question: 'FAM_012', triggerAnswers: ['Less than 3 months'], penaltyScore: 22, impacts: ['Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-FM-003', riskCode: 'FM-NO-FAMILY-INSURANCE', name: 'No Family Insurance Protection', domain: 'Personal', category: 'Family Protection', subcategory: 'Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Lack of adequate insurance coverage for the family unit.', customer: 'Your family lacks adequate insurance protection.', technical: 'Customer has no or inadequate insurance coverage for family protection needs.' }, businessContext: ['Family'], question: 'FAM_013', triggerAnswers: ['No', 'Not sure'], penaltyScore: 20, impacts: ['Financial', 'Health'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-FM-004', riskCode: 'FM-NO-EDUCATION-FUNDING', name: 'No Education Funding Plan', domain: 'Financial', category: 'Future Planning', subcategory: 'Education Savings', family: 'Planning Gap', severity: 'High', definition: { official: 'Children\'s education costs are not secured through savings or insurance.', customer: 'Your children\'s education costs are not yet funded.', technical: 'Customer has no education savings plan or education insurance in place.' }, businessContext: ['Family'], question: 'FAM_014', triggerAnswers: ['No'], penaltyScore: 15, impacts: ['Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-FM-005', riskCode: 'FM-NO-FAMILY-HEALTH', name: 'No Family Health Insurance', domain: 'Health', category: 'Healthcare Access', subcategory: 'Family Cover', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Absence of comprehensive health insurance coverage for all family members.', customer: 'Your family does not have comprehensive health insurance.', technical: 'Customer lacks health insurance covering all family members.' }, businessContext: ['Family'], question: 'FAM_015', triggerAnswers: ['No'], penaltyScore: 22, impacts: ['Health', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' }
  ],
  RET: [
    { riskId: 'RISK-RT-001', riskCode: 'RT-UNPREPARED-RETIREMENT', name: 'Approaching Retirement Unprepared', domain: 'Financial', category: 'Retirement Planning', subcategory: 'Retirement Timing', family: 'Planning Gap', severity: 'Critical', definition: { official: 'Approaching retirement age without adequate financial preparation or savings.', customer: 'You are approaching retirement with insufficient preparation.', technical: 'Customer within 5 years of retirement age with inadequate retirement savings.' }, businessContext: ['Personal'], question: 'RET_011', triggerAnswers: ['Within 5 years'], penaltyScore: 20, impacts: ['Financial', 'Lifestyle'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' },
    { riskId: 'RISK-RT-002', riskCode: 'RT-NO-PENSION', name: 'No Pension Savings', domain: 'Financial', category: 'Retirement Planning', subcategory: 'Pension', family: 'Planning Gap', severity: 'Critical', definition: { official: 'No dedicated pension or retirement savings account established.', customer: 'You have no pension or retirement savings account.', technical: 'Customer has not opened or contributed to any pension or retirement savings vehicle.' }, businessContext: ['Personal'], question: 'RET_012', triggerAnswers: ['No'], penaltyScore: 25, impacts: ['Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-RT-003', riskCode: 'RT-NO-LONG-TERM-CARE', name: 'No Long-term Care Plan', domain: 'Health', category: 'Retirement Planning', subcategory: 'Healthcare', family: 'Planning Gap', severity: 'High', definition: { official: 'Absence of planning or insurance for long-term care or critical illness needs in retirement.', customer: 'You have no plan for long-term care or critical illness needs.', technical: 'Customer lacks long-term care insurance or critical illness cover for retirement.' }, businessContext: ['Personal'], question: 'RET_014', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Health', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' },
    { riskId: 'RISK-RT-004', riskCode: 'RT-DEPENDENTS-UNSECURED', name: 'Dependents Not Financially Secured', domain: 'Financial', category: 'Retirement Planning', subcategory: 'Legacy Planning', family: 'Planning Gap', severity: 'High', definition: { official: 'Spouse or dependents lack financial security arrangements after the customer\'s passing.', customer: 'Your dependents are not financially secured after you.', technical: 'Customer has not arranged life insurance or estate planning for dependents.' }, businessContext: ['Personal', 'Family'], question: 'RET_015', triggerAnswers: ['No'], penaltyScore: 15, impacts: ['Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' }
  ],
  YPR: [
    { riskId: 'RISK-YP-001', riskCode: 'YP-CANNOT-COVER-ILLNESS', name: 'Cannot Cover Critical Illness Costs', domain: 'Financial', category: 'Financial Preparedness', subcategory: 'Emergency Funding', family: 'Financial Vulnerability', severity: 'Critical', definition: { official: 'Inability to cover critical illness expenses from personal resources.', customer: 'You would struggle to cover critical illness costs.', technical: 'Customer reports inability to fund critical illness treatment without financial hardship.' }, businessContext: ['Personal'], question: 'YPR_012', triggerAnswers: ['No', 'With difficulty'], penaltyScore: 20, impacts: ['Financial', 'Health'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-YP-002', riskCode: 'YP-INCOME-INSTABILITY', name: 'Income Instability Risk', domain: 'Financial', category: 'Income Security', subcategory: 'Employment Risk', family: 'Income Vulnerability', severity: 'High', definition: { official: 'Household would struggle to maintain stability without the primary earner\'s income.', customer: 'Your household relies heavily on your income.', technical: 'Customer\'s household has limited financial resilience if primary income is disrupted.' }, businessContext: ['Personal'], question: 'YPR_013', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Financial'], detectability: 'Medium', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-YP-003', riskCode: 'YP-NO-PERSONAL-INSURANCE', name: 'No Personal Health Insurance', domain: 'Health', category: 'Healthcare Access', subcategory: 'Personal Cover', family: 'Protection Gap', severity: 'High', definition: { official: 'Absence of personal health or accident insurance coverage.', customer: 'You have no personal health or accident insurance.', technical: 'Customer does not hold any personal health or accident insurance policy.' }, businessContext: ['Personal'], question: 'YPR_014', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Health', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' }
  ],
  ENT: [
    { riskId: 'RISK-EN-001', riskCode: 'EN-KEY-PERSON-DEPENDENCY', name: 'Complete Key-Person Dependency', domain: 'Business', category: 'Business Continuity', subcategory: 'Key Person Risk', family: 'Operational Risk', severity: 'Critical', definition: { official: 'Business completely depends on the owner\'s personal involvement for operations.', customer: 'Your business completely depends on your personal involvement.', technical: 'Business operations would cease or be severely impaired without owner\'s direct involvement.' }, businessContext: ['Entrepreneur', 'SME'], question: 'ENT_011', triggerAnswers: ['Yes completely'], penaltyScore: 20, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' },
    { riskId: 'RISK-EN-002', riskCode: 'EN-PERSONAL-GUARANTEE', name: 'Personal Guarantee Exposure', domain: 'Legal', category: 'Legal & Liability', subcategory: 'Personal Liability', family: 'Legal Risk', severity: 'High', definition: { official: 'Personal guarantees for business debts create personal financial risk beyond the business.', customer: 'Your personal assets are at risk due to business debts.', technical: 'Customer has provided personal guarantees for business obligations, creating personal financial exposure.' }, businessContext: ['Entrepreneur', 'SME'], question: 'ENT_012', triggerAnswers: ['Yes'], penaltyScore: 15, impacts: ['Financial', 'Legal'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-EN-003', riskCode: 'EN-BUSINESS-SURVIVAL-RISK', name: 'Business Cannot Survive Without Owner', domain: 'Business', category: 'Business Continuity', subcategory: 'Succession Risk', family: 'Operational Risk', severity: 'Critical', definition: { official: 'Business would not survive more than three months without the owner\'s active involvement.', customer: 'Your business would not survive without you.', technical: 'Business lacks the operational resilience to continue beyond three months without the owner.' }, businessContext: ['Entrepreneur', 'SME'], question: 'ENT_013', triggerAnswers: ['No', 'Not sure'], penaltyScore: 22, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Low' },
    { riskId: 'RISK-EN-004', riskCode: 'EN-NO-KEY-PERSON-INSURANCE', name: 'No Key Person Insurance', domain: 'Business', category: 'Employee Protection', subcategory: 'Key Person', family: 'Protection Gap', severity: 'High', definition: { official: 'No key person insurance to protect the business if a critical team member becomes incapacitated.', customer: 'Your business lacks key person insurance.', technical: 'Customer has not secured key person insurance for critical business roles.' }, businessContext: ['Entrepreneur', 'SME'], question: 'ENT_014', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Financial', 'Operational'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-EN-005', riskCode: 'EN-NO-ASSET-SEPARATION', name: 'No Personal-Business Asset Separation', domain: 'Legal', category: 'Asset Protection', subcategory: 'Legal Structure', family: 'Legal Risk', severity: 'High', definition: { official: 'Personal and business assets are not legally separated, creating personal financial risk.', customer: 'Your personal and business assets are not separated.', technical: 'Customer has not established legal separation between personal and business assets.' }, businessContext: ['Entrepreneur', 'SME'], question: 'ENT_015', triggerAnswers: ['No', 'Not sure'], penaltyScore: 15, impacts: ['Financial', 'Legal'], detectability: 'High', preventability: 'High', recoverability: 'Medium' }
  ],
  HOM: [
    { riskId: 'RISK-HM-001', riskCode: 'HM-NO-HOME-INSURANCE', name: 'No Home Insurance', domain: 'Property', category: 'Property Protection', subcategory: 'Home Cover', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Absence of homeowner\'s or renter\'s insurance for property and contents.', customer: 'Your home and contents are not insured.', technical: 'Customer has no active home or contents insurance policy.' }, businessContext: ['Personal', 'Family'], question: 'HOM_012', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  MOT: [
    { riskId: 'RISK-MT-001', riskCode: 'MT-NO-MOTOR-INSURANCE', name: 'No Comprehensive Motor Insurance', domain: 'Property', category: 'Vehicle Protection', subcategory: 'Motor Cover', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Primary vehicle is not covered by comprehensive motor insurance.', customer: 'Your primary vehicle lacks comprehensive insurance.', technical: 'Customer\'s primary vehicle is not covered by comprehensive motor insurance.' }, businessContext: ['Personal', 'Family'], question: 'MOT_012', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  SCH: [
    { riskId: 'RISK-SC-001', riskCode: 'SC-HIGH-STUDENT-EXPOSURE', name: 'High Student Population Exposure', domain: 'Business', category: 'Operations', subcategory: 'Student Safety', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Large student population increases cumulative liability and safety exposure.', customer: 'Your large student body creates significant safety and liability exposure.', technical: 'Educational institution has over 500 students, increasing liability risk.' }, businessContext: ['School'], question: 'SCH_013', triggerAnswers: ['Over 500'], penaltyScore: 12, impacts: ['Legal', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-SC-002', riskCode: 'SC-NO-LIABILITY-INSURANCE', name: 'No Public Liability Insurance', domain: 'Legal', category: 'Legal & Liability', subcategory: 'Public Liability', family: 'Legal Risk', severity: 'Critical', definition: { official: 'No insurance coverage if a student or visitor is injured on school premises.', customer: 'Your school lacks liability insurance for injuries.', technical: 'Educational institution has no public liability insurance covering student or visitor injuries.' }, businessContext: ['School'], question: 'SCH_016', triggerAnswers: ['No'], penaltyScore: 22, impacts: ['Legal', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-SC-003', riskCode: 'SC-NO-FIRE-INSURANCE', name: 'No Building Fire Insurance', domain: 'Property', category: 'Asset Protection', subcategory: 'Property Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'School buildings and facilities are not protected by fire insurance.', customer: 'Your school buildings lack fire insurance.', technical: 'Educational institution has no fire insurance for its buildings and facilities.' }, businessContext: ['School'], question: 'SCH_017', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  MFG: [
    { riskId: 'RISK-MF-001', riskCode: 'MF-LARGE-WORKFORCE', name: 'Large Workforce Liability Exposure', domain: 'Business', category: 'Workforce', subcategory: 'Employee Liability', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Large workforce creates significant employment liability and compliance exposure.', customer: 'Your large workforce increases liability exposure.', technical: 'Manufacturing operation with over 200 employees faces significant employment liability.' }, businessContext: ['Manufacturing'], question: 'MFG_013', triggerAnswers: ['200+'], penaltyScore: 12, impacts: ['Legal', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-MF-002', riskCode: 'MF-NO-EQUIPMENT-REDUNDANCY', name: 'No Critical Equipment Redundancy', domain: 'Business', category: 'Operations', subcategory: 'Equipment Risk', family: 'Operational Risk', severity: 'Critical', definition: { official: 'Critical machine breakdown would halt production immediately without backup.', customer: 'A machine breakdown would halt your production immediately.', technical: 'Manufacturing operation lacks backup or redundancy for critical production equipment.' }, businessContext: ['Manufacturing'], question: 'MFG_014', triggerAnswers: ['Immediately'], penaltyScore: 18, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-MF-003', riskCode: 'MF-NO-FACILITY-INSURANCE', name: 'No Facility Insurance', domain: 'Property', category: 'Asset Protection', subcategory: 'Property Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Manufacturing facility is not covered by fire and special perils insurance.', customer: 'Your facility lacks fire and disaster insurance.', technical: 'Manufacturing facility has no fire or special perils insurance coverage.' }, businessContext: ['Manufacturing'], question: 'MFG_016', triggerAnswers: ['No'], penaltyScore: 22, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-MF-004', riskCode: 'MF-NO-DISASTER-RECOVERY', name: 'No Disaster Recovery Plan', domain: 'Business', category: 'Business Continuity', subcategory: 'Disaster Recovery', family: 'Operational Risk', severity: 'Critical', definition: { official: 'Business would not survive or would struggle to recover from a major disaster or prolonged closure.', customer: 'Your business would struggle to survive a major disaster.', technical: 'Manufacturing operation lacks business continuity and disaster recovery capabilities.' }, businessContext: ['Manufacturing'], question: 'MFG_017', triggerAnswers: ['No, we would close', 'With difficulty'], penaltyScore: 22, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  HOS: [
    { riskId: 'RISK-HO-001', riskCode: 'HO-HIGH-PATIENT-EXPOSURE', name: 'High Patient Volume Liability', domain: 'Business', category: 'Operations', subcategory: 'Patient Safety', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Large patient volume increases medical liability and safety exposure.', customer: 'Your high patient volume creates significant liability exposure.', technical: 'Healthcare facility handles over 100 patients, increasing medical liability risk.' }, businessContext: ['Hospital'], question: 'HOS_013', triggerAnswers: ['Over 100'], penaltyScore: 12, impacts: ['Legal', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-HO-002', riskCode: 'HO-NO-MEDICAL-LIABILITY', name: 'No Medical Malpractice Insurance', domain: 'Legal', category: 'Legal & Liability', subcategory: 'Medical Liability', family: 'Legal Risk', severity: 'Critical', definition: { official: 'No professional indemnity or medical malpractice insurance for the healthcare facility.', customer: 'Your facility lacks medical malpractice insurance.', technical: 'Healthcare facility has no professional indemnity or medical malpractice coverage.' }, businessContext: ['Hospital'], question: 'HOS_015', triggerAnswers: ['No'], penaltyScore: 25, impacts: ['Legal', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-HO-003', riskCode: 'HO-HIGH-VALUE-EQUIPMENT', name: 'High-Value Medical Equipment Risk', domain: 'Property', category: 'Equipment', subcategory: 'Asset Value', family: 'Asset Risk', severity: 'Moderate', definition: { official: 'High-value medical equipment on site requires specialized insurance coverage.', customer: 'Your expensive medical equipment needs specialized insurance.', technical: 'Healthcare facility has high-value medical equipment requiring specialized coverage.' }, businessContext: ['Hospital'], question: 'HOS_016', triggerAnswers: ['Yes'], penaltyScore: 10, impacts: ['Financial', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-HO-004', riskCode: 'HO-NO-EQUIPMENT-INSURANCE', name: 'No Medical Equipment Insurance', domain: 'Property', category: 'Asset Protection', subcategory: 'Equipment Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'No insurance coverage for critical life-support and medical equipment damage.', customer: 'Your medical equipment lacks insurance coverage.', technical: 'Healthcare facility has no all-risks equipment insurance covering breakdown and damage.' }, businessContext: ['Hospital'], question: 'HOS_017', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial', 'Operational'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  CHR: [
    { riskId: 'RISK-CH-001', riskCode: 'CH-LARGE-CONGREGATION', name: 'Large Congregation Liability', domain: 'Business', category: 'Operations', subcategory: 'Event Safety', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Large congregation creates significant liability during gatherings and events.', customer: 'Your large congregation creates liability exposure.', technical: 'Religious organization with over 1,000 congregants faces significant gathering liability.' }, businessContext: ['Church'], question: 'CHR_013', triggerAnswers: ['Over 1000'], penaltyScore: 12, impacts: ['Legal', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-CH-002', riskCode: 'CH-VALUABLE-ASSETS', name: 'Valuable Church Assets Unprotected', domain: 'Property', category: 'Assets', subcategory: 'Valuable Items', family: 'Asset Risk', severity: 'Moderate', definition: { official: 'Valuable musical instruments, broadcast equipment, and other assets require specialized insurance.', customer: 'Your valuable church assets need specialized insurance.', technical: 'Religious organization has valuable instruments and equipment requiring specific coverage.' }, businessContext: ['Church'], question: 'CHR_014', triggerAnswers: ['Yes'], penaltyScore: 10, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-CH-003', riskCode: 'CH-NO-EVENT-LIABILITY', name: 'No Event Liability Insurance', domain: 'Legal', category: 'Legal & Liability', subcategory: 'Public Liability', family: 'Legal Risk', severity: 'Critical', definition: { official: 'No insurance if a congregant or visitor is injured on church premises.', customer: 'Your church lacks liability insurance for injuries.', technical: 'Religious organization has no public liability insurance for premises and events.' }, businessContext: ['Church'], question: 'CHR_015', triggerAnswers: ['No'], penaltyScore: 22, impacts: ['Legal', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-CH-004', riskCode: 'CH-NO-BUILDING-INSURANCE', name: 'No Church Building Insurance', domain: 'Property', category: 'Property Protection', subcategory: 'Building Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Church building and contents are not covered by fire insurance.', customer: 'Your church building and contents lack fire insurance.', technical: 'Religious organization has no fire insurance for its building and contents.' }, businessContext: ['Church'], question: 'CHR_017', triggerAnswers: ['No'], penaltyScore: 20, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  CON: [
    { riskId: 'RISK-CN-001', riskCode: 'CN-HIGH-PROJECT-EXPOSURE', name: 'High Concurrent Project Exposure', domain: 'Business', category: 'Operations', subcategory: 'Project Management', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Managing many concurrent construction projects increases cumulative risk exposure.', customer: 'Managing many projects at once increases your risk.', technical: 'Construction company manages more than 5 concurrent projects, amplifying risk exposure.' }, businessContext: ['Construction'], question: 'CON_013', triggerAnswers: ['More than 5'], penaltyScore: 12, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-CN-002', riskCode: 'CN-HEAVY-MACHINERY', name: 'Heavy Machinery Operational Risk', domain: 'Business', category: 'Equipment', subcategory: 'Heavy Machinery', family: 'Operational Risk', severity: 'High', definition: { official: 'Heavy machinery on-site creates significant liability and damage risk.', customer: 'Your heavy machinery creates significant risk on-site.', technical: 'Construction operation uses heavy machinery requiring specialized insurance coverage.' }, businessContext: ['Construction'], question: 'CON_014', triggerAnswers: ['Yes'], penaltyScore: 15, impacts: ['Operational', 'Legal', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-CN-003', riskCode: 'CN-NO-CONTRACTOR-INSURANCE', name: 'No Contractor All-Risk Insurance', domain: 'Property', category: 'Insurance', subcategory: 'Contractor Cover', family: 'Protection Gap', severity: 'Critical', definition: { official: 'No contractor\'s all-risk or works insurance for construction projects.', customer: 'Your construction projects lack all-risk insurance.', technical: 'Construction company has no contractor\'s all-risk insurance covering works in progress.' }, businessContext: ['Construction'], question: 'CON_015', triggerAnswers: ['No'], penaltyScore: 22, impacts: ['Financial', 'Legal'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-CN-004', riskCode: 'CN-NO-ACCIDENT-COVER', name: 'No Worker Accident Cover', domain: 'Legal', category: 'Worker Protection', subcategory: 'Personal Accident', family: 'Legal Risk', severity: 'High', definition: { official: 'No group personal accident cover for on-site construction workers.', customer: 'Your on-site workers lack accident insurance.', technical: 'Construction company has no group personal accident cover for on-site workers.' }, businessContext: ['Construction'], question: 'CON_016', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Legal', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-CN-005', riskCode: 'CN-NO-PENALTY-PROTECTION', name: 'No Delay Penalty Protection', domain: 'Legal', category: 'Contractual Risk', subcategory: 'Penalty Protection', family: 'Legal Risk', severity: 'Moderate', definition: { official: 'No contractual protection against project delay penalties.', customer: 'Your contracts lack delay penalty protection.', technical: 'Construction company has no protection against liquidated damages or delay penalties.' }, businessContext: ['Construction'], question: 'CON_017', triggerAnswers: ['No'], penaltyScore: 12, impacts: ['Financial', 'Legal'], detectability: 'Medium', preventability: 'High', recoverability: 'Medium' }
  ],
  TRN: [
    { riskId: 'RISK-TR-001', riskCode: 'TR-LARGE-FLEET', name: 'Large Fleet Risk Exposure', domain: 'Business', category: 'Fleet Management', subcategory: 'Fleet Size', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Large vehicle fleet creates significant cumulative risk exposure.', customer: 'Your large fleet creates significant risk exposure.', technical: 'Transport operation with over 20 vehicles faces substantial fleet risk.' }, businessContext: ['Transport'], question: 'TRN_013', triggerAnswers: ['Over 20'], penaltyScore: 12, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-TR-002', riskCode: 'TR-NO-GOODS-INSURANCE', name: 'No Goods-in-Transit Insurance', domain: 'Property', category: 'Fleet Insurance', subcategory: 'Cargo Cover', family: 'Protection Gap', severity: 'High', definition: { official: 'No insurance coverage for goods being transported.', customer: 'Your goods in transit are not insured.', technical: 'Transport company has no goods-in-transit insurance coverage.' }, businessContext: ['Transport'], question: 'TRN_015', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Financial', 'Legal'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-TR-003', riskCode: 'TR-NO-DRIVER-ACCIDENT-COVER', name: 'No Driver Accident Cover', domain: 'Legal', category: 'Worker Protection', subcategory: 'Driver Safety', family: 'Legal Risk', severity: 'High', definition: { official: 'No group personal accident cover for drivers.', customer: 'Your drivers lack accident insurance.', technical: 'Transport company has no group personal accident cover for its drivers.' }, businessContext: ['Transport'], question: 'TRN_016', triggerAnswers: ['No'], penaltyScore: 18, impacts: ['Legal', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Medium' },
    { riskId: 'RISK-TR-004', riskCode: 'TR-NO-COMPREHENSIVE-MOTOR', name: 'Vehicles Not Comprehensively Insured', domain: 'Property', category: 'Motor Compliance', subcategory: 'Insurance Coverage', family: 'Protection Gap', severity: 'Critical', definition: { official: 'Fleet vehicles are not covered by comprehensive motor insurance.', customer: 'Your fleet vehicles lack comprehensive insurance.', technical: 'Transport company\'s vehicles are not comprehensively insured.' }, businessContext: ['Transport'], question: 'TRN_017', triggerAnswers: ['No', 'Some of them'], penaltyScore: 20, impacts: ['Financial', 'Legal', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ],
  SME: [
    { riskId: 'RISK-SM-001', riskCode: 'SM-LARGE-WORKFORCE', name: 'Large Workforce Liability', domain: 'Business', category: 'Workforce', subcategory: 'Employee Liability', family: 'Operational Risk', severity: 'Moderate', definition: { official: 'Large workforce with significant employment liability exposure.', customer: 'Your workforce size creates liability exposure.', technical: 'SME with over 50 employees faces substantial employment liability risk.' }, businessContext: ['SME', 'Business'], question: 'SME_013', triggerAnswers: ['51+'], penaltyScore: 12, impacts: ['Legal', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-SM-002', riskCode: 'SM-HIGH-REVENUE-EXPOSURE', name: 'High Revenue Financial Exposure', domain: 'Financial', category: 'Financial Exposure', subcategory: 'Revenue Risk', family: 'Financial Vulnerability', severity: 'Moderate', definition: { official: 'High revenue business with significant financial exposure requiring adequate insurance.', customer: 'Your high revenue creates significant financial exposure.', technical: 'SME with revenue over ₦200M requires commensurate insurance coverage.' }, businessContext: ['SME', 'Business'], question: 'SME_014', triggerAnswers: ['Over ₦200M'], penaltyScore: 12, impacts: ['Financial', 'Operational'], detectability: 'High', preventability: 'Medium', recoverability: 'Medium' },
    { riskId: 'RISK-SM-003', riskCode: 'SM-NO-PROPERTY-INSURANCE', name: 'No Business Property Insurance', domain: 'Property', category: 'Asset Protection', subcategory: 'Property Insurance', family: 'Protection Gap', severity: 'Critical', definition: { official: 'No fire and burglary insurance for business premises and assets.', customer: 'Your business lacks property insurance.', technical: 'SME has no fire or burglary insurance for business premises and contents.' }, businessContext: ['SME', 'Business'], question: 'SME_016', triggerAnswers: ['No'], penaltyScore: 22, impacts: ['Financial', 'Property'], detectability: 'High', preventability: 'High', recoverability: 'Low' },
    { riskId: 'RISK-SM-004', riskCode: 'SM-NO-DISASTER-SURVIVAL', name: 'No Disaster Survival Plan', domain: 'Business', category: 'Business Continuity', subcategory: 'Disaster Recovery', family: 'Operational Risk', severity: 'Critical', definition: { official: 'Business would not survive or would struggle to recover from a prolonged closure.', customer: 'Your business would struggle to survive a major disruption.', technical: 'SME lacks business continuity plan and would not survive extended closure.' }, businessContext: ['SME', 'Business'], question: 'SME_017', triggerAnswers: ['No, we would close', 'With difficulty'], penaltyScore: 22, impacts: ['Operational', 'Financial'], detectability: 'High', preventability: 'High', recoverability: 'Low' }
  ]
};

const getPenaltyForAnswer = (qConfig, answer) => {
  const scores = qConfig.scores || {};
  const score = scores[answer];
  if (score === undefined) return 5;
  if (score === 0) return 25;
  if (score <= 25) return 20;
  if (score <= 50) return 15;
  if (score <= 80) return 8;
  return 0;
};

const getSeverityForScore = (score) => {
  if (score === undefined) return 'Moderate';
  if (score === 0) return 'Critical';
  if (score <= 30) return 'High';
  if (score <= 60) return 'Moderate';
  return 'Low';
};

const buildRiskObject = (meta, prefix, scoringConfig) => {
  const qConfig = scoringConfig.questions[meta.question];

  const questionRefs = [];
  if (qConfig) {
    questionRefs.push({
      questionId: meta.question,
      weight: qConfig.weight || 10,
      purpose: 'Primary Indicator',
      category: qConfig.category || 'General'
    });
  }

  const triggerRules = meta.triggerAnswers.map(answer => ({
    condition: { question: meta.question, equals: answer },
    severity: meta.severity,
    penalty: meta.penaltyScore,
    priority: meta.severity === 'Critical' ? 'Immediate' : meta.severity === 'High' ? 'High' : 'Medium'
  }));

  const riskRecs = [];
  if (qConfig && qConfig.recommendations) {
    for (const [answer, recText] of Object.entries(qConfig.recommendations)) {
      if (meta.triggerAnswers.includes(answer)) {
        riskRecs.push({
          recommendationCode: `REC-${prefix}-${meta.riskId.split('-').pop().padStart(3, '0')}`,
          name: recText.length > 60 ? recText.substring(0, 57) + '...' : recText,
          priority: meta.severity === 'Critical' ? 'Immediate' : 'High',
          expectedScoreGain: Math.min(Math.round(meta.penaltyScore / 2), 15),
          description: recText
        });
      }
    }
  }

  const indicators = [];
  if (qConfig) {
    for (const [optText, score] of Object.entries(qConfig.scores || {})) {
      if (meta.triggerAnswers.includes(optText) || score <= 50) {
        indicators.push({
          name: `${meta.name} - ${optText}`,
          question: meta.question,
          answer: optText,
          resilienceScore: score,
          severity: getSeverityForScore(score)
        });
      }
    }
  }

  const relatedModifiers = [];
  if (scoringConfig && scoringConfig.modifiers) {
    for (const mod of scoringConfig.modifiers) {
      const involvesRisk = mod.conditions.some(([qId]) => qId === meta.question);
      if (involvesRisk) {
        relatedModifiers.push({
          modifierId: mod.id,
          name: mod.name,
          impact: (mod.bonus || 0) - (mod.penalty || 0),
          description: mod.description
        });
      }
    }
  }

  const improvementSteps = [];
  if (scoringConfig && scoringConfig.improvements && scoringConfig.improvements[meta.question]) {
    for (const [fromAns, imp] of Object.entries(scoringConfig.improvements[meta.question])) {
      improvementSteps.push({
        from: fromAns,
        to: imp.target,
        gain: imp.gain,
        action: imp.action
      });
    }
  }

  const academyLinks = [];
  const marketplaceLinks = [];

  return {
    riskId: meta.riskId,
    riskCode: meta.riskCode,
    name: meta.name,
    shortName: meta.name,
    version: '1.0',
    status: 'Active',
    domain: meta.domain,
    category: meta.category,
    subcategory: meta.subcategory || 'General',
    riskFamily: meta.family || 'General',
    riskType: meta.severity === 'Critical' ? 'Critical' : 'Standard',
    classification: {
      domain: meta.domain,
      category: meta.category,
      subcategory: meta.subcategory || 'General',
      family: meta.family || 'General'
    },
    definition: {
      official: meta.definition.official,
      customer: meta.definition.customer,
      technical: meta.definition.technical,
      whyItMatters: meta.definition.customer
    },
    businessContext: meta.businessContext || ['General'],
    characteristics: {
      severityRange: meta.severity,
      likelihood: 'Configurable',
      impactAreas: meta.impacts || ['Financial'],
      detectability: meta.detectability || 'High',
      preventability: meta.preventability || 'Medium',
      recoverability: meta.recoverability || 'Medium',
      timeHorizon: meta.severity === 'Critical' ? 'Immediate' : 'Long-term'
    },
    assessmentMapping: {
      applicablePacks: [prefix],
      requiredQuestions: [meta.question],
      optionalQuestions: [],
      confidenceThreshold: 50
    },
    questionReferences: questionRefs,
    indicators,
    scoreRules: {
      maxPenalty: meta.penaltyScore,
      criticalThreshold: meta.severity === 'Critical',
      weight: qConfig ? (qConfig.weight || 10) : 10,
      triggerRules,
      severityMapping: {
        Critical: { minPenalty: 20, maxPenalty: 25 },
        High: { minPenalty: 15, maxPenalty: 19 },
        Moderate: { minPenalty: 8, maxPenalty: 14 },
        Low: { minPenalty: 0, maxPenalty: 7 }
      }
    },
    dependencies: relatedModifiers.map(m => ({
      modifierId: m.modifierId,
      name: m.name,
      impact: m.impact,
      type: m.impact >= 0 ? 'bonus' : 'penalty'
    })),
    triggerRules,
    recommendations: riskRecs,
    academy: academyLinks,
    marketplace: marketplaceLinks,
    advisor: {
      conversationObjective: `Understand why the customer faces ${meta.name.toLowerCase()}.`,
      discoveryQuestions: [`What is the current situation regarding ${meta.name.toLowerCase()}?`],
      commonObjections: [],
      suggestedResponses: [],
      escalationRules: meta.severity === 'Critical' ? { advisorRequired: true, priority: 'Immediate' } : { advisorRequired: false, priority: 'Standard' }
    },
    aiContext: {
      definition: meta.definition.official,
      customerMeaning: meta.definition.customer,
      commonMisconceptions: [],
      relatedRisks: relatedModifiers.map(m => ({ name: m.name, relationship: 'compound' })),
      recommendedTone: 'Professional',
      approvedTerminology: [meta.name]
    },
    reportContent: {
      executiveSummary: `${meta.name} identified. ${meta.definition.customer}`,
      riskExplanation: meta.definition.official,
      impactStatement: `This affects ${(meta.impacts || ['Financial']).join(', ')} areas.`,
      recommendationNarrative: riskRecs.length > 0 ? riskRecs[0].description : '',
      educationalParagraph: `Understanding and addressing ${meta.name.toLowerCase()} is an important step toward improving your overall resilience.`
    },
    workflowEvents: [
      { event: 'RiskDetected', riskId: meta.riskId, severity: meta.severity },
      ...(meta.severity === 'Critical' ? [{ event: 'CriticalRiskDetected', riskId: meta.riskId }] : [])
    ],
    governance: {
      author: 'CoverScore Knowledge Engine',
      version: '1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Published'
    },
    versionHistory: [
      { version: '1.0', date: new Date().toISOString().split('T')[0], reason: 'Initial creation from scoring configuration', author: 'CoverScore Knowledge Engine' }
    ],
    _metadata: {
      question: meta.question,
      triggerAnswers: meta.triggerAnswers,
      prefix,
      penaltyScore: meta.penaltyScore,
      improvementSteps
    }
  };
};

class RiskObjectRegistry {
  constructor() {
    this._byId = new Map();
    this._byQuestion = new Map();
    this._byPrefix = new Map();
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    for (const [prefix, metaArray] of Object.entries(RISK_META)) {
      const config = scoringConfigs[prefix];
      const prefixRisks = [];
      for (const meta of metaArray) {
        const riskObj = buildRiskObject(meta, prefix, config);
        this._byId.set(riskObj.riskId, riskObj);
        prefixRisks.push(riskObj);

        if (meta.question) {
          if (!this._byQuestion.has(meta.question)) {
            this._byQuestion.set(meta.question, []);
          }
          this._byQuestion.get(meta.question).push(riskObj);
        }
      }
      this._byPrefix.set(prefix, prefixRisks);
    }
    this._initialized = true;
  }

  getRiskObject(riskId) {
    this.initialize();
    return this._byId.get(riskId) || null;
  }

  getRiskObjectsByQuestion(questionId) {
    this.initialize();
    return this._byQuestion.get(questionId) || [];
  }

  getRiskObjectsByPrefix(prefix) {
    this.initialize();
    return this._byPrefix.get(prefix) || [];
  }

  getAllRiskObjects() {
    this.initialize();
    return Array.from(this._byId.values());
  }

  getIdentifiedRisks(prefix, answers) {
    this.initialize();
    const risks = this.getRiskObjectsByPrefix(prefix);
    const identified = [];

    for (const risk of risks) {
      const meta = risk._metadata;
      if (!meta) continue;
      const answer = resolveAnswer(answers[meta.question]);
      if (answer && meta.triggerAnswers.includes(answer)) {
        const qConfig = scoringConfigs[prefix]?.questions?.[meta.question];
        const score = qConfig?.scores?.[answer];
        identified.push({
          riskId: risk.riskId,
          riskCode: risk.riskCode,
          name: risk.name,
          severity: risk.characteristics.severityRange,
          domain: risk.domain,
          category: risk.category,
          score: score !== undefined ? score : 0,
          penalty: risk.scoreRules.maxPenalty,
          definition: risk.definition.customer,
          recommendations: risk.recommendations,
          triggerQuestion: meta.question,
          triggerAnswer: answer
        });
      }
    }
    return identified.sort((a, b) => {
      const order = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
      return (order[a.severity] || 99) - (order[b.severity] || 99);
    });
  }

  getRiskGraph(riskId) {
    this.initialize();
    const risk = this._byId.get(riskId);
    if (!risk) return null;
    return {
      risk: { riskId: risk.riskId, name: risk.name, severity: risk.characteristics.severityRange },
      questions: risk.questionReferences.map(q => ({ questionId: q.questionId, weight: q.weight, purpose: q.purpose })),
      recommendations: risk.recommendations.map(r => ({ code: r.recommendationCode, name: r.name, priority: r.priority })),
      modifiers: risk.dependencies,
      improvements: risk._metadata?.improvementSteps || [],
      academy: risk.academy,
      marketplace: risk.marketplace
    };
  }

  explainRisk(riskId, answerGiven) {
    this.initialize();
    const risk = this._byId.get(riskId);
    if (!risk) return null;
    return {
      risk: risk.name,
      whatItMeans: risk.definition.customer,
      whyItMatters: risk.definition.official,
      yourAnswer: answerGiven || 'Unknown',
      impact: `This affects your ${risk.category} category.`,
      whatToDo: risk.recommendations.length > 0 ? risk.recommendations[0].description : 'Consult an advisor for next steps.',
      priority: risk.characteristics.severityRange === 'Critical' ? 'Address immediately' : 'Include in your financial plan'
    };
  }
}

const resolveAnswer = (answer) => {
  if (answer === null || answer === undefined) return null;
  if (Array.isArray(answer)) return answer[0];
  return answer;
};

module.exports = new RiskObjectRegistry();
