const fs = require('fs');

let f1 = 'lib/github.test.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/expect\(result\.calendar\.totalContributions\)/g, "expect(result.totalContributions)");
fs.writeFileSync(f1, c1);

let f2 = 'app/api/streak/route.test.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/vi\.mocked\(fetchGitHubContributions\)\.mockResolvedValue\(mockCalendar\);/g, "vi.mocked(fetchGitHubContributions).mockResolvedValue({ calendar: mockCalendar, repoContributions: [] } as any);");
c2 = c2.replace(/vi\.mocked\(fetchGitHubContributions\)\.mockResolvedValue\(emptyCalendar\);/g, "vi.mocked(fetchGitHubContributions).mockResolvedValue({ calendar: emptyCalendar, repoContributions: [] } as any);");
c2 = c2.replace(/vi\.mocked\(fetchGitHubContributions\)\.mockResolvedValue\(sparseCalendar\);/g, "vi.mocked(fetchGitHubContributions).mockResolvedValue({ calendar: sparseCalendar, repoContributions: [] } as any);");
c2 = c2.replace(/vi\.mocked\(fetchGitHubContributions\)\.mockResolvedValue\(intensityCalendar\);/g, "vi.mocked(fetchGitHubContributions).mockResolvedValue({ calendar: intensityCalendar, repoContributions: [] } as any);");
fs.writeFileSync(f2, c2);
