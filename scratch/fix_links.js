const fs = require('fs');

const replacements = [
  {
    file: 'src/views/advisor/follow-up.hbs',
    rules: [
      { from: /<a href="#" class="btn-call">/g, to: '<a href="javascript:void(0)" class="btn-call">' },
      { from: /<a href="#" class="view-full">/g, to: '<a href="javascript:void(0)" class="view-full">' },
      { from: /<a href="#" class="card-link">/g, to: '<a href="javascript:void(0)" class="card-link">' },
      { from: /<a href="#" class="qa-btn wa">/g, to: '<a href="javascript:void(0)" class="qa-btn wa">' },
      { from: /<a href="#" class="qa-btn call">/g, to: '<a href="javascript:void(0)" class="qa-btn call">' },
      { from: /<a href="#" class="qa-btn email">/g, to: '<a href="javascript:void(0)" class="qa-btn email">' },
      { from: /<a href="#" class="qa-btn sched">/g, to: '<a href="javascript:void(0)" class="qa-btn sched">' }
    ]
  },
  {
    file: 'src/views/advisor/proposal-writer.hbs',
    rules: [
      { from: /<a href="#" class="qb-save">/g, to: '<a href="javascript:void(0)" class="qb-save">' },
      { from: /<a href="#" class="bab-link">/g, to: '<a href="javascript:void(0)" class="bab-link">' },
      { from: /<a href="#" class="btn-next">/g, to: '<a href="/advisor/follow-up/{{lead.id}}" class="btn-next">' }
    ]
  },
  {
    file: 'src/views/admin/opportunities.hbs',
    rules: [
      { from: /<a href="#" class="btn-new-opp">/g, to: '<a href="/admin/leads" class="btn-new-opp">' },
      { from: /<a href="#" class="btn-filter">/g, to: '<a href="javascript:void(0)" class="btn-filter">' },
      { from: /<a href="#" class="pipeline-view-all">/g, to: '<a href="javascript:void(0)" class="pipeline-view-all">' },
      { from: /<a href="#" class="section-view-all">/g, to: '<a href="javascript:void(0)" class="section-view-all">' },
      { from: /<a href="#" class="btn-action bg-green">Contact<\/a>/g, to: '<a href="/advisor/lead-details/1" class="btn-action bg-green">Contact</a>' },
      { from: /<a href="#" class="btn-action bg-blue">Follow Up<\/a>/g, to: '<a href="/advisor/follow-up/1" class="btn-action bg-blue">Follow Up</a>' },
      { from: /<a href="#" class="btn-action bg-purple">Follow Up<\/a>/g, to: '<a href="/advisor/follow-up/1" class="btn-action bg-purple">Follow Up</a>' }
    ]
  },
  {
    file: 'src/views/admin/proposals.hbs',
    rules: [
      { from: /<a href="#" class="view-all">/g, to: '<a href="javascript:void(0)" class="view-all">' }
    ]
  },
  {
    file: 'src/views/admin/assessments.hbs',
    rules: [
      { from: /<a href="#" class="btn-share">/g, to: '<a href="javascript:void(0)" class="btn-share">' },
      { from: /<a href="#" class="btn-templates">/g, to: '<a href="javascript:void(0)" class="btn-templates">' },
      { from: /<a href="#" class="section-view-all">/g, to: '<a href="javascript:void(0)" class="section-view-all">' }
    ]
  },
  {
    file: 'src/views/advisor/lead-details.hbs',
    rules: [
      { from: /<a href="#" class="view-all-link">/g, to: '<a href="javascript:void(0)" class="view-all-link">' },
      { from: /<a href="#" class="qa-btn">/g, to: '<a href="javascript:void(0)" class="qa-btn">' }
    ]
  },
  {
    file: 'src/views/advisor/dashboard.hbs',
    rules: [
      { from: /<a href="#" class="qa-item">/g, to: '<a href="javascript:void(0)" class="qa-item">' }
    ]
  }
];

replacements.forEach(r => {
  if (fs.existsSync(r.file)) {
    let content = fs.readFileSync(r.file, 'utf8');
    let changed = false;
    r.rules.forEach(rule => {
      const newContent = content.replace(rule.from, rule.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
    if (changed) {
      fs.writeFileSync(r.file, content);
      console.log('Updated ' + r.file);
    }
  }
});
