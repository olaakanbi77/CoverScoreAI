const domainConfig = {
  HLT: {
    assessmentTitle: 'Health Protection',
    domain: 'health',
    resilienceTerm: 'Health Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall health protection',
    improvementTerm: 'health resilience',
    followUpMsg: "I'll also share practical health protection tips and strategies that match your assessment.",
    pillarMappings: {
      'Healthcare Access': 'Healthcare Access',
      'Preventive Health': 'Preventive Health',
      'Medical Risk Profile': 'Medical Risk Profile',
      'Financial Health Protection': 'Financial Health Protection',
      'Household Resilience': 'Household Resilience'
    },
    resilienceLabels: {
      'excellent': 'Excellent Resilience',
      'strong': 'Strong Resilience',
      'developing': 'Developing Resilience',
      'needs_attention': 'Needs Attention',
      'priority_improvement': 'Priority Improvement',
      'critical_priority': 'Critical'
    },
    insightTexts: {
      perPillar: {
        'Healthcare Access': {
          base: "Your assessment suggests that the most significant gap in your overall protection is your access to healthcare coverage.",
          answerChecks: [
            { q: 'HLT_012', values: ['None'], append: "Without active health insurance, a serious medical event could result in significant out-of-pocket costs that may be difficult to manage." },
            { q: 'HLT_012', values: ['Government Health Scheme'], append: "While government schemes provide a foundation, the coverage limits may not extend to major medical procedures or specialist care." },
            { q: 'HLT_012', values: ['Employer HMO'], append: "Your employer HMO is a good starting point, but its coverage limits may not be sufficient for serious or chronic conditions that require extended care." }
          ],
          suffix: "Strengthening your health coverage is the most practical step toward staying healthy without financial hardship."
        },
        'Preventive Health': {
          base: "Your assessment shows that the biggest opportunity to strengthen your overall protection isn't about what you have\u2014it's about what you do.",
          answerChecks: [
            { q: 'HLT_015', values: ['Rarely/Only when sick'], append: "By only seeking medical attention when you're already unwell, you miss the chance to detect potential health issues early, when they are most treatable." }
          ],
          suffix: "Making preventive health a regular habit\u2014starting with an annual check-up\u2014is a simple but powerful step toward long-term wellbeing."
        },
        'Medical Risk Profile': {
          base: "Your assessment highlights that your medical history and age profile are important factors in your overall risk picture.",
          answerChecks: [
            { q: 'HLT_014', condition: (v) => v && v !== 'None', append: (v) => `Managing ${v} requires consistent medical attention and appropriate insurance coverage.` },
            { q: 'HLT_009', values: ['56+', '46 - 55'], append: "As you get older, health risks naturally increase, making comprehensive coverage more important." }
          ],
          suffix: "Ensuring your health plan is designed to address your specific circumstances is the most impactful step you can take."
        },
        'Financial Health Protection': {
          base: "Your assessment suggests that your greatest financial risk isn't access to care\u2014it's the financial impact that a serious illness could have on you and your family.",
          answerChecks: [
            { q: 'HLT_013', values: ["I don't know", 'Loan'], append: "Without dedicated savings for medical emergencies, a major health event could create significant debt." },
            { q: 'HLT_016', values: ['No', 'Not sure'], append: "Your current health cover may not be sufficient for major procedures such as surgery." },
            { q: 'HLT_017', values: ['No'], append: "A serious illness could put financial pressure on your household." }
          ],
          suffix: "Strengthening your financial health protection is the most impactful step you can take."
        },
        'Household Resilience': {
          base: "Your assessment shows that your household's overall resilience is an area to strengthen.",
          answerChecks: [
            { q: 'HLT_010', values: ['3', '4+'], append: "With multiple dependants relying on you, any health-related income disruption affects more than just yourself." },
            { q: 'HLT_008', values: ['Part-time / Freelance', 'Student'], append: "Your current employment situation means there is less of a financial buffer if a health emergency arises." }
          ],
          suffix: "Building a stronger household safety net through appropriate coverage is your most practical next step."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current protection profile. The goal is straightforward: stay healthy without financial hardship."
    },
    recommendationTexts: {
      'healthcare access': 'reviewing your healthcare access to obtain appropriate health cover for your needs',
      'preventive health': 'scheduling a comprehensive preventive health screening within the next month',
      'medical risk profile': 'seeking a medical review and ongoing monitoring to address potential health vulnerabilities',
      'financial health protection': 'reviewing your financial health protection to ensure you could cope with the financial impact of a serious illness without placing your family under pressure',
      'household resilience': 'building a family protection plan to safeguard your loved ones against unexpected events'
    },
    realLifeContext: "Here\u2019s what this means in real life: If a serious health issue kept you from working for several months, your current level of protection determines whether you\u2019d need to dip into savings, take on debt, or disrupt your family\u2019s lifestyle. Every point you improve on your CoverScore brings you closer to facing a health setback without financial setback."
  },
  RET: {
    assessmentTitle: 'Retirement Readiness',
    domain: 'retirement',
    resilienceTerm: 'Retirement Readiness',
    displayLabel: 'Readiness',
    closingTerm: 'overall retirement readiness',
    improvementTerm: 'retirement readiness',
    followUpMsg: "I'll also share practical retirement planning insights and strategies that match your assessment.",
    pillarMappings: {
      'retirement_readiness': 'Retirement Readiness',
      'retirement_savings': 'Retirement Savings',
      'healthcare_protection': 'Healthcare & Protection',
      'legacy_planning': 'Legacy Planning'
    },
    resilienceLabels: {
      'excellent': 'Excellent Resilience',
      'strong': 'Strong Resilience',
      'developing': 'Developing Resilience',
      'needs_attention': 'Needs Attention',
      'priority_improvement': 'Priority Improvement',
      'critical_priority': 'Critical'
    },
    insightTexts: {
      perPillar: {
        'Retirement Readiness': {
          base: "You're approaching the stage of life where retirement planning becomes increasingly important, yet your assessment suggests you may still be relying primarily on future income rather than dedicated retirement assets.",
          answerChecks: [
            { q: 'RET_009', values: ['46 - 55', '56+'], append: "Delaying retirement planning further could make it significantly more difficult to achieve your desired lifestyle after retirement." },
            { q: 'RET_012', values: ['No'], append: "Without a dedicated pension or retirement savings account, you may have limited options to build the retirement nest egg you need." },
            { q: 'RET_015', values: ['No, not yet', 'Partially - I have some documentation'], append: "Your retirement assets and estate plans may not be structured to protect your loved ones." }
          ],
          suffix: "Starting a structured retirement savings plan is the most impactful step you can take toward protecting the future you're working toward."
        },
        'Retirement Savings': {
          base: "Your assessment shows that your greatest retirement risk is not when you plan to retire\u2014it's whether you'll have sufficient financial resources to maintain your lifestyle throughout retirement. Building dedicated retirement savings that are separate from your daily income is essential for long-term financial independence."
        },
        'Healthcare Protection': {
          base: "Your assessment suggests that your retirement could be disrupted by unexpected healthcare or long-term care costs.",
          answerChecks: [
            { q: 'RET_013', values: ['Very concerned'], append: "You're right to be concerned\u2014medical costs are one of the biggest threats to retirement savings." },
            { q: 'RET_014', values: ['No'], append: "Without a long-term care plan, a health event could quickly deplete your retirement savings." }
          ],
          suffix: "Reviewing your protection options for retirement is a practical step toward safeguarding your savings."
        },
        'Legacy Planning': {
          base: "Your assessment shows that your estate and legacy planning is an area to strengthen.",
          answerChecks: [
            { q: 'RET_015', values: ['No, not yet'], append: "Without clear beneficiary nominations or asset distribution plans, your retirement assets may not pass to your loved ones as you intend." }
          ],
          suffix: "Documenting your estate plan and reviewing beneficiary designations are simple steps that provide peace of mind."
        }
      },
      catchAll: "Your assessment shows that your greatest retirement risk is not when you plan to retire\u2014it's whether you'll have sufficient financial resources and protection to maintain your lifestyle throughout retirement. The goal is to make sure your retirement confidence comes from preparation, not hope."
    },
    recommendationTexts: {
      'retirement readiness': 'starting or reviewing a dedicated retirement savings plan so that your future income does not depend solely on your active employment',
      'retirement savings': 'starting or reviewing a dedicated retirement savings plan so that your future income does not depend solely on your active employment',
      'healthcare protection': 'reviewing your protection options for retirement to safeguard your savings against unexpected healthcare and long-term care costs',
      'legacy planning': 'documenting how your assets should be distributed and nominating beneficiaries for your retirement accounts'
    },
    realLifeContext: "Here\u2019s what this means in real life: Your retirement isn\u2019t just about how much you save\u2014it\u2019s about whether your income, healthcare, and legacy plans will hold up when you need them. A higher CoverScore means you\u2019re more likely to maintain your lifestyle, cover medical costs, and leave the legacy you intend, no matter how long retirement lasts."
  },
  INC: {
    assessmentTitle: 'Income Protection',
    domain: 'income',
    resilienceTerm: 'Income Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall income protection',
    improvementTerm: 'income resilience',
    followUpMsg: "I'll also share practical income protection tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Emergency Financial Buffer': {
          base: "Your assessment suggests that your emergency savings are not yet sufficient to weather a prolonged income disruption.",
          answerChecks: [
            { q: 'INC_012', values: ['Less than 1 month'], append: "With less than a month of savings, even a short income gap could create immediate financial pressure." },
            { q: 'INC_012', values: ['1-3 months'], append: "While you have some buffer, 1\u20133 months of savings may not be enough to find new income or recover from an unexpected event." }
          ],
          suffix: "Building a robust emergency fund covering at least 6 months of expenses is the most impactful step you can take to protect your income when life is interrupted."
        },
        'Income Stability': {
          base: "Your assessment shows that your income situation has some vulnerabilities that could affect your overall protection.",
          answerChecks: [
            { q: 'INC_011', values: ['Freelance/Contract'], append: "Freelance or contract income can be unpredictable, making it harder to maintain consistent financial commitments during disruptions." },
            { q: 'INC_011', values: ['Business owner'], append: "Business income is tied to business performance, which can fluctuate and create income uncertainty." },
            { q: 'INC_013', values: ['No'], append: "Without secondary income sources, planning for the future becomes significantly more challenging." }
          ],
          suffix: "Diversifying your income sources and building a contingency plan is a practical step toward strengthening your income security."
        },
        'Income Protection Cover': {
          base: "Your assessment indicates that your protection against income loss may not be adequate.",
          answerChecks: [
            { q: 'INC_014', values: ['No'], append: "Without income protection insurance, losing your ability to earn could have severe financial consequences for you and your dependants." },
            { q: 'INC_018', values: ['It would stop completely'], append: "If you were unable to work for six months, your income would stop completely \u2014 leaving you without financial support during recovery." },
            { q: 'INC_018', values: ["I'm not sure"], append: "Not knowing what would happen to your income during a prolonged inability to work is a gap worth addressing." },
            { q: 'INC_018', values: ['It would reduce significantly'], append: "Even with some income remaining, a significant reduction during a prolonged inability to work could create financial pressure." }
          ],
          suffix: "Considering income protection insurance is one of the most important steps you can take to safeguard your livelihood."
        },
        'Financial Commitments': {
          base: "Your assessment shows that your financial commitments could present a risk if your income is disrupted.",
          answerChecks: [
            { q: 'INC_015', values: ['Yes'], append: "With debts that depend on continued income, any disruption to your earnings could create a cascading financial challenge." }
          ],
          suffix: "Reviewing your debt structure and considering debt protection insurance can help reduce this vulnerability."
        }
      },
      catchAll: "Your assessment shows that your greatest income protection risk is the gap between your current financial resilience and the level of protection needed to maintain your lifestyle through unexpected disruptions. The goal is to protect your income when life is interrupted."
    },
    recommendationTexts: {
      'emergency financial buffer': 'building an emergency fund that covers at least 6 months of expenses to protect against income disruptions',
      'income stability': 'diversifying your income sources and building a contingency plan to strengthen your income stability',
      'income protection cover': 'considering income protection insurance to replace your earnings if you become unable to work',
      'financial commitments': 'reviewing your debt structure and considering debt protection insurance to reduce financial vulnerability'
    },
    realLifeContext: "Here\u2019s what this means in real life: If an illness or injury prevented you from working for six months, your current income protection determines whether you\u2019d be able to cover your bills, service your debts, and maintain your household\u2019s lifestyle. A higher CoverScore means a stronger safety net for you and the people who depend on your income."
  },
  YPR: {
    assessmentTitle: 'Young Professional',
    domain: 'young professional',
    resilienceTerm: 'Future Foundation',
    displayLabel: 'Foundation',
    closingTerm: 'overall future foundation',
    improvementTerm: 'future foundation',
    followUpMsg: "I'll also share practical strategies to help you protect the progress you're building.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Career Foundation': {
          base: "You've started building your career, and that's a strong first step. The question isn't whether you have income today\u2014it's whether that income is stable enough to support the future you're working toward.",
          answerChecks: [
            { q: 'YPR_011', values: ['Under 2 years'], append: "Being early in your career is exciting, but it also means less income history to draw on if the economy shifts or an unexpected opportunity requires you to make a financial leap." },
            { q: 'YPR_011', values: ['2-5 years'], append: "You're building momentum in your career, but you're still in a phase where income changes are common. A disruption now could slow your trajectory more than you'd expect." }
          ],
          suffix: "The strongest career foundation isn't just your salary\u2014it's having enough stability to make choices based on opportunity, not desperation."
        },
        'Financial Habits': {
          base: "Your assessment shows that the financial habits you're building today will determine whether your future feels full of options or full of pressure.",
          answerChecks: [
            { q: 'YPR_012', values: ['No'], append: "Not being able to cover a critical illness cost is the single biggest threat to your financial progress right now. One unexpected event could erase years of savings." },
            { q: 'YPR_012', values: ['With difficulty'], append: "You could cover a critical illness cost, but only with difficulty\u2014which means an unexpected health event would still create real financial strain and delay your goals." },
            { q: 'YPR_015', values: ['Yes'], append: "You're actively saving toward a major life goal, which puts you ahead of most people at your stage. The key is making sure those savings are protected from life's surprises." },
            { q: 'YPR_015', values: ['No'], append: "Without a specific savings goal, it's harder to build the financial discipline that turns a good salary into lasting financial security." }
          ],
          suffix: "You're already doing well in areas like saving and budgeting. The next stage is protecting the progress you've made so that unexpected events don't force you to start over."
        },
        'Protection Readiness': {
          base: "You're at a stage in life where protection doesn't feel urgent\u2014but it's the single most important thing that separates financial progress from financial setbacks.",
          answerChecks: [
            { q: 'YPR_014', values: ['No'], append: "Without personal health or accident insurance, a single unexpected medical event could force you to drain your savings or delay important life goals like buying a home or starting a family." }
          ],
          suffix: "Getting basic health and accident insurance isn't about preparing for the worst\u2014it's about protecting the progress you're building."
        },
        'Future Goal Preparedness': {
          base: "The goals you have for your life\u2014whether that's a home, a family, further education, or financial independence\u2014are what make this assessment matter. Your current habits and income will either support those goals or limit them.",
          suffix: "Strengthening your financial foundation now means your future goals will feel achievable instead of out of reach."
        }
      },
      catchAll: "Your financial habits are developing in a way that puts you ahead of many people your age. The question now is whether those habits are protected enough to survive life's unexpected moments \u2014 and protect the progress you're building."
    },
    recommendationTexts: {
      'career foundation': 'strengthening your career foundation by building income stability and developing skills that increase your earning potential',
      'financial habits': 'building on your positive savings habits by creating a dedicated emergency fund and setting clear, measurable financial goals',
      'protection readiness': 'getting basic health and accident insurance to protect the financial progress you\u2019ve already made',
      'future goal preparedness': 'connecting your daily financial habits to your long-term goals so every decision moves you closer to the life you want'
    },
    realLifeContext: "Here\u2019s what this means in real life: You're making progress\u2014saving, building your career, planning for the future. But one unexpected medical event or job loss could force you to pause everything. Your CoverScore shows how well your foundation would hold up when life throws something unexpected your way."
  },
  FAM: {
    assessmentTitle: 'Family Protection',
    domain: 'family',
    resilienceTerm: 'Family Security',
    displayLabel: 'Security',
    closingTerm: 'overall family protection',
    improvementTerm: 'family security',
    followUpMsg: "I'll also share practical family protection tips and strategies that match your assessment.",
    pillarMappings: {},
    resilienceLabels: {
      'excellent': 'Excellent Resilience',
      'strong': 'Strong Resilience',
      'developing': 'Developing Resilience',
      'needs_attention': 'Needs Attention',
      'priority_improvement': 'Priority Improvement',
      'critical_priority': 'Critical'
    },
    insightTexts: {
      perPillar: {
        'Family Dependency': {
          base: "Your assessment shows that your family structure creates certain responsibilities and risks that need to be addressed.",
          answerChecks: [
            { q: 'FAM_011', values: ['3 or more'], append: "With multiple dependents relying on you, any disruption to your income or health could have widespread impact on your family." }
          ],
          suffix: "Ensuring your protection plans reflect your family size is an essential step\u2014because the people who depend on you deserve peace of mind."
        },
        'Income Resilience': {
          base: "Your assessment suggests that your family's financial security depends heavily on your current income. If your ability to earn was interrupted unexpectedly, your household could face financial pressure within a short period. Strengthening your financial safety net now can provide greater stability and peace of mind for the people who depend on you.",
          answerChecks: [
            { q: 'FAM_012', values: ['Less than 3 months'], append: "If your income stopped today, your family would face financial difficulty within three months." },
            { q: 'FAM_012', values: ['3-6 months'], append: "Your family has a moderate income buffer, but extending it further would provide greater peace of mind." }
          ],
          suffix: "Building a family emergency fund that covers at least 6 months of expenses is the most impactful step you can take."
        },
        'Financial Protection': {
          base: "Your assessment indicates that your family's insurance coverage may not fully protect against unexpected events.",
          answerChecks: [
            { q: 'FAM_013', values: ['No'], append: "Without adequate family insurance, your loved ones could face significant financial hardship in an emergency." },
            { q: 'FAM_013', values: ['Not sure'], append: "Not being certain about your family's insurance coverage means gaps could exist that you're unaware of." },
            { q: 'FAM_015', values: ['No'], append: "Without comprehensive family health insurance, medical expenses could become a major financial burden." }
          ],
          suffix: "Reviewing and securing comprehensive family insurance coverage is the most important step you can take for your family's protection."
        },
        'Future Security': {
          base: "Your assessment shows that planning for your family's future needs could be strengthened.",
          answerChecks: [
            { q: 'FAM_014', values: ['No'], append: "Without a plan for your children's education costs, future education expenses could create significant financial pressure." }
          ],
          suffix: "Setting up an education savings plan or education insurance policy is a practical step toward securing your family's future."
        },
        'Family Healthcare': {
          base: "Your assessment suggests that your family's health and wellbeing protection has room for improvement.",
          answerChecks: [
            { q: 'FAM_015', values: ['No'], append: "Without comprehensive health insurance, an unexpected medical need could affect both your family's health and finances." }
          ],
          suffix: "Ensuring your family has access to quality healthcare through appropriate coverage is essential for their wellbeing."
        }
      },
      catchAll: "Your assessment provides a clear picture of your family's current protection profile. The areas highlighted show where focusing your attention would have the greatest impact on your family's security\u2014because the people who depend on you deserve peace of mind."
    },
    recommendationTexts: {
      'family dependency': 'ensuring your protection plans reflect your family size to adequately cover all dependents',
      'income resilience': 'building a family emergency fund that covers at least 6 months of expenses to protect your household',
      'financial protection': 'reviewing and securing comprehensive family insurance coverage to protect your loved ones',
      'future security': 'setting up an education savings plan or education insurance policy for your children\'s future',
      'family healthcare': 'ensuring your family has access to quality healthcare through appropriate health insurance coverage'
    },
    realLifeContext: "Here\u2019s what this means in real life: If something happened to you\u2014an illness, accident, or worse\u2014your family\u2019s ability to maintain its lifestyle, pay for school, and access healthcare depends on the protection you\u2019ve put in place today. Your CoverScore measures how well your family would be protected, and every improvement means greater peace of mind for the people who matter most."
  },
  ENT: {
    assessmentTitle: 'Business Protection',
    domain: 'business',
    resilienceTerm: 'Business Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall business protection',
    improvementTerm: 'business resilience',
    followUpMsg: "I'll also share practical business protection tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Business Continuity': {
          base: "Your assessment shows that your business continuity has vulnerabilities that could affect its long-term survival.",
          answerChecks: [
            { q: 'ENT_011', values: ['Yes completely'], append: "Your business completely depends on your personal involvement, which creates significant risk if you're unavailable." },
            { q: 'ENT_011', values: ['Partially'], append: "Your business has some dependency on you personally, which should be addressed to ensure continuity." },
            { q: 'ENT_013', values: ['No'], append: "Your business would not survive three months without you, highlighting a critical continuity gap." },
            { q: 'ENT_013', values: ['Not sure'], append: "Not knowing whether your business could survive without you means continuity planning should be a priority." }
          ],
          suffix: "Building team capacity and creating a business continuity plan are the most impactful steps you can take."
        },
        'Legal Liability': {
          base: "Your assessment suggests that your business has legal exposures that could impact your personal finances.",
          answerChecks: [
            { q: 'ENT_012', values: ['Yes'], append: "Personal guarantees on business debts mean your personal assets are at risk if the business encounters difficulties." }
          ],
          suffix: "Reviewing your personal guarantees and exploring limited liability restructuring can protect your personal assets."
        },
        'Employee Protection': {
          base: "Your assessment shows that your business may not be adequately protected against the loss of key personnel.",
          answerChecks: [
            { q: 'ENT_014', values: ['No'], append: "Without key person insurance, your business could face significant financial strain if you or another key person becomes unable to work." }
          ],
          suffix: "Key person insurance is a practical step to ensure your business can survive unexpected personnel changes."
        },
        'Asset Protection': {
          base: "Your assessment indicates that your business and personal assets may not be adequately separated.",
          answerChecks: [
            { q: 'ENT_015', values: ['No'], append: "Without separation between personal and business assets, business liabilities could become your personal financial problem." },
            { q: 'ENT_015', values: ['Not sure'], append: "Not being certain about your asset protection structure means there could be gaps in your protection." }
          ],
          suffix: "Separating personal and business assets through proper corporate structuring is an essential step for long-term protection."
        },
        'Financial Resilience': {
          base: "Your assessment shows that your business's financial resilience is an area that deserves attention to ensure long-term stability.",
          suffix: "Building financial reserves and diversifying revenue streams will strengthen your business's ability to weather challenges."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current business protection profile. The goal is to protect both your company and your personal future."
    },
    recommendationTexts: {
      'business continuity': 'building team capacity and creating a business continuity plan to reduce key-person dependency',
      'legal liability': 'reviewing your personal guarantees and exploring limited liability restructuring to protect your personal assets',
      'employee protection': 'considering key person insurance to protect your business against the loss of critical team members',
      'asset protection': 'separating personal and business assets through proper corporate structuring',
      'financial resilience': 'building financial reserves and diversifying revenue streams to strengthen your business resilience'
    },
    realLifeContext: "Here\u2019s what this means in real life: If you were suddenly unable to run your business, would it survive? Your CoverScore shows how prepared your business is for the unexpected\u2014whether that\u2019s losing a key team member, facing a liability claim, or recovering from a disruption. A higher score means a more resilient business that can weather storms without threatening your personal finances."
  },
  HOM: {
    assessmentTitle: 'Home Protection',
    domain: 'home',
    resilienceTerm: 'Home Protection',
    displayLabel: 'Protection',
    closingTerm: 'overall home protection',
    improvementTerm: 'home protection',
    followUpMsg: "I'll also share practical home protection tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Property Protection': {
          base: "Your assessment shows that your current property protection has gaps that could leave you exposed to unexpected costs.",
          answerChecks: [
            { q: 'HOM_011', values: ['Neither'], append: "Without stable housing tenure, you face significant exposure to housing cost changes and lack the security of homeownership." },
            { q: 'HOM_011', values: ['Rent'], append: "While renting provides flexibility, you may be missing out on property appreciation and don't benefit from landlord insurance for your contents." },
            { q: 'HOM_012', values: ['No'], append: "Without homeowner's or renter's insurance, your personal belongings and liability are unprotected." }
          ],
          suffix: "Securing appropriate property insurance and working toward stable housing are the most important steps\u2014because your home is more than a building, it\u2019s your foundation."
        }
      },
      catchAll: "Your assessment shows that your property protection is an area that could benefit from attention. Ensuring your home and belongings are adequately insured is the most practical step you can take\u2014because your home is more than a building, it\u2019s your foundation."
    },
    recommendationTexts: {
      'property protection': 'securing appropriate property insurance and working toward stable housing to protect your home and belongings'
    },
    realLifeContext: "Here\u2019s what this means in real life: Your home is likely your most valuable asset. Without proper protection, a fire, theft, or liability claim could result in significant financial loss. Your CoverScore reflects how well your home and belongings are shielded from unexpected events."
  },
  MOT: {
    assessmentTitle: 'Motor Protection',
    domain: 'motor',
    resilienceTerm: 'Motor Protection',
    displayLabel: 'Protection',
    closingTerm: 'overall motor protection',
    improvementTerm: 'motor protection',
    followUpMsg: "I'll also share practical motor protection tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Vehicle Protection': {
          base: "Your assessment suggests that your vehicle protection may not be adequate to cover potential risks on the road.",
          answerChecks: [
            { q: 'MOT_011', values: ['2'], append: "Having two vehicles doubles your exposure to accidents, theft, and repair costs." },
            { q: 'MOT_011', values: ['3 or more'], append: "With multiple vehicles, your overall risk exposure and insurance costs increase significantly." },
            { q: 'MOT_012', values: ['No'], append: "Without comprehensive motor insurance, you could face significant out-of-pocket costs from an accident or theft." }
          ],
          suffix: "Ensuring all your vehicles have appropriate insurance coverage is the most practical step you can take\u2014because being on the road shouldn't mean being at risk."
        }
      },
      catchAll: "Your assessment shows that your vehicle protection is an area worth reviewing. Making sure all your vehicles are adequately insured is the most important step\u2014because being on the road shouldn't mean being at risk."
    },
    recommendationTexts: {
      'vehicle protection': 'ensuring all your vehicles have appropriate insurance coverage to protect against accidents and theft'
    },
    realLifeContext: "Here\u2019s what this means in real life: If you were involved in a serious accident or your vehicle was stolen, would you be able to cover the loss without financial strain? Your CoverScore shows how prepared you are for vehicle-related risks that could disrupt your daily life."
  },
  SME: {
    assessmentTitle: 'Business Risk Assessment',
    domain: 'business',
    resilienceTerm: 'Business Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall business resilience',
    improvementTerm: 'business resilience',
    followUpMsg: "I'll also share practical business risk management tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Workforce': {
          base: "Your assessment shows that your workforce exposure could create significant liability for your business.",
          answerChecks: [
            { q: 'SME_013', values: ['51+'], append: "With more than 50 employees, your employment liability exposure is substantial and requires comprehensive coverage." }
          ],
          suffix: "Reviewing employer's liability and workforce insurance is an important step\u2014because a disruption shouldn't undo everything you've built."
        },
        'Financial': {
          base: "Your assessment suggests that your business's financial exposure may not be fully protected.",
          answerChecks: [
            { q: 'SME_014', values: ['Over \u20A6200M'], append: "With revenue over \u20A6200 million, your business has significant financial exposure that needs adequate insurance cover." }
          ],
          suffix: "Ensuring your business insurance adequately covers your revenue scale is essential for financial protection."
        },
        'Asset Protection': {
          base: "Your assessment indicates that your business assets may not be adequately protected against unexpected events.",
          answerChecks: [
            { q: 'SME_016', values: ['No'], append: "Without fire and burglary insurance, your business property and assets are vulnerable to significant loss." }
          ],
          suffix: "Getting comprehensive fire and burglary insurance is a critical step for protecting your business assets."
        },
        'Business Continuity': {
          base: "Your assessment shows that your business may not be prepared to survive a major disruption.",
          answerChecks: [
            { q: 'SME_017', values: ['No, we would close'], append: "Your business would not survive a three-month closure, highlighting a critical continuity gap." },
            { q: 'SME_017', values: ['With difficulty'], append: "Your business would struggle to recover from a major disaster, indicating that a continuity plan is needed." }
          ],
          suffix: "Creating a business continuity plan and ensuring adequate insurance coverage are the most impactful steps you can take."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current business resilience. The goal is to make sure a disruption doesn't undo everything you've built."
    },
    recommendationTexts: {
      'workforce': 'reviewing employer\'s liability and workforce insurance to protect your employees and business',
      'financial': 'ensuring your business insurance adequately covers your revenue scale for proper financial protection',
      'asset protection': 'getting comprehensive fire and burglary insurance to protect your business assets',
      'business continuity': 'creating a business continuity plan and ensuring adequate insurance coverage to survive disruptions'
    },
    realLifeContext: "Here\u2019s what this means in real life: If a fire, burglary, or prolonged closure hit your business today, would you be able to recover? Your CoverScore measures how resilient your business is to unexpected disruptions\u2014and every improvement means a stronger safety net for your employees and operations."
  },
  MFG: {
    assessmentTitle: 'Manufacturing Risk Assessment',
    domain: 'manufacturing',
    resilienceTerm: 'Operational Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall operational resilience',
    improvementTerm: 'operational resilience',
    followUpMsg: "I'll also share practical manufacturing risk management tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Workforce': {
          base: "Your assessment shows that your manufacturing workforce exposure could present significant liability risks.",
          answerChecks: [
            { q: 'MFG_013', values: ['200+'], append: "With over 200 employees, your workforce liability and compliance exposure is substantial." },
            { q: 'MFG_012', values: ["Yes"], append: "Workplace accidents in the past 3 years indicate gaps in your safety environment that need attention." }
          ],
          suffix: "Reviewing comprehensive workforce insurance and safety programs is an important step\u2014because downtime is expensive and protection is essential."
        },
        'Operations': {
          base: "Your assessment suggests that your manufacturing operations may be vulnerable to equipment-related disruptions.",
          answerChecks: [
            { q: 'MFG_014', values: ['Immediately'], append: "Critical machine breakdown would halt production immediately, creating significant revenue loss." },
            { q: 'MFG_020', values: ["No"], append: "Without written emergency procedures for accidents or fire, your staff may not know how to respond effectively in a crisis." },
            { q: 'MFG_023', values: ["No one specifically assigned"], append: "With no one specifically responsible for health and safety, critical compliance and risk management responsibilities may go unaddressed." },
            { q: 'MFG_024', values: ["Yes"], append: "Operating delivery vehicles and forklifts introduces additional liability and requires appropriate insurance coverage." },
            { q: 'MFG_025', values: ["No"], append: "Your delivery and material handling vehicle drivers lack safe operating procedure training, increasing accident risk." },
            { q: 'MFG_025', values: ["Not sure"], append: "You are uncertain whether your vehicle operators are trained in safe operating procedures, which itself indicates a training gap." },
            { q: 'MFG_026', values: ["No"], append: "Without regular vehicle safety inspections, your delivery fleet and material handling equipment may have undetected safety issues." }
          ],
          suffix: "Implementing equipment redundancy and preventive maintenance programs is essential for operational continuity."
        },
        'Asset Protection': {
          base: "Your assessment indicates that your manufacturing facility and assets may not be adequately insured.",
          answerChecks: [
            { q: 'MFG_016', values: ['No'], append: "Without fire and special perils insurance, your facility and equipment are exposed to catastrophic loss." },
            { q: 'MFG_021', values: ["No"], append: "Fire extinguishers are not regularly inspected or available across your facility, putting property and lives at risk." },
            { q: 'MFG_027', values: ["Never"], append: "You never conduct building maintenance inspections, allowing structural issues and hazards to go unnoticed." },
            { q: 'MFG_027', values: ["Rarely"], append: "Building maintenance inspections are rarely conducted, increasing the likelihood of undetected facility issues." }
          ],
          suffix: "Getting comprehensive fire and special perils insurance for your facility is a critical protection step."
        },
        'Business Continuity': {
          base: "Your assessment shows that your manufacturing business may not be prepared to recover from a major disaster.",
          answerChecks: [
            { q: 'MFG_017', values: ['No, we would close'], append: "Your business would not survive a major disaster closure, highlighting a critical continuity gap." },
            { q: 'MFG_017', values: ['With difficulty'], append: "Your business would struggle to recover from a major disaster, indicating the need for a stronger continuity plan." },
            { q: 'MFG_022', values: ["No"], append: "Your factory could not meet payroll and operating expenses during a one-month closure, indicating a critical financial resilience gap." },
            { q: 'MFG_022', values: ["Not sure"], append: "You're unsure if your factory could survive a one-month closure, which itself signals a need for better financial contingency planning." }
          ],
          suffix: "Creating a comprehensive business continuity and disaster recovery plan is the most impactful step you can take."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current operational resilience. The goal is clear: downtime is expensive and protection is essential."
    },
    recommendationTexts: {
      'workforce': 'reviewing comprehensive workforce insurance and safety programs to protect your employees',
      'operations': 'implementing equipment redundancy and preventive maintenance programs for operational continuity',
      'asset protection': 'getting comprehensive fire and special perils insurance for your facility and equipment',
      'business continuity': 'creating a comprehensive business continuity and disaster recovery plan for your manufacturing business'
    },
    realLifeContext: "Here\u2019s what this means in real life: A machine breakdown, fire, or supply chain disruption could halt your manufacturing operations for weeks. Your CoverScore measures how prepared you are to keep production running\u2014and every improvement means less downtime and greater revenue protection."
  },
  HOS: {
    assessmentTitle: 'Healthcare Risk Assessment',
    domain: 'healthcare',
    resilienceTerm: 'Healthcare Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall healthcare resilience',
    improvementTerm: 'healthcare resilience',
    followUpMsg: "I'll also share practical healthcare risk management tips and strategies that match your assessment.",
    pillarMappings: {},
    whyTexts: {
      'clinical risk & patient safety': "Your facility currently lacks key safeguards needed to manage clinical risks and maintain patient safety standards. A patient safety incident could create significant legal, financial, and reputational consequences for your healthcare organisation.",
      'professional liability': "Your facility currently lacks the clinical liability protections needed to manage patient care risks. Without appropriate professional indemnity safeguards, a patient claim could create significant legal, financial, and reputational exposure.",
      'medical equipment resilience': "Your medical equipment represents a significant clinical asset that may not be adequately protected against damage, power surge, or breakdown. Equipment failure could disrupt patient care and create unplanned financial pressure.",
      'operational continuity': "Your facility currently has gaps in operational safeguards that could affect your ability to maintain patient care during a disruption. Fire safety, building maintenance, and equipment protection gaps increase the risk of service interruption."
    },
    insightTexts: {
      perPillar: {
        'Clinical Risk & Patient Safety': {
          base: "Your assessment shows that your facility currently has significant exposure to clinical and patient safety risks. Without dedicated oversight for compliance and patient safety, important governance responsibilities may be missed.",
          answerChecks: [
            { q: 'HOS_013', values: ['Over 100'], append: "With over 100 patients, your patient volume creates significant clinical liability exposure that requires comprehensive risk management." },
            { q: 'HOS_012', values: ["Yes"], append: "Your facility has already experienced patient safety incidents, making strengthened governance and incident learning an immediate priority." },
            { q: 'HOS_020', values: ["No"], append: "Without written emergency procedures for patient incidents or fire, your staff may not know how to respond effectively in a crisis." },
            { q: 'HOS_022', values: ["No"], append: "Your facility could not meet payroll and operating expenses during a one-month closure, indicating a critical financial resilience gap." },
            { q: 'HOS_022', values: ["Not sure"], append: "You're unsure if your facility could survive a one-month closure, which signals a need for better financial contingency planning." },
            { q: 'HOS_024', values: ["Yes"], append: "Operating ambulances and patient transport vehicles introduces additional liability exposure for your facility." },
            { q: 'HOS_025', values: ["No"], append: "Your ambulance and patient transport drivers lack defensive driving and emergency protocol training, increasing accident risk." },
            { q: 'HOS_025', values: ["Not sure"], append: "You are uncertain whether your drivers are trained in defensive driving and emergency protocols, indicating a training gap." },
            { q: 'HOS_026', values: ["No"], append: "Without regular vehicle safety inspections, your medical transport fleet may have undetected safety issues." },
            { q: 'HOS_026', values: ["Not sure"], append: "You are uncertain whether vehicle safety inspections are conducted regularly, indicating a gap in fleet safety management." }
          ],
          suffix: "Clinical risk management and patient safety should be your priority\u2014because patient care depends on being prepared for anything."
        },
        'Professional Liability': {
          base: "Your assessment shows that your facility currently has significant exposure to clinical liability and compliance risks. Combined with the absence of professional indemnity protection, this increases legal, financial, and reputational exposure if a patient safety incident occurs.",
          answerChecks: [
            { q: 'HOS_015', values: ['No'], append: "Without professional indemnity or medical malpractice insurance, your facility faces significant legal and financial exposure from patient claims." },
            { q: 'HOS_023', values: ["No one specifically assigned"], append: "With no one specifically responsible for compliance and safety, critical regulatory and risk management responsibilities may go unaddressed." }
          ],
          suffix: "Securing professional indemnity protection and strengthening clinical governance are critical steps for your facility."
        },
        'Medical Equipment Resilience': {
          base: "Your assessment suggests that your medical equipment represents a significant clinical asset with potential protection gaps.",
          answerChecks: [
            { q: 'HOS_016', values: ['Yes'], append: "With high-value medical equipment on site, damage or breakdown could disrupt patient care and create significant financial pressure." }
          ],
          suffix: "Ensuring all high-value medical equipment is protected against damage and breakdown is important for continuity of patient care."
        },
        'Operational Continuity': {
          base: "Your assessment shows that your facility has gaps in operational safeguards that could affect your ability to maintain patient care during a disruption.",
          answerChecks: [
            { q: 'HOS_017', values: ['No'], append: "Without protection for critical life-support equipment, a power surge or breakdown could disrupt patient care and create significant costs." },
            { q: 'HOS_021', values: ["No"], append: "Fire extinguishers are not regularly inspected or available across your facility, putting patients, staff, and property at risk." },
            { q: 'HOS_027', values: ["Never"], append: "You never conduct building maintenance inspections, allowing structural issues and hazards to go unnoticed." },
            { q: 'HOS_027', values: ["Rarely"], append: "Building maintenance inspections are rarely conducted, increasing the likelihood of undetected facility issues." }
          ],
          suffix: "Strengthening operational safeguards is essential to maintaining uninterrupted patient care."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current healthcare resilience. The priority is clear\u2014because patient care depends on being prepared for anything."
    },
    recommendationTexts: {
      'clinical risk & patient safety': 'ensuring clinical risk management and patient safety governance with clearly assigned responsibilities',
      'professional liability': 'securing professional indemnity and medical malpractice protection for your healthcare facility',
      'medical equipment resilience': 'ensuring all high-value medical equipment is specifically protected against damage or breakdown',
      'operational continuity': 'strengthening operational safeguards including fire safety, building maintenance, and equipment protection'
    },
    realLifeContext: "Here\u2019s what this means in real life: A patient safety incident, equipment failure, or facility disruption could threaten the continuity of care your patients depend on. Your CoverScore reflects how prepared your healthcare facility is to manage clinical risks, protect patients, and maintain operations\u2014no matter what happens."
  },
  SCH: {
    assessmentTitle: 'School Risk Assessment',
    domain: 'education',
    resilienceTerm: 'School Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall school resilience',
    improvementTerm: 'school resilience',
    followUpMsg: "I'll also share practical ways to strengthen your school's safety and operational resilience.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Student Safety': {
          base: "Your assessment shows that your school may not be fully prepared to prevent and respond to student safety incidents.",
          answerChecks: [
            { q: 'SCH_013', values: ['Over 500'], append: "With over 500 students enrolled, the likelihood and potential impact of a safety incident increases substantially." },
            { q: 'SCH_012', values: ['Yes'], append: "You've experienced student accidents on your premises in the past 3 years, which points to potential gaps in your safety environment." },
            { q: 'SCH_020', values: ['No'], append: "Without written emergency procedures for accidents or fire, your staff may not know how to respond effectively in a crisis." }
          ],
          suffix: "Strengthening student safety means protecting the people at the heart of your school."
        },
        'Business Continuity': {
          base: "Your assessment reveals potential gaps in your school's ability to withstand and recover from unexpected disruptions.",
          answerChecks: [
            { q: 'SCH_014', values: ['Under \u20A6100,000'], append: "With lower tuition revenue per student, your school has less financial cushion to absorb unexpected disruptions or closures." },
            { q: 'SCH_022', values: ['No'], append: "You've indicated your school could not meet salary and operational expenses during a one-month closure, which is a significant financial resilience gap." },
            { q: 'SCH_022', values: ['Not sure'], append: "You're unsure if your school could survive a one-month closure, which itself signals a need for better financial contingency planning." }
          ],
          suffix: "Building business continuity ensures your school can keep its doors open and staff paid, even when the unexpected happens."
        },
        'Transport Safety': {
          base: "Your assessment indicates that your school may face exposure related to student transport.",
          answerChecks: [
            { q: 'SCH_015', values: ['Yes'], append: "Operating school buses means you carry responsibility for student safety beyond the school gates\u2014transport accidents can have serious consequences." },
            { q: 'SCH_024', values: ['No'], append: "Your school bus drivers lack first aid and defensive driving training, increasing the risk of accidents and injuries during transport." },
            { q: 'SCH_025', values: ['No'], append: "Without regular vehicle safety inspections, your school transport fleet may have undetected mechanical issues that could lead to breakdowns or accidents." },
            { q: 'SCH_025', values: ['Not sure'], append: "You're uncertain whether vehicle safety inspections are conducted regularly, which itself indicates a gap in transport safety management." }
          ],
          suffix: "Keeping students safe on the road is as important as keeping them safe in the classroom."
        },
        'Regulatory Readiness': {
          base: "Your assessment shows that no one is formally responsible for health and safety within your school, creating a significant governance gap.",
          answerChecks: [
            { q: 'SCH_016', values: ['No'], append: "Combined with the absence of public liability protection, this increases your exposure to legal claims, regulatory action, and reputational damage if another student incident occurs. These gaps could also reduce your school\u2019s ability to respond confidently when incidents happen." }
          ],
          suffix: ""
        },
        'Property Protection': {
          base: "Your assessment shows that your school\u2019s physical facilities and property may not be adequately safeguarded.",
          answerChecks: [
            { q: 'SCH_021', values: ['No'], append: "Fire extinguishers are not regularly inspected or available across your school buildings, putting property and lives at risk." },
            { q: 'SCH_026', values: ['No'], append: "Your school does not have a working fire alarm system that is regularly tested, meaning a fire could go undetected until it's too late." },
            { q: 'SCH_027', values: ['Never'], append: "You never conduct building maintenance inspections, allowing structural issues, electrical faults, and other hazards to go unnoticed." },
            { q: 'SCH_027', values: ['Rarely'], append: "Building maintenance inspections are rarely conducted, increasing the likelihood of undetected facility issues." },
            { q: 'SCH_017', values: ['No'], append: "Without fire insurance for your school buildings, a fire could result in catastrophic financial loss and disrupt learning for months." }
          ],
          suffix: "Your school buildings are the foundation of your operations\u2014protecting them ensures your school can continue serving your community."
        }
      },
      catchAll: "Your assessment provides a clear picture of your school\u2019s current operational resilience. The priority is protecting what matters most\u2014your students, your reputation, and your ability to deliver quality education."
    },
    recommendationTexts: {
      'student safety': 'reviewing your student safety procedures and ensuring comprehensive protection is in place for student accidents and injuries',
      'business continuity': 'developing a basic business continuity plan that covers temporary closure, loss of key personnel, and operational disruption',
      'transport safety': 'reviewing and updating insurance coverage for all school transport and vehicles used for student movement',
      'regulatory readiness': 'Your school currently lacks key governance and liability safeguards needed to respond effectively to student safety incidents',
      'property protection': 'getting comprehensive fire and building insurance for all school facilities and property'
    },
    realLifeContext: "Your school is more than a building\u2014it's a community. Parents trust you with the safety and education of their children. If a student incident, fire, or disruption were to happen, your school\u2019s ability to continue operations depends on the resilience you have in place today."
  },
  CHR: {
    assessmentTitle: 'Church Risk Assessment',
    domain: 'church',
    resilienceTerm: 'Church Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall church resilience',
    improvementTerm: 'church resilience',
    followUpMsg: "I'll also share practical church risk management tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Operations': {
          base: "Your assessment shows that your church's operational exposure could create liability risks during gatherings.",
          answerChecks: [
            { q: 'CHR_013', values: ['Over 1000'], append: "With over 1,000 congregants, your church has significant liability exposure during large gatherings." },
            { q: 'CHR_020', values: ["No"], append: "Without written emergency procedures for incidents during services or events, your team may not know how to respond effectively." },
            { q: 'CHR_022', values: ["No"], append: "Your church could not continue meeting operating expenses if closed for one month, indicating a critical financial resilience gap." },
            { q: 'CHR_022', values: ["Not sure"], append: "You're unsure if your church could survive a one-month closure, which signals a need for better financial contingency planning." },
            { q: 'CHR_024', values: ["Yes"], append: "Operating church vans or buses for transporting congregants introduces additional liability and requires appropriate motor insurance." },
            { q: 'CHR_025', values: ["No"], append: "Your church van and bus drivers lack defensive driving and first aid training, increasing accident risk." },
            { q: 'CHR_025', values: ["Not sure"], append: "You are uncertain whether your drivers are trained in defensive driving and first aid, which indicates a training gap." },
            { q: 'CHR_026', values: ["No"], append: "Without regular vehicle safety inspections, your church transport may have undetected safety issues." },
            { q: 'CHR_026', values: ["Not sure"], append: "You are uncertain whether vehicle safety inspections are conducted for your church transport, indicating a gap in fleet safety management." }
          ],
          suffix: "Reviewing comprehensive public liability insurance for large gatherings is an important step\u2014because protecting your congregation protects your mission."
        },
        'Assets': {
          base: "Your assessment suggests that your church's valuable assets may not be adequately protected.",
          answerChecks: [
            { q: 'CHR_014', values: ['Yes'], append: "Valuable musical instruments and broadcast equipment require specialized insurance to protect against loss or damage." }
          ],
          suffix: "Ensuring high-value church assets are specifically insured is a practical step for protection."
        },
        'Legal Liability': {
          base: "Your assessment indicates that your church may not be adequately protected against event liability.",
          answerChecks: [
            { q: 'CHR_015', values: ['No'], append: "Without insurance if a congregant is injured on church premises, your church faces significant legal exposure." },
            { q: 'CHR_012', values: ["Yes"], append: "Incidents or injuries on your premises in the past 3 years indicate safety gaps that need attention." },
            { q: 'CHR_023', values: ["No one specifically assigned"], append: "With no one specifically responsible for health and safety, critical responsibilities may go unaddressed." }
          ],
          suffix: "Securing comprehensive public liability insurance for your premises is essential."
        },
        'Property': {
          base: "Your assessment shows that your church building and contents may not be adequately insured.",
          answerChecks: [
            { q: 'CHR_017', values: ['No'], append: "Without fire insurance, your church building and contents are vulnerable to catastrophic loss." },
            { q: 'CHR_021', values: ["No"], append: "Fire extinguishers are not regularly inspected or available across your church buildings, putting property and lives at risk." },
            { q: 'CHR_027', values: ["Never"], append: "You never conduct building maintenance inspections for your church facilities, allowing issues to go undetected." },
            { q: 'CHR_027', values: ["Rarely"], append: "Building maintenance inspections are rarely conducted for your church facilities, increasing the likelihood of undetected issues." }
          ],
          suffix: "Getting fire insurance for the church building and contents is a critical step for property protection."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current church resilience. The priority is clear\u2014because protecting your congregation protects your mission."
    },
    recommendationTexts: {
      'operations': 'reviewing comprehensive public liability insurance for large gatherings at your church',
      'assets': 'ensuring high-value musical instruments and broadcast equipment are specifically insured',
      'legal liability': 'securing comprehensive public liability insurance for your church premises',
      'property': 'getting fire insurance for the church building and contents to protect your property'
    },
    realLifeContext: "Here\u2019s what this means in real life: A congregant injury, fire, or theft of valuable equipment could disrupt your church\u2019s operations and create financial strain. Your CoverScore reflects how well your church is protected so you can focus on your mission with confidence."
  },
  CON: {
    assessmentTitle: 'Construction Risk Assessment',
    domain: 'construction',
    resilienceTerm: 'Construction Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall construction resilience',
    improvementTerm: 'construction resilience',
    followUpMsg: "I'll also share practical construction risk management tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Operations': {
          base: "Your assessment shows that your construction operations have risk exposure that needs to be addressed.",
          answerChecks: [
            { q: 'CON_013', values: ['More than 5'], append: "Managing many concurrent projects increases risk exposure and requires careful insurance coordination." },
            { q: 'CON_020', values: ["No"], append: "Without written emergency procedures for on-site accidents or fire, your workers may not know how to respond effectively in a crisis." },
            { q: 'CON_024', values: ["Yes"], append: "Operating heavy vehicles and transporting materials introduces additional liability and requires appropriate fleet insurance." },
            { q: 'CON_025', values: ["No"], append: "Your heavy vehicle and equipment operators lack safe operating procedure training, increasing accident risk." },
            { q: 'CON_025', values: ["Not sure"], append: "You are uncertain whether your operators are trained in safe operating procedures, which indicates a training gap." },
            { q: 'CON_026', values: ["No"], append: "Without regular vehicle and equipment safety inspections, your fleet may have undetected safety issues." },
            { q: 'CON_026', values: ["Not sure"], append: "You are uncertain whether vehicle safety inspections are conducted regularly, indicating a gap in fleet safety management." }
          ],
          suffix: "Ensuring each project has adequate insurance coverage is an important operational step\u2014because every project deserves to be protected."
        },
        'Equipment': {
          base: "Your assessment suggests that your construction equipment may represent a significant uninsured risk.",
          answerChecks: [
            { q: 'CON_014', values: ['Yes'], append: "Heavy machinery on site creates significant liability and damage risk that requires comprehensive coverage." },
            { q: 'CON_027', values: ["Never"], append: "You never conduct maintenance inspections for your tools, machinery, and site facilities, allowing issues to go undetected." },
            { q: 'CON_027', values: ["Rarely"], append: "Equipment maintenance inspections are rarely conducted, increasing the likelihood of undetected issues." }
          ],
          suffix: "Ensuring all heavy machinery is comprehensively insured is essential for your operations."
        },
        'Insurance': {
          base: "Your assessment indicates that your construction projects may not be adequately insured.",
          answerChecks: [
            { q: 'CON_015', values: ['No'], append: "Without contractor's all-risk or works insurance, your projects are exposed to significant financial loss." },
            { q: 'CON_021', values: ["No"], append: "Fire extinguishers are not regularly inspected or available across your work sites, putting property and lives at risk." }
          ],
          suffix: "Getting comprehensive contractor's all-risk insurance is a critical step\u2014because every project deserves to be protected."
        },
        'Worker Protection': {
          base: "Your assessment shows that your on-site workers may not be adequately protected against accidents.",
          answerChecks: [
            { q: 'CON_016', values: ['No'], append: "Without group personal accident cover, your workers and your business are exposed to accident-related costs." },
            { q: 'CON_012', values: ["Yes"], append: "On-site accidents in the past 3 years indicate safety gaps that need attention." },
            { q: 'CON_023', values: ["No one specifically assigned"], append: "With no one specifically responsible for health and safety on site, critical compliance responsibilities may go unaddressed." }
          ],
          suffix: "Getting group personal accident cover for all on-site workers is essential for worker protection."
        },
        'Contractual': {
          base: "Your assessment suggests that your business may not be protected against project delay penalties.",
          answerChecks: [
            { q: 'CON_017', values: ['No'], append: "Without protection against project delay penalties, your business could face significant financial liability." },
            { q: 'CON_022', values: ["No"], append: "Your business could not continue meeting payroll and operating expenses if a major project was halted for one month, indicating a critical financial resilience gap." },
            { q: 'CON_022', values: ["Not sure"], append: "You're unsure if your business could survive a major project halt, which signals a need for better financial contingency planning." }
          ],
          suffix: "Reviewing contract terms and considering delay penalty protection is a practical step for risk management."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current construction resilience. The priority is clear\u2014because every project deserves to be protected."
    },
    recommendationTexts: {
      'operations': 'ensuring each construction project has adequate insurance coverage for proper risk management',
      'equipment': 'ensuring all heavy machinery is comprehensively insured to protect your equipment',
      'insurance': 'getting comprehensive contractor\'s all-risk insurance to protect your construction projects',
      'worker protection': 'getting group personal accident cover for all on-site workers to protect your team',
      'contractual': 'reviewing contract terms and considering delay penalty protection for your projects'
    },
    realLifeContext: "Here\u2019s what this means in real life: A workplace accident, equipment damage, or project delay could put your construction business under serious financial pressure. Your CoverScore measures how prepared you are to keep projects on track and protect your workers and bottom line."
  },
  TRN: {
    assessmentTitle: 'Transport Risk Assessment',
    domain: 'transport',
    resilienceTerm: 'Transport Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall transport resilience',
    improvementTerm: 'transport resilience',
    followUpMsg: "I'll also share practical transport risk management tips and strategies that match your assessment.",
    pillarMappings: {},
    insightTexts: {
      perPillar: {
        'Fleet': {
          base: "Your assessment shows that your fleet management has risk exposures that need attention.",
          answerChecks: [
            { q: 'TRN_013', values: ['Over 20'], append: "With over 20 vehicles, your fleet creates significant cumulative risk exposure that requires comprehensive management." },
            { q: 'TRN_012', values: ["Yes"], append: "Fleet accidents in the past 3 years indicate safety gaps that need attention." },
            { q: 'TRN_020', values: ["No"], append: "Without written emergency procedures for road accidents or fleet incidents, your drivers may not know how to respond effectively." },
            { q: 'TRN_025', values: ["No"], append: "Without regular vehicle safety inspections, your entire fleet may have undetected safety issues." },
            { q: 'TRN_025', values: ["Not sure"], append: "You are uncertain whether vehicle safety inspections are conducted regularly for your fleet, indicating a gap in fleet safety management." },
            { q: 'TRN_027', values: ["Never"], append: "You never conduct maintenance inspections for your depot and yard facilities, allowing issues to go undetected." },
            { q: 'TRN_027', values: ["Rarely"], append: "Depot and yard maintenance inspections are rarely conducted, increasing the likelihood of undetected issues." }
          ],
          suffix: "Implementing fleet-wide risk management and comprehensive insurance is an important step\u2014because your fleet should keep moving, not stop for the unexpected."
        },
        'Insurance': {
          base: "Your assessment indicates that your goods in transit may not be adequately insured.",
          answerChecks: [
            { q: 'TRN_015', values: ['No'], append: "Without fleet insurance for goods in transit, your cargo is exposed to loss or damage during transportation." },
            { q: 'TRN_022', values: ["No"], append: "Your transport business could not continue meeting payroll and operating expenses if fleet operations were suspended for one month, indicating a critical financial resilience gap." },
            { q: 'TRN_022', values: ["Not sure"], append: "You're unsure if your business could survive a one-month fleet suspension, which signals a need for better financial contingency planning." }
          ],
          suffix: "Getting comprehensive goods-in-transit insurance is essential for protecting your cargo."
        },
        'Worker Protection': {
          base: "Your assessment shows that your drivers may not be adequately protected against accidents.",
          answerChecks: [
            { q: 'TRN_016', values: ['No'], append: "Without group personal accident cover, your drivers and your business are exposed to accident-related costs." },
            { q: 'TRN_024', values: ["No"], append: "Your drivers are not trained in defensive driving and first aid, increasing accident risk and liability exposure." },
            { q: 'TRN_024', values: ["Not sure"], append: "You are uncertain whether your drivers are trained in defensive driving and first aid, which indicates a training gap." }
          ],
          suffix: "Getting group personal accident cover for all drivers is essential for worker protection."
        },
        'Compliance': {
          base: "Your assessment suggests that your fleet may not be fully compliant with motor insurance requirements.",
          answerChecks: [
            { q: 'TRN_017', values: ['No'], append: "Without comprehensive motor insurance for all fleet vehicles, you face compliance and financial risks." },
            { q: 'TRN_017', values: ['Some of them'], append: "Only some of your vehicles have comprehensive motor insurance, leaving gaps in your fleet protection." },
            { q: 'TRN_021', values: ["No"], append: "Fire extinguishers are not regularly inspected or available in your depot and vehicles, putting property and lives at risk." },
            { q: 'TRN_023', values: ["No one specifically assigned"], append: "With no one specifically responsible for safety and compliance, critical regulatory responsibilities may go unaddressed." },
            { q: 'TRN_026', values: ["No"], append: "Your depot or yard does not have a working fire alarm system that is regularly tested." },
            { q: 'TRN_026', values: ["Not sure"], append: "You are uncertain whether your depot has a working fire alarm system, indicating a gap in fire safety management." }
          ],
          suffix: "Extending comprehensive motor insurance to your entire fleet is a critical step for compliance and protection."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current transport resilience. The goal is simple\u2014your fleet should keep moving, not stop for the unexpected."
    },
    recommendationTexts: {
      'fleet': 'implementing fleet-wide risk management and comprehensive insurance for your vehicles',
      'insurance': 'getting comprehensive goods-in-transit insurance to protect your cargo during transportation',
      'worker protection': 'getting group personal accident cover for all drivers to protect your team',
      'compliance': 'extending comprehensive motor insurance to your entire fleet for compliance and protection'
    },
    realLifeContext: "Here\u2019s what this means in real life: An accident, cargo theft, or compliance issue could ground your fleet and disrupt your entire operation. Your CoverScore reflects how prepared your transport business is to keep moving\u2014no matter what happens on the road."
  }
};

const defaultDomain = {
  assessmentTitle: 'Risk Assessment',
  domain: 'general',
  resilienceTerm: 'Protection Profile',
  displayLabel: 'Protection',
  closingTerm: 'overall protection profile',
  improvementTerm: 'protection profile',
  followUpMsg: "I'll also share practical tips and strategies that match your assessment.",
  pillarMappings: {}
};

module.exports = { domainConfig, defaultDomain };
