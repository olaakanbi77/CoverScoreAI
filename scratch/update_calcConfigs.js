const fs = require('fs');

let code = fs.readFileSync('src/views/landing.hbs', 'utf8');

const replacement = `        school: {
          inputs: [
            { id: 'inp_students', label: 'Number of Students', min: 0, max: 5000, val: 500, step: 50, factor: 300000, isMobile: true, icon: '<svg width="24" height="24" fill="none" stroke="#00A651" stroke-width="2"><path d="M12 4L4 8l8 4 8-4-8-4z"/><path d="M4 12v4l8 4 8-4v-4"/></svg>' },
            { id: 'inp_staff', label: 'Number of Staff', min: 0, max: 500, val: 45, step: 5, factor: 500000, isMobile: false },
            { id: 'inp_building', label: 'Building Value', min: 0, max: 2000000000, val: 300000000, step: 10000000, factor: 0.25, isMobile: true, icon: '<svg width="24" height="24" fill="none" stroke="#00A651" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg>' },
            { id: 'inp_buses', label: 'School Buses', min: 0, max: 50, val: 3, step: 1, factor: 5000000, isMobile: false }
          ],
          baseExposure: 10000000
        },
        manufacturing: {
          inputs: [
            { id: 'inp_facilities', label: 'Number of Facilities', min: 0, max: 50, val: 2, step: 1, factor: 20000000, isMobile: true, icon: '<svg width="24" height="24" fill="none" stroke="#00A651" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg>' },
            { id: 'inp_staff', label: 'Number of Staff', min: 0, max: 5000, val: 150, step: 10, factor: 500000, isMobile: false },
            { id: 'inp_machinery', label: 'Machinery Value', min: 0, max: 5000000000, val: 500000000, step: 10000000, factor: 0.3, isMobile: true, icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A651" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="6 10 10 10 12 6 14 14 16 10 18 10"/></svg>' },
            { id: 'inp_delay', label: 'Supply Chain Delay Risk', min: 0, max: 30, val: 7, step: 1, factor: 2000000, isMobile: false }
          ],
          baseExposure: 15000000
        },
        church: {
          inputs: [
            { id: 'inp_attendance', label: 'Weekly Attendance', min: 0, max: 20000, val: 500, step: 50, factor: 200000, isMobile: true, icon: '<svg width="24" height="24" fill="none" stroke="#00A651" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
            { id: 'inp_staff', label: 'Staff/Volunteers', min: 0, max: 500, val: 20, step: 5, factor: 100000, isMobile: false },
            { id: 'inp_property', label: 'Property Value', min: 0, max: 2000000000, val: 150000000, step: 5000000, factor: 0.2, isMobile: true, icon: '<svg width="24" height="24" fill="none" stroke="#00A651" stroke-width="2"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>' },
            { id: 'inp_events', label: 'Special Events per Year', min: 0, max: 50, val: 5, step: 1, factor: 1000000, isMobile: false }
          ],
          baseExposure: 5000000
        },
        sme: {
          inputs: [
            { id: 'inp_revenue', label: 'Monthly Revenue', min: 0, max: 100000000, val: 5000000, step: 500000, factor: 3, isMobile: true, icon: '<svg width="24" height="24" fill="none" stroke="#00A651" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
            { id: 'inp_staff', label: 'Number of Employees', min: 0, max: 200, val: 15, step: 1, factor: 500000, isMobile: false },
            { id: 'inp_inventory', label: 'Inventory Value', min: 0, max: 50000000, val: 5000000, step: 500000, factor: 0.5, isMobile: true, icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A651" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' },
            { id: 'inp_data', label: 'Data Breach Risk (1-10)', min: 1, max: 10, val: 5, step: 1, factor: 1000000, isMobile: false }
          ],
          baseExposure: 2000000
        }`;

const regex = /school: \{[\s\S]*?baseExposure: 0\s*\}\s*\};/;
if (regex.test(code)) {
    code = code.replace(regex, replacement + '\n      };');
    fs.writeFileSync('src/views/landing.hbs', code, 'utf8');
    console.log('Successfully replaced calculator configs.');
} else {
    console.log('Failed to match regex.');
}
