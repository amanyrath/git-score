# GitScore: Git Practice Analyzer
## Technical Assignment - Building an AI-First Application

---

## Project Overview

Build a web application that analyzes GitHub repositories to evaluate Git commit practices. The application will fetch commit data via the GitHub API, analyze commit quality using both heuristics and AI, then present scores and recommendations through an interactive dashboard.

**Tech Stack Requirements:**
- TypeScript (strict mode)
- Next.js 14+ (App Router)
- GitHub REST API (via Octokit)
- OpenAI API (GPT-4o or GPT-4o-mini)
- Tailwind CSS for styling
- Deployment: Local only

**Recommended Project Structure:**
- `/app` - Next.js pages and API routes
- `/lib` - GitHub client, analysis logic, AI integration
- `/components` - React components for UI
- `/types` - TypeScript type definitions

---

## Checkpoint 1: GitHub API Integration & Data Fetching

### Objective
Establish connection to GitHub API, fetch repository data, and parse commit information.

### Requirements

#### 1.1 Repository Input & Validation
**Must implement:**
- URL input field accepting GitHub repository URLs
- Parse URL to extract `owner` and `repo` (support multiple formats):
  - `https://github.com/owner/repo`
  - `github.com/owner/repo`
  - `owner/repo`
- Client-side validation with error messages for invalid URLs
- Handle edge cases:
  - URLs with `.git` suffix
  - URLs with trailing slashes
  - Empty input

#### 1.2 GitHub API Client Setup
**Must implement:**
- Initialize Octokit client with proper configuration
- Support for optional Personal Access Token (PAT)
- Rate limit detection and error handling
- Proper TypeScript types for all API responses
- Methods to fetch repository metadata and commits

#### 1.3 Data Extraction
**Must fetch and parse:**
- Repository metadata:
  - Name, description, default branch
  - Star count, language
  - Created/updated dates
- Commits (limit to 100 for this checkpoint):
  - SHA, message, timestamp
  - Author name and email
  - Additions, deletions, files changed
  - Parent commit SHAs (to detect merges)

**Required data structure:**
All data must be properly typed with TypeScript interfaces including Repository, Commit, Author, and Stats types.

#### 1.4 Contributor Grouping
**Must implement:**
- Group commits by author email
- Calculate per-contributor statistics:
  - Total commits
  - Total lines added/deleted
  - Average commit size
  - First and last commit dates

**Required output:**
A Contributor interface that includes name, email, commits array, and calculated statistics.

#### 1.5 Error Handling
**Must handle:**
- Repository not found (404)
- Private repositories (403)
- API rate limit exceeded (403)
- Network errors
- Invalid authentication token

Each error must display a clear, user-friendly message.

### Deliverables
1. Working GitHub API client class
2. Repository data fetching and parsing
3. Contributor grouping logic
4. Comprehensive error handling
5. TypeScript types for all data structures
6. Simple UI showing:
   - Repository name and metadata
   - List of contributors with commit counts
   - Total commits analyzed

### Verification Points
- [ ] Can fetch data from any public GitHub repository
- [ ] Correctly parses commit information
- [ ] Groups commits by contributor accurately
- [ ] Displays appropriate error messages for invalid inputs
- [ ] All functions have proper TypeScript types
- [ ] Code handles rate limiting gracefully

---

## Checkpoint 2: Heuristic-Based Commit Analysis

### Objective
Implement algorithmic analysis of commit quality using pattern matching and statistical methods.

### Requirements

#### 2.1 Commit Message Quality Analysis
**Must analyze each commit for:**

