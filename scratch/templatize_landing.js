const fs = require('fs');

let hbs = fs.readFileSync('src/views/landing.hbs', 'utf8');

// Replace standard fallbacks and hardcoded strings:
hbs = hbs.replace(/See Your Hospital's/g, "See Your {{data.shortName}}'s");
hbs = hbs.replace(/Most hospitals discover/g, "Most {{data.shortNamePlural}} discover");
hbs = hbs.replace(/Get My Hospital Risk Score/g, "Get My {{data.shortName}} Risk Score");
hbs = hbs.replace(/Trusted by hospital leaders across the country./g, "Trusted by {{data.shortNameLower}} leaders across the country.");

// Calculator mobile view
hbs = hbs.replace(/What Could One Incident Cost Your <span style="color: #00A651;">Hospital<\/span>\?/g, 'What Could One Incident Cost Your <span style="color: #00A651;">{{data.shortName}}</span>?');
hbs = hbs.replace(/A quick estimate based on your hospital size and equipment value./g, 'A quick estimate based on your {{data.shortNameLower}} size and equipment value.');
hbs = hbs.replace(/This is what one major incident could cost your hospital./g, 'This is what one major incident could cost your {{data.shortNameLower}}.');
hbs = hbs.replace(/Get My Actual Hospital Risk Score/g, 'Get My Actual {{data.shortName}} Risk Score');
hbs = hbs.replace(/Answer a few simple questions about your hospital/g, 'Answer a few simple questions about your {{data.shortNameLower}}');

// Why Choose section
hbs = hbs.replace(/Why Hospitals Choose/g, 'Why {{data.shortNamePlural}} Choose');
hbs = hbs.replace(/Lessons every hospital should learn./g, 'Lessons every {{data.shortNameLower}} should learn.');

// General texts
hbs = hbs.replace(/Get your hospital risk score in less than 5 minutes./g, 'Get your {{data.shortNameLower}} risk score in less than 5 minutes.');
hbs = hbs.replace(/Trusted by 500\+<br>Healthcare Facilities/g, 'Trusted by 500+<br>{{data.facilityType}}');
hbs = hbs.replace(/Trusted by 500\+ Healthcare Facilities/g, 'Trusted by 500+ {{data.facilityType}}');

// Sample Score text
hbs = hbs.replace(/This is a sample risk score for a general hospital\./g, 'This is a sample risk score for a typical {{data.shortNameLower}}.');
hbs = hbs.replace(/Your hospital is more exposed than 68% of similar facilities\./g, 'Your {{data.shortNameLower}} is more exposed than 68% of similar facilities.');

// Footer text
hbs = hbs.replace(/Join hospitals that are taking control of risk/g, 'Join {{data.shortNamePlural}} that are taking control of risk');
hbs = hbs.replace(/<span style="color: white; font-size: 0.45rem; line-height: 1;">Hospitals<\/span>/g, '<span style="color: white; font-size: 0.45rem; line-height: 1;">{{data.shortNamePlural}}</span>');
hbs = hbs.replace(/Helping hospitals identify, quantify and reduce/g, 'Helping {{data.shortNamePlural}} identify, quantify and reduce');
hbs = hbs.replace(/Take the first step toward a safer hospital\./g, 'Take the first step toward a safer {{data.shortNameLower}}.');

// Mobile footer action
hbs = hbs.replace(/<span style="font-size:13px; font-weight:700; color:white; letter-spacing:0.5px; opacity: 0\.95;">GET MY HOSPITAL<\/span>/g, '<span style="font-size:13px; font-weight:700; color:white; letter-spacing:0.5px; opacity: 0.95; text-transform: uppercase;">GET MY {{data.shortName}}</span>');

fs.writeFileSync('src/views/landing.hbs', hbs, 'utf8');
console.log("Successfully templatized landing.hbs");
