const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix github.test.ts lines where result was still an ExtendedContributionData but we meant to check calendar properties
  content = content.replace(/result\.totalContributions/g, "result.calendar?.totalContributions ?? result.totalContributions");
  content = content.replace(/result\.weeks/g, "result.calendar?.weeks ?? result.weeks");
  
  content = content.replace(/r1\.totalContributions/g, "r1.calendar?.totalContributions ?? r1.totalContributions");
  content = content.replace(/r1\.weeks/g, "r1.calendar?.weeks ?? r1.weeks");

  content = content.replace(/r2\.totalContributions/g, "r2.calendar?.totalContributions ?? r2.totalContributions");
  content = content.replace(/r2\.weeks/g, "r2.calendar?.weeks ?? r2.weeks");
  
  content = content.replace(/cached\.totalContributions/g, "cached.calendar?.totalContributions ?? cached.totalContributions");

  // Fix app/api/streak/route.test.ts mockResolvedValueOnce
  content = content.replace(/mockResolvedValueOnce\(sparseCalendar\)/g, "mockResolvedValueOnce({ calendar: sparseCalendar, repoContributions: [] } as any)");
  content = content.replace(/mockResolvedValueOnce\(intensityCalendar\)/g, "mockResolvedValueOnce({ calendar: intensityCalendar, repoContributions: [] } as any)");

  fs.writeFileSync(filePath, content);
}

fixFile('lib/github.test.ts');
fixFile('app/api/streak/route.test.ts');
console.log('Fixed remaining test files');
