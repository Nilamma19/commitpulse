const fs = require('fs');

let f1 = 'lib/github.test.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/expect\(result\.totalContributions\)/g, "expect(result.calendar?.totalContributions ?? result.totalContributions)");
c1 = c1.replace(/expect\(result\.weeks\)/g, "expect(result.calendar?.weeks ?? result.weeks)");
fs.writeFileSync(f1, c1);

let f2 = 'app/api/streak/route.test.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/\.mockResolvedValueOnce\(\s*mockCalendar\s*\)/g, ".mockResolvedValueOnce({ calendar: mockCalendar, repoContributions: [] } as any)");
c2 = c2.replace(/\.mockResolvedValueOnce\(\s*emptyCalendar\s*\)/g, ".mockResolvedValueOnce({ calendar: emptyCalendar, repoContributions: [] } as any)");
c2 = c2.replace(/\.mockResolvedValueOnce\(\s*sparseCalendar\s*\)/g, ".mockResolvedValueOnce({ calendar: sparseCalendar, repoContributions: [] } as any)");
c2 = c2.replace(/\.mockResolvedValueOnce\(\s*intensityCalendar\s*\)/g, ".mockResolvedValueOnce({ calendar: intensityCalendar, repoContributions: [] } as any)");
fs.writeFileSync(f2, c2);
console.log('Fixed last remaining mocks');
