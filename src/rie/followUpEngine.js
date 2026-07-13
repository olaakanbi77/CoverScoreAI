const determineFollowUp = (leadData, assessmentData) => {
  const { status, wa_state, is_qualified, engagement_points, score } = leadData;

  if (score < 40 && assessmentData.advisor_requested) {
    return {
      nextAction: 'Contact advisor for immediate follow-up',
      timing: 2,
      channel: 'phone',
      template: 'urgent_advisor_followup',
      priority: 'high',
      tasks: [
        { action: 'Call lead to discuss assessment results and connect with advisor', dueBy: 2, assignedTo: 'advisor' }
      ]
    };
  }

  if (score < 40 && !assessmentData.advisor_requested) {
    return {
      nextAction: 'Send follow-up message with recommendations',
      timing: 24,
      channel: 'email',
      template: 'low_score_followup',
      priority: 'medium',
      tasks: [
        { action: 'Send personalized recommendations email', dueBy: 24, assignedTo: 'system' },
        { action: 'Check for reply within 48 hours', dueBy: 72, assignedTo: 'agent' }
      ]
    };
  }

  if (score >= 40 && score <= 70) {
    return {
      nextAction: 'Send risk improvement tips',
      timing: 48,
      channel: 'email',
      template: 'risk_tips',
      priority: 'low',
      tasks: [
        { action: 'Send risk improvement tips based on assessment', dueBy: 48, assignedTo: 'system' }
      ]
    };
  }

  if (score > 70) {
    return {
      nextAction: 'Send assessment report',
      timing: 72,
      channel: 'email',
      template: 'assessment_report',
      priority: 'low',
      tasks: [
        { action: 'Send full assessment report', dueBy: 72, assignedTo: 'system' }
      ]
    };
  }

  if (engagement_points > 5) {
    return {
      nextAction: 'Call lead for engagement follow-up',
      timing: 4,
      channel: 'phone',
      template: 'high_engagement_followup',
      priority: 'high',
      tasks: [
        { action: 'Call lead to discuss high engagement and offer personalized consultation', dueBy: 4, assignedTo: 'agent' }
      ]
    };
  }

  return {
    nextAction: 'Send report link',
    timing: 24,
    channel: 'email',
    template: 'report_link',
    priority: 'medium',
    tasks: [
      { action: 'Send assessment report link', dueBy: 24, assignedTo: 'system' }
    ]
  };
};

module.exports = { determineFollowUp };
