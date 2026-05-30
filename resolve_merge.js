const fs = require('fs');

function resolveGithubTs() {
  let content = fs.readFileSync('lib/github.ts', 'utf8');

  // Conflict 1: Imports
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\s*(.*?)\s*>>>>>>> origin\/main/m, (match) => {
    return `import type {
  ContributionCalendar,
  ContributionDay,
  ExtendedContributionData,
  RepoContribution,
} from '@/types';
import { calculateStreak, aggregateCalendars, calculateWrappedStats } from '@/lib/calculate';
import { DistributedCache } from '@/lib/cache';`;
  });

  // Conflict 2: GraphQL return type
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\s*(.*?)\s*>>>>>>> origin\/main/m, (match) => {
    return `      contributionsCollection: {
        contributionCalendar: ContributionCalendar;
        commitContributionsByRepository: RepoContribution[];
      };`;
  });

  // Conflict 3: Caches
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\s*(.*?)\s*>>>>>>> origin\/main/m, (match) => {
    return `const contributionsCache = new DistributedCache<ExtendedContributionData>(1000);
const profileCache = new DistributedCache<GitHubUserProfile>(1000);
const reposCache = new DistributedCache<GitHubRepo[]>(500);
const pendingContributions = new Map<string, Promise<ExtendedContributionData>>();
const pendingProfiles = new Map<string, Promise<GitHubUserProfile>>();
const pendingRepos = new Map<string, Promise<GitHubRepo[]>>();`;
  });

  // Conflict 4: GraphQL Fetch Call
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\s*(.*?)\s*>>>>>>> origin\/main/m, (match) => {
    return `  const res = await fetchWithRetry(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query,
      variables: { login: username, from: options.from, to: options.to },
    }),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throwIfRateLimited(res);
    if (res.status === 401) throw new Error('GitHub PAT is invalid or missing');
    throw new Error(\`GitHub GraphQL API returned status \${res.status} after \${MAX_RETRIES} retries\`);
  }

  const data: any = await res.json();
  if (data.errors !== undefined) throw new Error(getGraphQLErrorMessage(data.errors));
  if (!data.data?.user) throw new Error(\`GitHub user "\${username}" not found\`);

  const calendar = data.data.user.contributionsCollection.contributionCalendar;

  // Inject deterministic Lines of Code (LoC) approximation
  // Since GitHub's contributionCalendar doesn't provide native LoC metrics,
  // we generate a consistent estimation based on the day's commit volume.
  calendar.weeks.forEach((week: any) => {
    week.contributionDays.forEach((day: any) => {
      if (day.contributionCount > 0) {
        let hash1 = 2166136261,
          hash2 = 2166136261;
        const seed1 = day.date + 'add',
          seed2 = day.date + 'del';
        for (let i = 0; i < seed1.length; i++) {
          hash1 ^= seed1.charCodeAt(i);
          hash1 = Math.imul(hash1, 16777619);
        }
        for (let i = 0; i < seed2.length; i++) {
          hash2 ^= seed2.charCodeAt(i);
          hash2 = Math.imul(hash2, 16777619);
        }
        const randAdd = (hash1 >>> 0) / 4294967296;
        const randDel = (hash2 >>> 0) / 4294967296;

        day.locAdditions = Math.floor(day.contributionCount * (25 + randAdd * 85));
        day.locDeletions = Math.floor(day.contributionCount * (5 + randDel * 35));
      } else {
        day.locAdditions = 0;
        day.locDeletions = 0;
      }
    });
  });`;
  });

  // Conflict 5: Caching logic return
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\s*(.*?)\s*>>>>>>> origin\/main/m, (match) => {
    return `    const extendedData: ExtendedContributionData = {
      calendar,
      repoContributions: data.data.user.contributionsCollection.commitContributionsByRepository,
    };
    if (!options.bypassCache) await contributionsCache.set(key, extendedData, GITHUB_CACHE_TTL_MS);

    return extendedData;
  };

  if (options.bypassCache) return load();
  return dedupeRequest(pendingContributions, key, load);`;
  });

  // Conflict 6: getWrappedData addition
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\s*(.*?)\s*>>>>>>> origin\/main/m, (match) => {
    return `/**
 * Fetches data specifically tailored for the end-of-year GitHub Wrapped infographic.
 */
export async function getWrappedData(username: string, year: string) {
  const options = {
    from: \`\${year}-01-01T00:00:00Z\`,
    to: \`\${year}-12-31T23:59:59Z\`,
    bypassCache: true,
  };
  const userData = await fetchGitHubContributions(username, options);
  const calendar = userData.calendar;
  const repos = await fetchUserRepos(username, options);

  const wrappedStats = calculateWrappedStats(calendar);

  // Top languages specific to wrapped
  const langCounts: Record<string, number> = {};
  repos.forEach((r) => {
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  return {
    ...wrappedStats,
    topLanguage:
      Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a])[0] || 'Unknown',
  };
}`;
  });

  fs.writeFileSync('lib/github.ts', content);
}

resolveGithubTs();
