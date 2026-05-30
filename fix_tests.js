const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace fetchGitHubContributions returns from `result` to `{ calendar: result }`
  content = content.replace(/const result = await fetchGitHubContributions\('new-user'\);/g, "const { calendar: result } = await fetchGitHubContributions('new-user');");
  content = content.replace(/const result = await fetchGitHubContributions\('sparse-user'\);/g, "const { calendar: result } = await fetchGitHubContributions('sparse-user');");
  content = content.replace(/const r1 = await fetchGitHubContributions\('empty-user', { bypassCache: true }\);/g, "const { calendar: r1 } = await fetchGitHubContributions('empty-user', { bypassCache: true });");
  content = content.replace(/const r2 = await fetchGitHubContributions\('empty-user', { bypassCache: true }\);/g, "const { calendar: r2 } = await fetchGitHubContributions('empty-user', { bypassCache: true });");
  
  // Also fix in route.test.ts which checks totalContributions
  // Wait, I can just replace `user: { contributionsCollection: { contributionCalendar: (.*?) } }`
  content = content.replace(/user: {\s*contributionsCollection: {\s*contributionCalendar: ([a-zA-Z0-9_]+)\s*}\s*}/g, (match, p1) => {
    return `user: { contributionsCollection: { contributionCalendar: ${p1}, commitContributionsByRepository: [] } }`;
  });

  // For route.test.ts, vi.mocked(fetchGitHubContributions).mockResolvedValue(mockCalendar);
  content = content.replace(/vi\.mocked\(fetchGitHubContributions\)\.mockResolvedValue\((.*?)\);/g, (match, p1) => {
    // If it's returning a calendar object or null
    if (p1 === 'mockCalendar' || p1 === 'emptyCalendar' || p1.includes('totalContributions')) {
      return `vi.mocked(fetchGitHubContributions).mockResolvedValue({ calendar: ${p1}, repoContributions: [] } as any);`;
    }
    return match;
  });
  
  // Specific fix for route.test.ts lines 62, 813, 919, 951, 997
  // They use `mockResolvedValueOnce(mockCalendar)`
  content = content.replace(/mockResolvedValueOnce\((.*?)\)/g, (match, p1) => {
    if (p1 === 'mockCalendar' || p1 === 'emptyCalendar') {
      return `mockResolvedValueOnce({ calendar: ${p1}, repoContributions: [] } as any)`;
    }
    return match;
  });

  fs.writeFileSync(filePath, content);
}

fixFile('lib/github.test.ts');
fixFile('app/api/streak/route.test.ts');
console.log('Fixed test files');