**Conventional Commits Format (40 points possible):**
- Detect conventional commit prefixes:
  - `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Award 40 points if follows format, 0 if not
- Handle optional scope: `feat(auth):` should be recognized

**Message Length (30 points possible):**
- Award full points for messages 20-72 characters
- Partial points for 10-19 or 73-100 characters
- Zero points for <10 or >100 characters

**Imperative Mood (30 points possible):**
- Check if message starts with imperative verbs:
  - Add, Fix, Update, Remove, Create, Implement, etc.
- Award 30 points if detected, 0 if not
- Must be case-insensitive

**Required interface:**
Create a MessageQualityScore interface with total score (0-100) and breakdown showing convention score (0-40), length score (0-30), and imperative mood score (0-30).

#### 2.2 Commit Size Analysis
**Must analyze:**

**Lines Changed (50 points possible):**
- Optimal: 10-200 lines changed → 50 points
- Acceptable: 200-500 lines → 30 points
- Large: 500-1000 lines → 15 points
- Too large: >1000 lines → 0 points

**Files Changed (50 points possible):**
- Optimal: 1-5 files → 50 points
- Acceptable: 6-10 files → 30 points
- Many: 11-20 files → 15 points
- Too many: >20 files → 0 points

**Required interface:**
Create a CommitSizeScore interface with total score (0-100), breakdown of lines score and files score, and metrics showing actual lines and files changed.

#### 2.3 Overall Commit Score
**Must calculate:**
- Combine message quality (60% weight) and size (40% weight)
- Final score: 0-100 for each commit
- Store score with each commit

**Scoring formula:**
Overall = (Message Quality Score × 0.6) + (Size Score × 0.4)

#### 2.4 Contributor Scoring
**Must calculate per contributor:**
- Average commit score across all their commits
- Consistency score (standard deviation of commit scores)
- Categorize contributors:
  - Excellent: avg score ≥ 80
  - Good: avg score ≥ 60
  - Needs Improvement: avg score < 60

**Required interface:**
Create a ContributorScore interface including average score, consistency metric, category classification, and array of individual commit scores.

#### 2.5 Repository Insights
**Must detect patterns:**

**Anti-patterns to flag:**
1. **Giant commits**: >1000 lines changed
2. **Tiny commits**: <5 lines changed with vague message
3. **Merge commits**: Multiple parents (just detect, don't penalize)
4. **WIP commits**: Message contains "WIP", "wip", "work in progress"

**Required interface:**
Create a RepositoryInsights interface with total commits, average score, and anti-patterns object containing arrays for each anti-pattern type.

### Deliverables
1. Commit message quality analyzer
2. Commit size analyzer
3. Overall commit scoring function
4. Contributor scoring aggregation
5. Anti-pattern detection
6. Updated UI showing:
   - Overall repository score
   - Per-contributor scores with categories
   - List of detected anti-patterns

### Verification Points
- [ ] Correctly identifies conventional commit format
- [ ] Scores commit message length appropriately
- [ ] Detects imperative mood verbs
- [ ] Scores commit size based on lines and files changed
- [ ] Calculates weighted overall score correctly
- [ ] Aggregates contributor scores accurately
- [ ] Detects all specified anti-patterns
- [ ] Displays scores in UI with clear categories

---

## Checkpoint 3: AI-Powered Semantic Analysis

### Objective
Enhance analysis with OpenAI to understand commit intent, clarity, and generate insights.

### Requirements

#### 3.1 OpenAI Client Setup
**Must implement:**
- OpenAI API client with error handling
- Support for GPT-4o-mini (cost-effective) and GPT-4o (higher quality)
- Retry logic for failed requests (max 3 retries)
- Token usage tracking

Create a client class with methods to analyze commit messages in batches and generate repository-level insights.

#### 3.2 Semantic Commit Analysis
**Must analyze each commit message for:**

1. **Intent Classification:**
   - Categorize as: `feature`, `bugfix`, `refactor`, `docs`, `test`, `style`, `chore`, `performance`, `security`
   - Provide confidence score (0-100)

2. **Clarity Score (0-100):**
   - How clear is the commit message?
   - Is it specific about what changed?

3. **Completeness:**
   - Does the message explain WHY the change was made?
   - Does it provide sufficient context?

4. **Technical Quality:**
   - Is the message technically accurate?
   - Does it use proper terminology?

**Required prompt structure:**
Design a prompt that asks the AI to analyze commit messages and return structured JSON with intent, intentConfidence, clarity, completeness, technicalQuality, and reasoning fields for each message.

**Required interface:**
Create a SemanticAnalysis interface with all fields listed above properly typed (intent as union type, scores as numbers 0-100, reasoning as string).

#### 3.3 Batch Processing
**Must implement efficient batching:**
- Analyze up to 20 commit messages per API call
- Process commits in parallel batches (max 3 concurrent requests)
- Implement queue system if >60 commits
- Handle partial failures gracefully

Create a batching system that:
- Splits commits into groups of 20
- Processes 3 batches concurrently
- Returns a map of commit SHA to semantic analysis
- Continues processing even if individual batches fail

#### 3.4 Enhanced Scoring
**Must update scoring to include AI results:**

**New weighted score calculation:**
- Heuristic message quality: 30%
- AI clarity score: 25%
- AI completeness: 20%
- Commit size: 20%
- AI technical quality: 5%

**Scoring formula:**
Enhanced Score = (Heuristic × 0.30) + (Clarity × 0.25) + (Completeness × 0.20) + (Size × 0.20) + (Technical × 0.05)

Create an EnhancedCommitScore interface that includes overall score, separate heuristic and AI scores, and a detailed breakdown of all components.

#### 3.5 Repository-Level Insights
**Must generate 5-8 insights using AI:**

**Insight categories:**
1. Overall strengths (what the team does well)
2. Areas for improvement (specific weaknesses)
3. Patterns detected (temporal, contributor-specific)
4. Recommendations (actionable next steps)

**Required prompt:**
Design a prompt that provides the AI with repository statistics, average scores, detected anti-patterns, and contributor patterns, then asks it to generate 5-8 insights. Each insight must include:
- Title (concise)
- Description (2-3 sentences with specific data)
- Impact (why it matters)
- Recommendation (specific action to take)
- Severity: "high" | "medium" | "low"

Focus the prompt on requesting non-obvious patterns and actionable improvements.

**Required interface:**
Create an Insight interface with title, description, impact, recommendation, severity, and category fields.

### Deliverables
1. OpenAI client with batching support
2. Semantic analysis for commit messages
3. Enhanced scoring combining heuristics + AI
4. Repository-level insight generation
5. Updated UI showing:
   - Enhanced scores for all commits
   - AI-detected commit intents
   - 5-8 generated insights with severity levels

### Verification Points
- [ ] OpenAI client successfully calls API with proper error handling
- [ ] Batching processes 60+ commits efficiently (within 30 seconds)
- [ ] Semantic analysis returns valid structured data for all commits
- [ ] Enhanced scoring correctly weights all components
- [ ] Insight generation produces 5-8 relevant, specific insights
- [ ] UI displays AI analysis results clearly
- [ ] All AI responses are properly typed with TypeScript

---

## Checkpoint 4: Interactive Dashboard with Visualizations

### Objective
Create a polished, interactive dashboard that visualizes analysis results with charts, filters, and detailed drill-downs.

### Requirements

#### 4.1 Dashboard Layout
**Must implement:**

**Header Section:**
- Repository name, description, and metadata
- Overall repository score (large, prominent display)
- Total commits analyzed, date range
- Language and star count

**Score Overview Panel:**
- Overall score with color coding:
  - Green (80-100): Excellent
  - Blue (60-79): Good
  - Orange (40-59): Needs Work
  - Red (0-39): Poor
- Category breakdown showing:
  - Message Quality
  - Commit Size
  - AI Clarity
  - AI Completeness
  - AI Technical Quality

**Contributor Grid:**
- Cards for each contributor showing:
  - Name and avatar (from GitHub)
  - Total commits
  - Average score with color coding
  - Category badge (Excellent/Good/Needs Improvement)
  - Click to view details

**Insights Section:**
- List of AI-generated insights
- Color-coded by severity (high/medium/low)
- Expandable cards showing full description, impact, recommendations

**Anti-Patterns Section:**
- Count of each anti-pattern type
- List of commits for each pattern
- Click to view commit details

#### 4.2 Visualizations
**Must create:**

**Score Distribution Chart:**
- Histogram showing distribution of commit scores
- X-axis: Score ranges (0-20, 20-40, 40-60, 60-80, 80-100)
- Y-axis: Number of commits
- Color-coded bars

**Commit Timeline:**
- Line chart showing commits over time
- X-axis: Date
- Y-axis: Number of commits per day
- Optional: Overlay average score trend

**Contributor Comparison:**
- Horizontal bar chart comparing contributors
- Bars showing average score for each contributor
- Sorted by score (highest to lowest)
- Color-coded by category

**Category Radar Chart:**
- Radar/spider chart showing repository performance across categories
- 5 axes: Message Quality, Size, Clarity, Completeness, Technical Quality
- Scale: 0-100 on each axis

#### 4.3 Interactive Filters
**Must implement:**

**Filter Panel:**
- Date range selector (start date, end date)
- Contributor multi-select dropdown
- Score range slider (min-max)
- Commit type filter (based on AI intent detection)
- Anti-pattern toggles

**Filter Behavior:**
- Filters apply to all visualizations and lists
- URL updates with filter state (shareable filtered views)
- "Reset Filters" button
- Show count of filtered results vs total

#### 4.4 Detailed Views
**Must implement:**

**Contributor Detail Modal/Page:**
When clicking a contributor card, show:
- Full statistics
- List of all their commits with scores
- Personal score trends over time
- Top 3 best commits (with messages)
- Top 3 commits needing improvement
- Personalized recommendations

**Commit Detail Modal:**
When clicking a commit, show:
- Full commit message and body
- All scores (heuristic + AI) with breakdowns
- Files changed with diff stats
- AI analysis explanation
- Timestamp and author
- Link to view on GitHub

#### 4.5 Export and Sharing
**Must implement:**

**Export Options:**
- Export analysis as JSON
- Export contributor report as CSV
- Generate shareable link (stores analysis data)

**Sharing:**
- Copy link button (generates unique ID)
- Store analysis results in local database
- Create shareable URL: `/shared/[analysisId]`
- Shared view is read-only but fully interactive

### Deliverables
1. Complete dashboard UI with all sections
2. Four visualization types (histogram, line chart, bar chart, radar)
3. Working filter system affecting all views
4. Contributor detail view
5. Commit detail modal
6. Export functionality (JSON, CSV)
7. Shareable links with persistent storage

### Verification Points
- [ ] Dashboard displays all required sections
- [ ] All four chart types render correctly with data
- [ ] Filters update all visualizations in real-time
- [ ] Contributor details show complete information
- [ ] Commit modal displays full analysis breakdown
- [ ] Export functions download correct data
- [ ] Shareable links persist and load correctly
- [ ] UI is responsive on mobile and desktop
- [ ] Color coding is consistent and meaningful
- [ ] Loading states display during analysis

---

## Checkpoint 5: Advanced Features and Polish

### Objective
Add sophisticated analysis features, optimize performance, and polish the user experience.

### Requirements

#### 5.1 Temporal Pattern Analysis
**Must implement:**

**Commit Timing Analysis:**
- Analyze commit times to detect patterns:
  - Hour of day distribution (0-23)
  - Day of week distribution (Mon-Sun)
  - Working hours vs. off-hours ratio
- Flag unusual patterns:
  - >30% commits after 10pm
  - >50% commits on weekends
  - All commits within same 2-hour window

**Quality-Time Correlation:**
- Calculate if commit quality varies by:
  - Time of day
  - Day of week
  - Sprint position (if detectable)
- Generate insight if correlation found:
  - "Commit quality drops 25% on Fridays"
  - "Evening commits average 15 points lower"

**Velocity Tracking:**
- Calculate commits per day/week
- Identify sprint patterns (bursts of activity)
- Detect "commit drought" periods (>5 days no commits)

**Required visualization:**
Heatmap showing commits by hour and day of week (similar to GitHub contribution graph).

#### 5.2 Code Collaboration Metrics
**Must implement:**

**File Ownership Analysis:**
- Identify files touched by only one contributor (knowledge silos)
- Calculate "bus factor": files that only 1-2 people understand
- Flag high-risk files:
  - Critical files (package.json, config) with single owner
  - >500 lines changed by only one person

**Collaboration Patterns:**
- Detect common co-authors on commits
- Identify files frequently changed together
- Calculate collaboration score per contributor:
  - How often do they work on same files as others?
  - Do they have isolated areas of code?

**Review Patterns (if detectable from merge commits):**
- Identify merge commits
- Calculate merge frequency per contributor
- Detect potential bottlenecks (one person merges everything)

**Required output:**
Generate insights highlighting knowledge silos and collaboration opportunities with specific file and contributor names.

#### 5.3 Comparative Analysis
**Must implement:**

**Historical Comparison:**
- Allow user to analyze same repo twice
- Compare scores between analyses:
  - Overall score change
  - Per-category changes
  - Contributor improvements/regressions
- Show trend indicators (↑ improved, ↓ declined, → stable)

**Multi-Repository Comparison:**
- Support analyzing 2-3 repositories
- Display side-by-side comparison:
  - Overall scores
  - Category scores
  - Top insights
  - Anti-pattern frequencies
- Calculate percentile rankings across analyzed repos

**Benchmark Comparison:**
- Include hardcoded industry benchmarks:
  - Open source average: 65-70
  - Enterprise average: 70-75
  - Top tier: 80+
- Show where repository ranks
- Display gap to next tier

#### 5.4 Performance Optimization
**Must implement:**

**Caching Layer:**
- Cache GitHub API responses (repository and commit data)
- Cache AI analysis results (commits don't change)
- Storage options:
  - In-memory cache for session
  - LocalStorage for persistence
  - IndexedDB for larger datasets
- Implement cache invalidation (24 hour TTL)

**Incremental Analysis:**
- Detect if repository was analyzed before
- Only fetch new commits since last analysis
- Merge new results with cached results
- Show "X new commits analyzed" message

**Lazy Loading:**
- Paginate commit list (50 at a time)
- Lazy load visualizations (only render when visible)
- Virtualize large contributor lists
- Progressive enhancement for large repos

**Performance Targets:**
- Initial analysis <30 seconds for 100 commits
- Incremental analysis <10 seconds for 20 new commits
- Dashboard renders in <2 seconds
- Filter application <100ms

#### 5.5 Quality of Life Features
**Must implement:**

**Search Functionality:**
- Search commits by:
  - Message text
  - Author name
  - File path
  - SHA
- Real-time search results (debounced)
- Highlight matching commits in results

**Keyboard Shortcuts:**
- `/` - Focus search
- `Esc` - Close modals
- `?` - Show keyboard shortcuts help
- Arrow keys - Navigate commit list

**Dark Mode:**
- Toggle between light and dark themes
- Persist preference in localStorage
- Adjust all visualizations for theme
- Use appropriate color palettes

**Loading States and Progress:**
- Show progress during analysis:
  - Fetching commits: X/Y
  - Analyzing with heuristics: X/Y
  - AI analysis: X/Y batches
  - Generating insights...
- Estimated time remaining
- Cancel button to abort analysis

**Error Recovery:**
- Graceful degradation if AI API fails:
  - Show heuristic scores only
  - Display warning about missing AI analysis
  - Allow retry of AI analysis
- Partial results if GitHub rate limit hit:
  - Show what was analyzed
  - Explain limitation
  - Suggest using PAT

### Deliverables
1. Temporal pattern analysis with heatmap visualization
2. Code collaboration metrics with knowledge silo detection
3. Comparative analysis (historical and multi-repo)
4. Complete caching system with incremental updates
5. Search functionality with real-time results
6. Keyboard shortcuts implementation
7. Dark mode toggle
8. Comprehensive loading states
9. Error recovery and graceful degradation

### Verification Points
- [ ] Temporal patterns correctly identify unusual commit timing
- [ ] Knowledge silos are accurately detected with specific files
- [ ] Comparative analysis shows meaningful differences
- [ ] Caching reduces repeat analysis time by 80%+
- [ ] Incremental analysis only processes new commits
- [ ] Search returns results in <100ms
- [ ] All keyboard shortcuts work correctly
- [ ] Dark mode applies to all components and charts
- [ ] Progress indicators accurately reflect analysis stage
- [ ] Application handles API failures gracefully
- [ ] Performance targets are met for 100+ commit repos

---

## Final Submission Requirements

### Code Quality Standards

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` when truly needed)
- All functions have return type annotations
- All interfaces exported from types directory
- Proper use of generics where applicable

