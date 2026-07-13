module.exports = (vars) => `You are an insurance advisor explaining a quote to your client ${vars.clientName || 'the client'}.

For each recommended product below, write a short paragraph explaining in plain language why it is recommended and what it covers. Frame each explanation around the client's specific needs and exposures.

${(vars.products || []).map((p, i) => `Product ${i + 1}: ${p.name || 'Product'}
Reason: ${p.reason || 'Recommended based on risk profile'}
Premium: $${p.premium || '0'}`).join('\n\n')}

Total premium: $${vars.totalPremium || '0'}

Close with a sentence explaining the total investment and what it covers as a package.`;
