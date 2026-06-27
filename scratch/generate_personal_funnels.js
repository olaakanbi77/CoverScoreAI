const fs = require('fs');

const srcFile = 'src/views/coverscore-personal.hbs';
const template = fs.readFileSync(srcFile, 'utf8');

const funnels = [
  {
    id: 'retirement',
    campaign: 'RETIREMENT',
    replacements: [
      [/Family Protection Score/g, 'Retirement Readiness Score'],
      [/Family Protection/g, 'Retirement Readiness'],
      [/family protection/g, 'retirement readiness'],
      [/Family/g, 'Retirement'],
      [/family/g, 'retirement'],
      [/household protection/g, 'retirement protection'],
      [/How prepared is your family for <span class="text-green">life's unexpected changes\\?<\/span>/g, 'How prepared are you for the <span class="text-green">retirement you deserve?</span>'],
      [/If your <strong>income stopped tomorrow<\/strong>, how much would your family need to stay financially secure\\?/g, 'If you <strong>stopped working tomorrow</strong>, how much would you need to maintain your lifestyle?'],
      [/Your Estimated Household Exposure/g, 'Your Estimated Retirement Shortfall'],
      [/EXPOSURE CALCULATOR/g, 'RETIREMENT CALCULATOR']
    ]
  },
  {
    id: 'health',
    campaign: 'HEALTH',
    replacements: [
      [/Family Protection Score/g, 'Health Protection Score'],
      [/Family Protection/g, 'Health Protection'],
      [/family protection/g, 'health protection'],
      [/Family/g, 'Health'],
      [/family/g, 'health'],
      [/household protection/g, 'medical emergency'],
      [/How prepared is your family for <span class="text-green">life's unexpected changes\\?<\/span>/g, 'Is a medical emergency the <span class="text-green">biggest threat to your finances?</span>'],
      [/If your <strong>income stopped tomorrow<\/strong>, how much would your family need to stay financially secure\\?/g, 'If a <strong>medical emergency happened tomorrow</strong>, how much would you need for treatment?'],
      [/Your Estimated Household Exposure/g, 'Your Estimated Health Exposure'],
      [/EXPOSURE CALCULATOR/g, 'HEALTH CALCULATOR']
    ]
  },
  {
    id: 'income',
    campaign: 'INCOME',
    replacements: [
      [/Family Protection Score/g, 'Income Protection Score'],
      [/Family Protection/g, 'Income Protection'],
      [/family protection/g, 'income protection'],
      [/Family/g, 'Income'],
      [/family/g, 'income'],
      [/household protection/g, 'income protection'],
      [/How prepared is your family for <span class="text-green">life's unexpected changes\\?<\/span>/g, 'If your income stopped tomorrow, <span class="text-green">how long could you survive?</span>'],
      [/If your <strong>income stopped tomorrow<\/strong>, how much would your family need to stay financially secure\\?/g, 'If your <strong>income stopped tomorrow</strong>, how much would you need to stay financially secure?'],
      [/Your Estimated Household Exposure/g, 'Your Estimated Income Gap'],
      [/EXPOSURE CALCULATOR/g, 'INCOME CALCULATOR']
    ]
  },
  {
    id: 'young-professional',
    campaign: 'YOUNG_PRO',
    replacements: [
      [/Family Protection Score/g, 'Young Pro Score'],
      [/Family Protection/g, 'Young Pro'],
      [/family protection/g, 'young pro'],
      [/Family/g, 'Future'],
      [/family/g, 'future'],
      [/household protection/g, 'wealth building'],
      [/How prepared is your family for <span class="text-green">life's unexpected changes\\?<\/span>/g, "You're building your career. <span class=\"text-green\">Are you protecting your future?</span>"],
      [/If your <strong>income stopped tomorrow<\/strong>, how much would your family need to stay financially secure\\?/g, 'If an <strong>emergency happened tomorrow</strong>, how much would you need to stay on track?'],
      [/Your Estimated Household Exposure/g, 'Your Estimated Wealth Gap'],
      [/EXPOSURE CALCULATOR/g, 'FUTURE CALCULATOR']
    ]
  },
  {
    id: 'entrepreneur',
    campaign: 'ENTREPRENEUR',
    replacements: [
      [/Family Protection Score/g, 'Entrepreneur Score'],
      [/Family Protection/g, 'Entrepreneur Risk'],
      [/family protection/g, 'entrepreneur risk'],
      [/Family/g, 'Business'],
      [/family/g, 'business'],
      [/household protection/g, 'business continuity'],
      [/How prepared is your family for <span class="text-green">life's unexpected changes\\?<\/span>/g, 'You built your business. <span class="text-green">But who is protecting you?</span>'],
      [/If your <strong>income stopped tomorrow<\/strong>, how much would your family need to stay financially secure\\?/g, "If you couldn't run your business tomorrow, how much would it need to survive?"],
      [/Your Estimated Household Exposure/g, 'Your Estimated Business Risk'],
      [/EXPOSURE CALCULATOR/g, 'ENTREPRENEUR CALCULATOR']
    ]
  }
];

funnels.forEach(f => {
  let newHtml = template;
  
  // Apply specific replacements
  f.replacements.forEach(([regex, replacement]) => {
    newHtml = newHtml.replace(regex, replacement);
  });
  
  // Replace the campaign code in JS
  // Old logic: const text = encodeURIComponent(`FAMILY ${campaignCode}`);
  newHtml = newHtml.replace(/const text = encodeURIComponent\(`FAMILY \$\{campaignCode\}`\);/g, `const text = encodeURIComponent(\`${f.campaign} \$\{campaignCode\}\`);`);
  
  fs.writeFileSync(`src/views/coverscore-personal-${f.id}.hbs`, newHtml);
  console.log(`Created src/views/coverscore-personal-${f.id}.hbs`);
  
  fs.writeFileSync(`src/views/coverscore-personal-${f.id}-calculator.hbs`, newHtml);
  console.log(`Created src/views/coverscore-personal-${f.id}-calculator.hbs`);
});