**Code Organization:**
- Clear separation of concerns (data, logic, presentation)
- Reusable utility functions
- DRY principle applied
- Meaningful variable and function names
- Consistent file naming convention

**Error Handling:**
- Try-catch blocks around all async operations
- Specific error types for different failures
- User-friendly error messages
- Errors logged to console with context
- No silent failures

**Performance:**
- No unnecessary re-renders
- Memoization where appropriate
- Debouncing for search and filters
- Lazy loading for heavy components
- Efficient algorithms (avoid O(n²) where possible)

### Documentation Requirements

**README.md must include:**
1. Project description
2. Tech stack used
3. Setup instructions (npm install, env variables)
4. How to run locally
5. Example repository URLs to test with
6. Known limitations
7. Architecture overview

**Code Comments:**
- Complex algorithms explained
- Non-obvious business logic documented
- API integration patterns noted
- Type definitions documented where not self-evident

### Testing Recommendations

**Test with diverse repositories:**
- Small personal project (50 commits)
- Medium team project (200 commits)
- Large open source (500+ commits)
- Repository with poor practices
- Repository with excellent practices

**Edge cases to handle:**
- Single contributor repos
- Repos with no commits
- Repos with merge commits only
- Repos with very long commit messages
- Repos with non-English commit messages
- Repos with special characters in names

