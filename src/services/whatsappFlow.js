/**
 * WhatsApp Flow State Machine for CoverScore AI
 * Encodes the entire exact script provided by the user.
 */

const getNextStateAndReply = (currentState, incomingText, currentData) => {
  let nextState = currentState;
  let replyText = '';
  let updatedData = { ...currentData };
  let isComplete = false;

  const normalizeInput = (text) => text.toUpperCase().trim();
  const input = normalizeInput(incomingText);

  // Helper to check standard YES/NO
  const isYesNo = (val) => val === 'YES' || val === 'NO';

  switch (currentState) {
    case 'welcome_name':
      updatedData.name = incomingText; // save original casing
      replyText = `Thank you, ${updatedData.name}.\n\nWhat's your email address?\nWe'll send your detailed report there after the assessment.`;
      nextState = 'welcome_email';
      break;

    case 'welcome_email':
      if (!input.includes('@')) {
        replyText = "Please enter a valid email address.";
      } else {
        updatedData.email = incomingText.toLowerCase().trim();
        replyText = "Great.\n\nWhich assessment would you like?\n\n1️⃣ Personal Risk Assessment\n2️⃣ Business Risk Assessment\n\nReply 1 or 2.";
        nextState = 'assessment_type';
      }
      break;

    case 'assessment_type':
      if (input === '1') {
        updatedData.entity_type = 'individual';
        replyText = "Which age group best describes you?\n\n1️⃣ Under 25\n2️⃣ 25–35\n3️⃣ 36–50\n4️⃣ 51–60\n5️⃣ Above 60";
        nextState = 'personal_q1';
      } else if (input === '2') {
        updatedData.entity_type = 'business';
        replyText = "What industry best describes your business?\n\n1️⃣ Retail\n2️⃣ Manufacturing\n3️⃣ Logistics\n4️⃣ Education\n5️⃣ Healthcare\n6️⃣ Professional Services\n7️⃣ Technology\n8️⃣ Other";
        nextState = 'business_q1';
      } else {
        replyText = "Please reply with 1 or 2.";
      }
      break;

    // ==========================================
    // PERSONAL FLOW
    // ==========================================
    case 'personal_q1':
      if (['1','2','3','4','5'].includes(input)) {
        const ageMap = {'1': 'under_25', '2': '25_35', '3': '36_50', '4': '51_60', '5': 'over_60'};
        updatedData.age_bracket = ageMap[input];
        replyText = "Which best describes your current situation?\n\n1️⃣ Employee\n2️⃣ Self-employed\n3️⃣ Business Owner\n4️⃣ Retired";
        nextState = 'personal_q2';
      } else { replyText = "Please reply with 1, 2, 3, 4, or 5."; }
      break;

    case 'personal_q2':
      if (['1','2','3','4'].includes(input)) {
        const sitMap = {'1': 'employee', '2': 'self_employed', '3': 'business_owner', '4': 'retired'};
        updatedData.employment_status = sitMap[input];
        replyText = "Do you have people who depend on your income?\n\nYES / NO";
        nextState = 'personal_q3';
      } else { replyText = "Please reply with 1, 2, 3, or 4."; }
      break;

    case 'personal_q3':
      if (input === 'YES') {
        updatedData.has_dependents = 'yes';
        replyText = "How many dependents rely on your income?\n\n1️⃣ 1–2\n2️⃣ 3–5\n3️⃣ More than 5";
        nextState = 'personal_q3a';
      } else if (input === 'NO') {
        updatedData.has_dependents = 'no';
        updatedData.dependents = '0';
        replyText = "Do you currently have life insurance?\n\nYES / NO";
        nextState = 'personal_q4';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'personal_q3a':
      if (['1','2','3'].includes(input)) {
        const depMap = {'1': '1_2', '2': '3_5', '3': 'over_5'};
        updatedData.dependents = depMap[input];
        replyText = "Do you currently have life insurance?\n\nYES / NO";
        nextState = 'personal_q4';
      } else { replyText = "Please reply with 1, 2, or 3."; }
      break;

    case 'personal_q4':
      if (input === 'YES') {
        updatedData.has_life_insurance = 'yes';
        replyText = "When was it last reviewed?\n\n1️⃣ Within 12 months\n2️⃣ 1–3 years ago\n3️⃣ More than 3 years ago";
        nextState = 'personal_q4a';
      } else if (input === 'NO') {
        updatedData.has_life_insurance = 'no';
        replyText = "Do you currently have health insurance?\n\nYES / NO";
        nextState = 'personal_q5';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'personal_q4a':
      if (['1','2','3'].includes(input)) {
        const reviewMap = {'1': 'under_1_year', '2': '1_3_years', '3': 'over_3_years'};
        updatedData.life_insurance_review = reviewMap[input];
        replyText = "Do you currently have health insurance?\n\nYES / NO";
        nextState = 'personal_q5';
      } else { replyText = "Please reply with 1, 2, or 3."; }
      break;

    case 'personal_q5':
      if (isYesNo(input)) {
        updatedData.has_health_insurance = input.toLowerCase();
        replyText = "Do you own a vehicle?\n\nYES / NO";
        nextState = 'personal_q6';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'personal_q6':
      if (input === 'YES') {
        updatedData.owns_vehicle = 'yes';
        replyText = "Is your vehicle currently insured?\n\n1️⃣ Comprehensive\n2️⃣ Third Party\n3️⃣ Not Insured";
        nextState = 'personal_q6a';
      } else if (input === 'NO') {
        updatedData.owns_vehicle = 'no';
        replyText = "Do you own your residence?\n\nYES / NO";
        nextState = 'personal_q7';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'personal_q6a':
      if (['1','2','3'].includes(input)) {
        const vMap = {'1': 'comprehensive', '2': 'third_party', '3': 'none'};
        updatedData.vehicle_insurance = vMap[input];
        replyText = "Do you own your residence?\n\nYES / NO";
        nextState = 'personal_q7';
      } else { replyText = "Please reply with 1, 2, or 3."; }
      break;

    case 'personal_q7':
      if (input === 'YES') {
        updatedData.owns_residence = 'yes';
        replyText = "What is the estimated value of your home and contents?\n\n1️⃣ Under ₦5M\n2️⃣ ₦5M–₦20M\n3️⃣ ₦20M–₦100M\n4️⃣ Above ₦100M";
        nextState = 'personal_q7a';
      } else if (input === 'NO') {
        updatedData.owns_residence = 'no';
        replyText = "If your income stopped today, how long could you maintain your current lifestyle?\n\n1️⃣ Less than 1 month\n2️⃣ 1–3 months\n3️⃣ 3–6 months\n4️⃣ More than 6 months";
        nextState = 'personal_q8';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'personal_q7a':
      if (['1','2','3','4'].includes(input)) {
        const valMap = {'1': 'under_5m', '2': '5m_20m', '3': '20m_100m', '4': 'over_100m'};
        updatedData.home_value = valMap[input];
        replyText = "If your income stopped today, how long could you maintain your current lifestyle?\n\n1️⃣ Less than 1 month\n2️⃣ 1–3 months\n3️⃣ 3–6 months\n4️⃣ More than 6 months";
        nextState = 'personal_q8';
      } else { replyText = "Please reply with 1, 2, 3, or 4."; }
      break;

    case 'personal_q8':
      if (['1','2','3','4'].includes(input)) {
        const svMap = {'1': 'less_1m', '2': '1_3m', '3': '3_6m', '4': 'more_6m'};
        updatedData.savings_buffer = svMap[input];
        replyText = "Which of these concerns you most?\n\nA. Medical Expenses\nB. Loss of Income\nC. Family Financial Security\nD. Vehicle Damage\nE. Property Loss\n\nReply A, B, C, D, or E.";
        nextState = 'personal_q9';
      } else { replyText = "Please reply with 1, 2, 3, or 4."; }
      break;

    case 'personal_q9':
      if (['A','B','C','D','E'].includes(input)) {
        const conMap = {'A': 'Medical Expenses', 'B': 'Loss of Income', 'C': 'Family Financial Security', 'D': 'Vehicle Damage', 'E': 'Property Loss'};
        updatedData.primary_concern = conMap[input];
        replyText = `Thank you, ${updatedData.name || 'User'}.\n\nWe're analyzing your responses and preparing your CoverScore Risk Report.\nThis usually takes less than 30 seconds.`;
        isComplete = true;
      } else { replyText = "Please reply with A, B, C, D, or E."; }
      break;

    // ==========================================
    // BUSINESS FLOW
    // ==========================================
    case 'business_q1':
      if (['1','2','3','4','5','6','7','8'].includes(input)) {
        const indMap = {'1': 'Retail', '2': 'Manufacturing', '3': 'Logistics', '4': 'Education', '5': 'Healthcare', '6': 'Professional Services', '7': 'Technology', '8': 'Other'};
        updatedData.industry = indMap[input];
        replyText = "How many employees do you have?\n\n1️⃣ 1–5\n2️⃣ 6–20\n3️⃣ 21–50\n4️⃣ 51–100\n5️⃣ Over 100";
        nextState = 'business_q2';
      } else { replyText = "Please reply with a number from 1 to 8."; }
      break;

    case 'business_q2':
      if (['1','2','3','4','5'].includes(input)) {
        const empMap = {'1': '1_5', '2': '6_20', '3': '21_50', '4': '51_100', '5': 'over_100'};
        updatedData.employee_bracket = empMap[input];
        replyText = "What is your approximate annual turnover?\n\n1️⃣ Under ₦10M\n2️⃣ ₦10M–₦50M\n3️⃣ ₦50M–₦250M\n4️⃣ ₦250M–₦1B\n5️⃣ Above ₦1B";
        nextState = 'business_q3';
      } else { replyText = "Please reply with 1, 2, 3, 4, or 5."; }
      break;

    case 'business_q3':
      if (['1','2','3','4','5'].includes(input)) {
        const toMap = {'1': 'under_10m', '2': '10m_50m', '3': '50m_250m', '4': '250m_1b', '5': 'over_1b'};
        updatedData.turnover_bracket = toMap[input];
        replyText = "Does your business operate from a physical location?\n\nYES / NO";
        nextState = 'business_q4';
      } else { replyText = "Please reply with 1, 2, 3, 4, or 5."; }
      break;

    case 'business_q4':
      if (input === 'YES') {
        updatedData.has_location = 'yes';
        replyText = "Do you own or lease the property?\n\n1️⃣ Own\n2️⃣ Lease";
        nextState = 'business_q4a';
      } else if (input === 'NO') {
        updatedData.has_location = 'no';
        replyText = "Do you own business equipment, inventory, or assets worth more than ₦5M?\n\nYES / NO";
        nextState = 'business_q5';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'business_q4a':
      if (['1','2'].includes(input)) {
        updatedData.location_ownership = input === '1' ? 'own' : 'lease';
        replyText = "Do you own business equipment, inventory, or assets worth more than ₦5M?\n\nYES / NO";
        nextState = 'business_q5';
      } else { replyText = "Please reply with 1 or 2."; }
      break;

    case 'business_q5':
      if (input === 'YES') {
        updatedData.has_assets = 'yes';
        replyText = "What is the estimated value?\n\n1️⃣ ₦5M–₦20M\n2️⃣ ₦20M–₦100M\n3️⃣ ₦100M–₦500M\n4️⃣ Above ₦500M";
        nextState = 'business_q5a';
      } else if (input === 'NO') {
        updatedData.has_assets = 'no';
        replyText = "Do customers, visitors, or members of the public visit your premises?\n\nYES / NO";
        nextState = 'business_q6';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'business_q5a':
      if (['1','2','3','4'].includes(input)) {
        const valMap = {'1': '5m_20m', '2': '20m_100m', '3': '100m_500m', '4': 'over_500m'};
        updatedData.asset_value = valMap[input];
        replyText = "Do customers, visitors, or members of the public visit your premises?\n\nYES / NO";
        nextState = 'business_q6';
      } else { replyText = "Please reply with 1, 2, 3, or 4."; }
      break;

    case 'business_q6':
      if (isYesNo(input)) {
        updatedData.public_liability_risk = input.toLowerCase();
        replyText = "Does your business own vehicles or transport goods?\n\nYES / NO";
        nextState = 'business_q7';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'business_q7':
      if (input === 'YES') {
        updatedData.has_vehicles = 'yes';
        replyText = "Which best describes your operations?\n\n1️⃣ Company Vehicles\n2️⃣ Goods Transport\n3️⃣ Both";
        nextState = 'business_q7a';
      } else if (input === 'NO') {
        updatedData.has_vehicles = 'no';
        replyText = "Do you currently provide employee welfare benefits such as Group Life Insurance?\n\nYES / NO";
        nextState = 'business_q8';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'business_q7a':
      if (['1','2','3'].includes(input)) {
        const vtMap = {'1': 'vehicles_only', '2': 'goods_only', '3': 'both'};
        updatedData.vehicle_type = vtMap[input];
        replyText = "Do you currently provide employee welfare benefits such as Group Life Insurance?\n\nYES / NO";
        nextState = 'business_q8';
      } else { replyText = "Please reply with 1, 2, or 3."; }
      break;

    case 'business_q8':
      if (isYesNo(input)) {
        updatedData.has_employee_benefits = input.toLowerCase();
        replyText = "If your business stopped operating for 3 months, what would happen?\n\n1️⃣ Minor inconvenience\n2️⃣ Significant revenue loss\n3️⃣ Severe financial strain\n4️⃣ Business survival would be threatened";
        nextState = 'business_q9';
      } else { replyText = "Please reply with YES or NO."; }
      break;

    case 'business_q9':
      if (['1','2','3','4'].includes(input)) {
        const biMap = {'1': 'minor', '2': 'significant', '3': 'severe', '4': 'survival_threatened'};
        updatedData.business_interruption_risk = biMap[input];
        replyText = "Which area concerns you most?\n\nA. Fire & Property Damage\nB. Employee Welfare\nC. Liability Claims\nD. Business Interruption\nE. Vehicle & Transit Risks\nF. Cyber Risk\n\nReply A, B, C, D, E, or F.";
        nextState = 'business_q10';
      } else { replyText = "Please reply with 1, 2, 3, or 4."; }
      break;

    case 'business_q10':
      if (['A','B','C','D','E','F'].includes(input)) {
        const conMap = {'A': 'Fire & Property Damage', 'B': 'Employee Welfare', 'C': 'Liability Claims', 'D': 'Business Interruption', 'E': 'Vehicle & Transit Risks', 'F': 'Cyber Risk'};
        updatedData.primary_concern = conMap[input];
        replyText = `Thank you, ${updatedData.name || 'User'}.\n\nWe're analyzing your responses and preparing your CoverScore Risk Report.\nThis usually takes less than 30 seconds.`;
        isComplete = true;
      } else { replyText = "Please reply with A, B, C, D, E, or F."; }
      break;

    // ==========================================
    // QUALIFICATION FLOW (AFTER REPORT)
    // ==========================================
    case 'qualification':
      if (['1','2','3'].includes(input)) {
        const qualMap = {'1': 'adequate', '2': 'has_gaps', '3': 'not_sure_review'};
        updatedData.qualification_response = qualMap[input];
        replyText = "Thank you. Your request has been received. Our advisor will reach out to you shortly to discuss your results.";
        nextState = 'finished';
      } else { replyText = "Please reply with 1, 2, or 3."; }
      break;

    default:
      // Unknown state
      replyText = "I'm sorry, I didn't understand that. Please type START ASSESSMENT to begin.";
      break;
  }

  return { nextState, replyText, updatedData, isComplete };
};

module.exports = { getNextStateAndReply };
