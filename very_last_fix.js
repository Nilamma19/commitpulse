const fs = require('fs');

let f1 = 'lib/github.test.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/result\.calendar\.weeks/g, "result.weeks");
c1 = c1.replace(/r1\.calendar\.weeks/g, "r1.weeks");
c1 = c1.replace(/r2\.calendar\.weeks/g, "r2.weeks");
fs.writeFileSync(f1, c1);

let f2 = 'app/api/streak/route.test.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/\.mockResolvedValueOnce\(\{\n\s*totalContributions: (\d+),\n\s*weeks/g, ".mockResolvedValueOnce({ calendar: {\n        totalContributions: $1,\n        weeks");
c2 = c2.replace(/\n\s*\} as unknown as ContributionCalendar\);/g, "\n      } as ContributionCalendar, repoContributions: [] } as any);");
fs.writeFileSync(f2, c2);