### Submission Checklist

**Checkpoint 1:**
- [ ] GitHub API client working
- [ ] Repository data fetching successful
- [ ] Contributor grouping accurate
- [ ] Error handling comprehensive
- [ ] Basic UI showing repository info

**Checkpoint 2:**
- [ ] Heuristic analysis calculates scores correctly
- [ ] All scoring algorithms implemented
- [ ] Anti-pattern detection working
- [ ] Repository insights generated
- [ ] UI shows scores and patterns

**Checkpoint 3:**
- [ ] OpenAI integration functional
- [ ] Semantic analysis returns valid data
- [ ] Batch processing efficient
- [ ] Enhanced scoring combines heuristic + AI
- [ ] Repository insights AI-generated

**Checkpoint 4:**
- [ ] Complete dashboard with all sections
- [ ] Four visualization types working
- [ ] Interactive filters functional
- [ ] Detail views implemented
- [ ] Export and sharing features work

**Checkpoint 5:**
- [ ] Temporal analysis complete
- [ ] Collaboration metrics implemented
- [ ] Comparative analysis working
- [ ] Caching and performance optimized
- [ ] Quality of life features added

**Final Polish:**
- [ ] README.md complete
- [ ] All TypeScript errors resolved
- [ ] Console has no errors/warnings
- [ ] Responsive design verified
- [ ] Tested with 3+ repositories
- [ ] Code follows standards
- [ ] Comments added where needed

