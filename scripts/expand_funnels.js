const fs = require('fs');
const path = require('path');

const bankPath = path.join(__dirname, '..', 'src', 'data', 'question_bank.json');
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

// ============================================================
// INDUSTRY-SPECIFIC NEW QUESTION DEFINITIONS
// ============================================================

const questions = {
  // ---- MFG (Manufacturing) ----
  MFG: {
    questions: [
      {
        id: "MFG_012", industry: "manufacturing", pillar: "Workforce",
        question: "Have you experienced any workplace accidents or safety incidents in the past 3 years?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "workplace_accidents",
        risk_logic: { "Yes": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "MFG_020" }
      },
      {
        id: "MFG_020", industry: "manufacturing", pillar: "Operations",
        question: "Do you have written emergency procedures for workplace accidents or fire?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "emergency_procedures",
        risk_logic: { "No": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "MFG_021" }
      },
      {
        id: "MFG_021", industry: "manufacturing", pillar: "Asset Protection",
        question: "Are fire extinguishers regularly inspected and available across your facility?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "fire_extinguishers",
        risk_logic: { "No": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "MFG_022" }
      },
      {
        id: "MFG_022", industry: "manufacturing", pillar: "Business Continuity",
        question: "If your factory had to close unexpectedly for one month, could it continue meeting payroll and operating expenses?",
        question_type: "single_choice", answers: ["Yes", "No", "Not sure"],
        data_mapping: "closure_resilience",
        risk_logic: { "No": { vulnerability_points: 25 }, "Not sure": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "MFG_023" }
      },
      {
        id: "MFG_023", industry: "manufacturing", pillar: "Operations",
        question: "Who is responsible for health and safety compliance within your manufacturing operation?",
        question_type: "single_choice",
        answers: ["Operations Manager", "Designated Safety Officer", "External Consultant", "No one specifically assigned"],
        data_mapping: "safety_responsibility",
        risk_logic: { "No one specifically assigned": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "MFG_024" }
      },
      {
        id: "MFG_024", industry: "manufacturing", pillar: "Operations",
        question: "Do you operate delivery vehicles or forklifts for your manufacturing operations?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "operate_vehicles",
        recommendation_trigger: { condition: "Yes", recommendation: "Comprehensive Fleet Insurance required" },
        branching: { "DEFAULT": "MFG_025" }
      },
      {
        id: "MFG_025", industry: "manufacturing", pillar: "Operations",
        question: "Are your delivery and material handling vehicle drivers trained in safe operating procedures?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "driver_training",
        risk_logic: { "No": { vulnerability_points: 12 }, "Not sure": { vulnerability_points: 6 } },
        branching: { "DEFAULT": "MFG_026" }
      },
      {
        id: "MFG_026", industry: "manufacturing", pillar: "Operations",
        question: "Do you conduct regular vehicle safety inspections for your delivery fleet and material handling equipment?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "vehicle_inspections",
        risk_logic: { "No": { vulnerability_points: 12 }, "Not sure": { vulnerability_points: 6 } },
        branching: { "DEFAULT": "MFG_027" }
      },
      {
        id: "MFG_027", industry: "manufacturing", pillar: "Asset Protection",
        question: "How often do you conduct building and facility maintenance inspections?",
        question_type: "single_choice", answers: ["Monthly", "Quarterly", "Annually", "Rarely", "Never"],
        data_mapping: "building_maintenance",
        risk_logic: { "Rarely": { vulnerability_points: 10 }, "Never": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "MFG_016" }
      }
    ],
    existingBranchUpdates: {
      "MFG_015": { "DEFAULT": "MFG_012" }  // Instead of MFG_016, go through new questions
    }
  },

  // ---- HOS (Hospital/Healthcare) ----
  HOS: {
    questions: [
      {
        id: "HOS_012", industry: "healthcare", pillar: "Operations",
        question: "Have you experienced any patient safety incidents or adverse events in the past 3 years?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "patient_incidents",
        risk_logic: { "Yes": { vulnerability_points: 25 } },
        branching: { "DEFAULT": "HOS_020" }
      },
      {
        id: "HOS_020", industry: "healthcare", pillar: "Operations",
        question: "Do you have written emergency procedures for patient incidents or fire?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "emergency_procedures",
        risk_logic: { "No": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "HOS_021" }
      },
      {
        id: "HOS_021", industry: "healthcare", pillar: "Asset Protection",
        question: "Are fire extinguishers regularly inspected and available across your facility?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "fire_extinguishers",
        risk_logic: { "No": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "HOS_022" }
      },
      {
        id: "HOS_022", industry: "healthcare", pillar: "Operations",
        question: "If your facility had to close unexpectedly for one month, could it continue meeting payroll and operating expenses?",
        question_type: "single_choice", answers: ["Yes", "No", "Not sure"],
        data_mapping: "closure_resilience",
        risk_logic: { "No": { vulnerability_points: 25 }, "Not sure": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "HOS_023" }
      },
      {
        id: "HOS_023", industry: "healthcare", pillar: "Legal & Liability",
        question: "Who is responsible for compliance and safety within your healthcare facility?",
        question_type: "single_choice",
        answers: ["Medical Director", "Designated Compliance Officer", "External Consultant", "No one specifically assigned"],
        data_mapping: "compliance_responsibility",
        risk_logic: { "No one specifically assigned": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "HOS_024" }
      },
      {
        id: "HOS_024", industry: "healthcare", pillar: "Operations",
        question: "Do you operate ambulances or patient transport vehicles?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "operate_vehicles",
        recommendation_trigger: { condition: "Yes", recommendation: "Comprehensive Fleet Insurance required" },
        branching: { "DEFAULT": "HOS_025" }
      },
      {
        id: "HOS_025", industry: "healthcare", pillar: "Operations",
        question: "Are your ambulance and patient transport drivers trained in defensive driving and emergency protocols?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "driver_training",
        risk_logic: { "No": { vulnerability_points: 15 }, "Not sure": { vulnerability_points: 8 } },
        branching: { "DEFAULT": "HOS_026" }
      },
      {
        id: "HOS_026", industry: "healthcare", pillar: "Operations",
        question: "Do you conduct regular vehicle safety inspections for your medical transport fleet?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "vehicle_inspections",
        risk_logic: { "No": { vulnerability_points: 12 }, "Not sure": { vulnerability_points: 6 } },
        branching: { "DEFAULT": "HOS_027" }
      },
      {
        id: "HOS_027", industry: "healthcare", pillar: "Asset Protection",
        question: "How often do you conduct building and facility maintenance inspections?",
        question_type: "single_choice", answers: ["Monthly", "Quarterly", "Annually", "Rarely", "Never"],
        data_mapping: "building_maintenance",
        risk_logic: { "Rarely": { vulnerability_points: 10 }, "Never": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "HOS_016" }
      }
    ],
    existingBranchUpdates: {
      "HOS_015": { "DEFAULT": "HOS_012" },
      "HOS_017": { "DEFAULT": "HOS_018" }
    }
  },

  // ---- CON (Construction) ----
  CON: {
    questions: [
      {
        id: "CON_012", industry: "construction", pillar: "Worker Protection",
        question: "Have you experienced any on-site accidents or injuries in the past 3 years?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "site_accidents",
        risk_logic: { "Yes": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CON_020" }
      },
      {
        id: "CON_020", industry: "construction", pillar: "Operations",
        question: "Do you have written emergency procedures for on-site accidents or fire?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "emergency_procedures",
        risk_logic: { "No": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CON_021" }
      },
      {
        id: "CON_021", industry: "construction", pillar: "Insurance",
        question: "Are fire extinguishers regularly inspected and available across your work sites?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "fire_extinguishers",
        risk_logic: { "No": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "CON_022" }
      },
      {
        id: "CON_022", industry: "construction", pillar: "Contractual Risk",
        question: "If a major project was halted unexpectedly for one month, could your business continue meeting payroll and operating expenses?",
        question_type: "single_choice", answers: ["Yes", "No", "Not sure"],
        data_mapping: "closure_resilience",
        risk_logic: { "No": { vulnerability_points: 25 }, "Not sure": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "CON_023" }
      },
      {
        id: "CON_023", industry: "construction", pillar: "Worker Protection",
        question: "Who is responsible for health and safety compliance on your construction sites?",
        question_type: "single_choice",
        answers: ["Project Manager", "Designated Safety Officer", "External Consultant", "No one specifically assigned"],
        data_mapping: "safety_responsibility",
        risk_logic: { "No one specifically assigned": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CON_024" }
      },
      {
        id: "CON_024", industry: "construction", pillar: "Operations",
        question: "Do you operate heavy vehicles or transport materials between sites?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "operate_vehicles",
        recommendation_trigger: { condition: "Yes", recommendation: "Comprehensive Fleet Insurance required" },
        branching: { "DEFAULT": "CON_025" }
      },
      {
        id: "CON_025", industry: "construction", pillar: "Operations",
        question: "Are your heavy vehicle and equipment operators trained in safe operating procedures?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "operator_training",
        risk_logic: { "No": { vulnerability_points: 15 }, "Not sure": { vulnerability_points: 8 } },
        branching: { "DEFAULT": "CON_026" }
      },
      {
        id: "CON_026", industry: "construction", pillar: "Operations",
        question: "Do you conduct regular vehicle and equipment safety inspections?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "vehicle_inspections",
        risk_logic: { "No": { vulnerability_points: 12 }, "Not sure": { vulnerability_points: 6 } },
        branching: { "DEFAULT": "CON_027" }
      },
      {
        id: "CON_027", industry: "construction", pillar: "Equipment",
        question: "How often do you conduct maintenance inspections for your tools, machinery, and site facilities?",
        question_type: "single_choice", answers: ["Monthly", "Quarterly", "Annually", "Rarely", "Never"],
        data_mapping: "equipment_maintenance",
        risk_logic: { "Rarely": { vulnerability_points: 10 }, "Never": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CON_016" }
      }
    ],
    existingBranchUpdates: {
      "CON_015": { "DEFAULT": "CON_012" }
    }
  },

  // ---- TRN (Transport) ----
  TRN: {
    questions: [
      {
        id: "TRN_012", industry: "transport", pillar: "Fleet Management",
        question: "Have you experienced any road accidents or fleet incidents in the past 3 years?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "fleet_accidents",
        risk_logic: { "Yes": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "TRN_020" }
      },
      {
        id: "TRN_020", industry: "transport", pillar: "Fleet Management",
        question: "Do you have written emergency procedures for road accidents or fleet incidents?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "emergency_procedures",
        risk_logic: { "No": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "TRN_021" }
      },
      {
        id: "TRN_021", industry: "transport", pillar: "Compliance",
        question: "Are fire extinguishers regularly inspected and available in your depot and vehicles?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "fire_extinguishers",
        risk_logic: { "No": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "TRN_022" }
      },
      {
        id: "TRN_022", industry: "transport", pillar: "Insurance",
        question: "If your fleet operations were suspended unexpectedly for one month, could your business continue meeting payroll and operating expenses?",
        question_type: "single_choice", answers: ["Yes", "No", "Not sure"],
        data_mapping: "closure_resilience",
        risk_logic: { "No": { vulnerability_points: 25 }, "Not sure": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "TRN_023" }
      },
      {
        id: "TRN_023", industry: "transport", pillar: "Compliance",
        question: "Who is responsible for safety and compliance within your transport operation?",
        question_type: "single_choice",
        answers: ["Fleet Manager", "Designated Compliance Officer", "External Consultant", "No one specifically assigned"],
        data_mapping: "compliance_responsibility",
        risk_logic: { "No one specifically assigned": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "TRN_024" }
      },
      {
        id: "TRN_024", industry: "transport", pillar: "Worker Protection",
        question: "Are all your drivers trained in defensive driving and first aid?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "driver_training",
        risk_logic: { "No": { vulnerability_points: 15 }, "Not sure": { vulnerability_points: 8 } },
        branching: { "DEFAULT": "TRN_025" }
      },
      {
        id: "TRN_025", industry: "transport", pillar: "Fleet Management",
        question: "Do you conduct regular vehicle safety inspections for your entire fleet?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "vehicle_inspections",
        risk_logic: { "No": { vulnerability_points: 15 }, "Not sure": { vulnerability_points: 8 } },
        branching: { "DEFAULT": "TRN_026" }
      },
      {
        id: "TRN_026", industry: "transport", pillar: "Compliance",
        question: "Does your depot or yard have a working fire alarm system that is regularly tested?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "fire_alarm",
        risk_logic: { "No": { vulnerability_points: 15 }, "Not sure": { vulnerability_points: 8 } },
        branching: { "DEFAULT": "TRN_027" }
      },
      {
        id: "TRN_027", industry: "transport", pillar: "Fleet Management",
        question: "How often do you conduct maintenance inspections for your depot and yard facilities?",
        question_type: "single_choice", answers: ["Monthly", "Quarterly", "Annually", "Rarely", "Never"],
        data_mapping: "depot_maintenance",
        risk_logic: { "Rarely": { vulnerability_points: 10 }, "Never": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "TRN_016" }
      }
    ],
    existingBranchUpdates: {
      "TRN_015": { "DEFAULT": "TRN_012" },
      "TRN_017": { "DEFAULT": "TRN_018" }
    }
  },

  // ---- CHR (Church) ----
  CHR: {
    questions: [
      {
        id: "CHR_012", industry: "church", pillar: "Legal & Liability",
        question: "Have you experienced any incidents or injuries on your church premises in the past 3 years?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "premises_incidents",
        risk_logic: { "Yes": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CHR_020" }
      },
      {
        id: "CHR_020", industry: "church", pillar: "Operations",
        question: "Do you have written emergency procedures for incidents during services or events?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "emergency_procedures",
        risk_logic: { "No": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CHR_021" }
      },
      {
        id: "CHR_021", industry: "church", pillar: "Property Protection",
        question: "Are fire extinguishers regularly inspected and available across your church buildings?",
        question_type: "yes_no", answers: ["Yes", "No"],
        data_mapping: "fire_extinguishers",
        risk_logic: { "No": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "CHR_022" }
      },
      {
        id: "CHR_022", industry: "church", pillar: "Operations",
        question: "If your church had to close unexpectedly for one month, could it continue meeting operating expenses?",
        question_type: "single_choice", answers: ["Yes", "No", "Not sure"],
        data_mapping: "closure_resilience",
        risk_logic: { "No": { vulnerability_points: 25 }, "Not sure": { vulnerability_points: 15 } },
        branching: { "DEFAULT": "CHR_023" }
      },
      {
        id: "CHR_023", industry: "church", pillar: "Legal & Liability",
        question: "Who is responsible for health and safety within your church?",
        question_type: "single_choice",
        answers: ["Church Administrator", "Designated Safety Officer", "Volunteer Coordinator", "No one specifically assigned"],
        data_mapping: "safety_responsibility",
        risk_logic: { "No one specifically assigned": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CHR_024" }
      },
      {
        id: "CHR_024", industry: "church", pillar: "Operations",
        question: "Do you operate church vans or buses for transporting congregants?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "operate_vehicles",
        recommendation_trigger: { condition: "Yes", recommendation: "Comprehensive Motor Insurance required" },
        branching: { "DEFAULT": "CHR_025" }
      },
      {
        id: "CHR_025", industry: "church", pillar: "Operations",
        question: "Are your church van and bus drivers trained in defensive driving and first aid?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "driver_training",
        risk_logic: { "No": { vulnerability_points: 15 }, "Not sure": { vulnerability_points: 8 } },
        branching: { "DEFAULT": "CHR_026" }
      },
      {
        id: "CHR_026", industry: "church", pillar: "Operations",
        question: "Do you conduct regular vehicle safety inspections for your church transport?",
        question_type: "yes_no", answers: ["Yes", "No", "Not sure"],
        data_mapping: "vehicle_inspections",
        risk_logic: { "No": { vulnerability_points: 12 }, "Not sure": { vulnerability_points: 6 } },
        branching: { "DEFAULT": "CHR_027" }
      },
      {
        id: "CHR_027", industry: "church", pillar: "Property Protection",
        question: "How often do you conduct building maintenance inspections for your church facilities?",
        question_type: "single_choice", answers: ["Monthly", "Quarterly", "Annually", "Rarely", "Never"],
        data_mapping: "building_maintenance",
        risk_logic: { "Rarely": { vulnerability_points: 10 }, "Never": { vulnerability_points: 20 } },
        branching: { "DEFAULT": "CHR_016" }
      }
    ],
    existingBranchUpdates: {
      "CHR_015": { "DEFAULT": "CHR_012" },
      "CHR_017": { "DEFAULT": "CHR_018" }
    }
  }
};

// ============================================================
// APPLY CHANGES
// ============================================================

// 1. Update existing question branching defaults
for (const [prefix, config] of Object.entries(questions)) {
  for (const [existingId, newBranching] of Object.entries(config.existingBranchUpdates)) {
    const existing = bank.find(q => q.id === existingId);
    if (existing) {
      existing.branching = { ...existing.branching, ...newBranching };
      console.log(`  Updated ${existingId} branching -> ${newBranching.DEFAULT}`);
    } else {
      console.warn(`  WARNING: ${existingId} not found!`);
    }
  }
}

// 2. Insert new questions
for (const [prefix, config] of Object.entries(questions)) {
  for (const q of config.questions) {
    const exists = bank.find(bq => bq.id === q.id);
    if (!exists) {
      bank.push(q);
      console.log(`  Added ${q.id}`);
    } else {
      console.log(`  SKIP ${q.id} (already exists)`);
    }
  }
}

// 3. Write updated bank
fs.writeFileSync(bankPath, JSON.stringify(bank, null, 4));
console.log('\nDone! Bank now has', bank.length, 'total questions');
