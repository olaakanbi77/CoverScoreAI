var d=require("/app/src/data/question_bank.json");
var found=d.find(function(x){return x.id==="FAM_001";});
console.log("FAM_001:",found?"FOUND":"NOT FOUND");
if(found)console.log("type:"+found.question_type+" len:"+found.question.length+" auto:"+found.auto_advance);
// Also check if FAM questions exist at all
var fam=d.filter(function(x){return x.id.startsWith("FAM_");});
console.log("Total FAM questions: "+fam.length);
fam.forEach(function(q){console.log("  "+q.id+" type="+q.question_type+" num="+(q.question||"").substring(0,40));});