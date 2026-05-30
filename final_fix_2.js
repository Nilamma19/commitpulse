const fs = require('fs');

let f1 = 'lib/github.test.ts';
let c1 = fs.readFileSync(f1, 'utf8');

// Undo the bad regexes
c1 = c1.replace(/result\.calendar\?\.totalContributions \?\? result\.totalContributions/g, "result.totalContributions");
c1 = c1.replace(/result\.calendar\?\.weeks \?\? result\.weeks/g, "result.weeks");

// Now do the correct fix: destructure `calendar` into `result`
c1 = c1.replace(/const result = await fetchGitHubContributions/g, "const { calendar: result } = await fetchGitHubContributions");

fs.writeFileSync(f1, c1);

let f2 = 'app/api/streak/route.test.ts';
let c2 = fs.readFileSync(f2, 'utf8');

// Fix the inline object mocks
c2 = c2.replace(/\.mockResolvedValueOnce\(\{\n\s*totalContributions: 25,\n\s*weeks/g, ".mockResolvedValueOnce({ calendar: {\n        totalContributions: 25,\n        weeks");
c2 = c2.replace(/\n\s*\} as ContributionCalendar\);/g, "\n      } as ContributionCalendar, repoContributions: [] } as any);");

fs.writeFileSync(f2, c2);
console.log('Fixed final TS errors');
