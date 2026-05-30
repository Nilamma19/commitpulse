const fs = require('fs');

function fixGithubTest(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace fetch result accesses
  content = content.replace(/result\.totalContributions/g, "result.calendar.totalContributions");
  content = content.replace(/result\.weeks/g, "result.calendar.weeks");
  content = content.replace(/r1\.totalContributions/g, "r1.calendar.totalContributions");
  content = content.replace(/r1\.weeks/g, "r1.calendar.weeks");
  content = content.replace(/r2\.totalContributions/g, "r2.calendar.totalContributions");
  content = content.replace(/r2\.weeks/g, "r2.calendar.weeks");
  
  // mockResponses
  content = content.replace(/user:\s*\{\s*contributionsCollection:\s*\{\s*contributionCalendar:\s*([a-zA-Z0-9_]+)\s*\}\s*,\?\s*\}/g, "user: { contributionsCollection: { contributionCalendar: $1, commitContributionsByRepository: [] } }");
  // Also check if they lack the outer user object (for some specific mocks)
  
  fs.writeFileSync(filePath, content);
}

function fixRouteTest(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/mockResolvedValueOnce\(sparseCalendar\)/g, "mockResolvedValueOnce({ calendar: sparseCalendar, repoContributions: [] } as any)");
  content = content.replace(/mockResolvedValueOnce\(intensityCalendar\)/g, "mockResolvedValueOnce({ calendar: intensityCalendar, repoContributions: [] } as any)");
  content = content.replace(/mockResolvedValueOnce\(mockCalendar\)/g, "mockResolvedValueOnce({ calendar: mockCalendar, repoContributions: [] } as any)");
  content = content.replace(/mockResolvedValueOnce\(emptyCalendar\)/g, "mockResolvedValueOnce({ calendar: emptyCalendar, repoContributions: [] } as any)");
  fs.writeFileSync(filePath, content);
}

fixGithubTest('lib/github.test.ts');
fixRouteTest('app/api/streak/route.test.ts');
console.log('Fixed test files correctly');