---

## Grading Considerations

Each checkpoint builds on the previous one and represents approximately 20% of the final assessment. The evaluation will consider:

**Technical Implementation (40%):**
- Correctness of algorithms and analysis
- Proper use of TypeScript and type safety
- GitHub API integration quality
- OpenAI API integration and prompt engineering
- Performance and optimization

**Code Quality (20%):**
- Organization and architecture
- Readability and maintainability
- Error handling robustness
- Documentation and comments
- Following best practices

**User Experience (20%):**
- Dashboard usability and design
- Visualization clarity and interactivity
- Error messages and loading states
- Responsive design
- Overall polish

**Feature Completeness (20%):**
- All required features implemented
- Requirements met for each checkpoint
- Advanced features working correctly
- Edge cases handled
- Testing thoroughness

---

## Resources and References

**GitHub API Documentation:**
- REST API: https://docs.github.com/en/rest
- Octokit.js: https://github.com/octokit/octokit.js

**OpenAI API:**
- Documentation: https://platform.openai.com/docs
- Best practices: https://platform.openai.com/docs/guides/prompt-engineering

**Conventional Commits:**
- Specification: https://www.conventionalcommits.org/

**TypeScript:**
- Handbook: https://www.typescriptlang.org/docs/handbook/

**Next.js:**
- App Router: https://nextjs.org/docs/app
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**Visualization Libraries:**
- Recharts: https://recharts.org/
- D3.js: https://d3js.org/

---

**Assignment Version:** 1.0  
**Last Updated:** December 2025