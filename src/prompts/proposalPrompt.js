module.exports = (vars) => `You are drafting a formal proposal cover letter for a business insurance client.

Date: ${vars.date || 'Today\'s date'}
Client: ${vars.clientName || 'Client'}
Business: ${vars.businessName || 'their business'}
Advisor: ${vars.advisorName || 'your advisor'}

Proposed products:
${(vars.products || []).map((p, i) => `${i + 1}. ${p.name || 'Product'} - $${p.premium || '0'}`).join('\n')}

Total premium: $${vars.totalPremium || '0'}

Write a professional business letter that:
1. thanks the client for completing their CoverScore assessment
2. summarizes the key findings from their risk profile
3. introduces the proposed insurance solutions
4. explains next steps (review, ask questions, bind coverage)
5. expresses confidence in the partnership ahead

Format as a formal letter with date, salutation, body paragraphs, and closing.`;
