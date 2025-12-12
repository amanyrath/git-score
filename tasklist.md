# GitScore Task List

## Project Status: Not Started
The project currently has no implementation. All checkpoints need to be completed.

---

## Checkpoint 1: GitHub API Integration & Data Fetching

### 1.1 Repository Input & Validation
- [ ] Create URL input field accepting GitHub repository URLs
- [ ] Parse URL to extract `owner` and `repo` (support formats: `https://github.com/owner/repo`, `github.com/owner/repo`, `owner/repo`)
- [ ] Implement client-side validation with error messages
- [ ] Handle edge cases (`.git` suffix, trailing slashes, empty input)

### 1.2 GitHub API Client Setup
- [ ] Initialize Octokit client with proper configuration
- [ ] Support optional Personal Access Token (PAT)
- [ ] Implement rate limit detection and error handling
- [ ] Create TypeScript types for all API responses
- [ ] Create methods to fetch repository metadata and commits

### 1.3 Data Extraction
- [ ] Fetch repository metadata (name, description, default branch, star count, language, dates)
- [ ] Fetch commits (limit 100) with SHA, message, timestamp, author, stats, parent SHAs
- [ ] Create TypeScript interfaces (Repository, Commit, Author, Stats)

### 1.4 Contributor Grouping
- [ ] Group commits by author email
- [ ] Calculate per-contributor statistics (total commits, lines added/deleted, average commit size, first/last commit dates)
- [ ] Create Contributor interface

### 1.5 Error Handling
- [ ] Handle 404 (repository not found)
- [ ] Handle 403 (private repositories)
- [ ] Handle API rate limit exceeded
- [ ] Handle network errors
- [ ] Handle invalid authentication token
- [ ] Display user-friendly error messages

### 1.6 Basic UI
- [ ] Create simple UI showing repository name and metadata
- [ ] Display list of contributors with commit counts
- [ ] Show total commits analyzed

---

## Checkpoint 2: Heuristic-Based Commit Analysis

### 2.1 Commit Message Quality Analysis
- [ ] Implement Conventional Commits format detection (40 points)
- [ ] Implement message length scoring (30 points)
- [ ] Implement imperative mood detection (30 points)
- [ ] Create MessageQualityScore interface

### 2.2 Commit Size Analysis
- [ ] Implement lines changed scoring (50 points)
- [ ] Implement files changed scoring (50 points)
- [ ] Create CommitSizeScore interface

### 2.3 Overall Commit Score
- [ ] Calculate weighted overall score (60% message quality, 40% size)
- [ ] Store score with each commit

### 2.4 Contributor Scoring
- [ ] Calculate average commit score per contributor
- [ ] Calculate consistency score (standard deviation)
- [ ] Categorize contributors (Excellent/Good/Needs Improvement)
- [ ] Create ContributorScore interface

### 2.5 Repository Insights
- [ ] Detect giant commits (>1000 lines)
- [ ] Detect tiny commits (<5 lines with vague message)
- [ ] Detect merge commits
- [ ] Detect WIP commits
- [ ] Create RepositoryInsights interface

### 2.6 Updated UI for Checkpoint 2
- [ ] Display overall repository score
- [ ] Show per-contributor scores with categories
- [ ] List detected anti-patterns

---

## Checkpoint 3: AI-Powered Semantic Analysis

### 3.1 OpenAI Client Setup
- [ ] Create OpenAI API client with error handling
- [ ] Support GPT-4o-mini and GPT-4o models
- [ ] Implement retry logic (max 3 retries)
- [ ] Add token usage tracking

### 3.2 Semantic Commit Analysis
- [ ] Implement intent classification (feature, bugfix, refactor, docs, test, style, chore, performance, security)
- [ ] Implement clarity scoring (0-100)
- [ ] Implement completeness analysis
- [ ] Implement technical quality scoring
- [ ] Create SemanticAnalysis interface

### 3.3 Batch Processing
- [ ] Analyze up to 20 commit messages per API call
- [ ] Process commits in parallel batches (max 3 concurrent)
- [ ] Implement queue system for >60 commits
- [ ] Handle partial failures gracefully

### 3.4 Enhanced Scoring
- [ ] Update scoring with new weights (30% heuristic, 25% clarity, 20% completeness, 20% size, 5% technical)
- [ ] Create EnhancedCommitScore interface

### 3.5 Repository-Level Insights
- [ ] Generate 5-8 AI-powered insights
- [ ] Include title, description, impact, recommendation, severity for each insight
- [ ] Create Insight interface

### 3.6 Updated UI for Checkpoint 3
- [ ] Display enhanced scores for all commits
- [ ] Show AI-detected commit intents
- [ ] Display 5-8 generated insights with severity levels

---

## Checkpoint 4: Interactive Dashboard with Visualizations

### 4.1 Dashboard Layout
- [ ] Create header section with repository info and overall score
- [ ] Create score overview panel with color coding
- [ ] Create contributor grid with cards
- [ ] Create insights section with expandable cards
- [ ] Create anti-patterns section

### 4.2 Visualizations
- [ ] Create score distribution histogram
- [ ] Create commit timeline line chart
- [ ] Create contributor comparison bar chart
- [ ] Create category radar chart

### 4.3 Interactive Filters
- [ ] Create filter panel (date range, contributor, score range, commit type, anti-pattern toggles)
- [ ] Implement filter behavior (apply to all views, URL updates, reset button)
- [ ] Show filtered results count vs total

### 4.4 Detailed Views
- [ ] Create contributor detail modal/page
- [ ] Create commit detail modal with full analysis

### 4.5 Export and Sharing
- [ ] Export analysis as JSON
- [ ] Export contributor report as CSV
- [ ] Generate shareable links
- [ ] Store analysis in local database
- [ ] Create shared view route `/shared/[analysisId]`

---

## Checkpoint 5: Advanced Features and Polish

### 5.1 Temporal Pattern Analysis
- [ ] Analyze commit timing (hour, day of week, working hours ratio)
- [ ] Flag unusual patterns
- [ ] Calculate quality-time correlation
- [ ] Implement velocity tracking
- [ ] Create heatmap visualization

### 5.2 Code Collaboration Metrics
- [ ] Implement file ownership analysis
- [ ] Calculate bus factor
- [ ] Detect collaboration patterns
- [ ] Analyze review patterns from merge commits
- [ ] Generate knowledge silo insights

### 5.3 Comparative Analysis
- [ ] Implement historical comparison
- [ ] Support multi-repository comparison (2-3 repos)
- [ ] Add benchmark comparison against industry averages

### 5.4 Performance Optimization
- [ ] Implement caching layer (in-memory, LocalStorage, IndexedDB)
- [ ] Implement cache invalidation (24 hour TTL)
- [ ] Implement incremental analysis for returning users
- [ ] Implement lazy loading and pagination
- [ ] Meet performance targets (initial <30s, incremental <10s, dashboard <2s, filter <100ms)

### 5.5 Quality of Life Features
- [ ] Implement search functionality (message, author, file path, SHA)
- [ ] Add keyboard shortcuts (/, Esc, ?, arrow keys)
- [ ] Implement dark mode toggle
- [ ] Create loading states with progress indicators
- [ ] Implement error recovery and graceful degradation

---

## Final Polish

### Code Quality
- [ ] Enable TypeScript strict mode
- [ ] Remove all `any` types
- [ ] Add return type annotations to all functions
- [ ] Export all interfaces from types directory
- [ ] Ensure clear separation of concerns
- [ ] Apply DRY principle
- [ ] Add try-catch blocks around all async operations
- [ ] Implement proper error handling throughout

### Documentation
- [ ] Complete README.md with project description
- [ ] Document tech stack
- [ ] Add setup instructions
- [ ] Add example repository URLs for testing
- [ ] Document known limitations
- [ ] Create architecture overview
- [ ] Add code comments for complex algorithms

### Testing
- [ ] Test with small personal project (50 commits)
- [ ] Test with medium team project (200 commits)
- [ ] Test with large open source (500+ commits)
- [ ] Test with repository with poor practices
- [ ] Test with repository with excellent practices
- [ ] Handle edge cases (single contributor, no commits, merge commits only, long messages, non-English, special characters)

---

## Project Setup (Needs to be done first)
- [ ] Create package.json with dependencies
- [ ] Create tsconfig.json with strict mode
- [ ] Set up Next.js app structure
- [ ] Create `/lib` directory for GitHub client, analysis logic, AI integration
- [ ] Create `/components` directory for React components
- [ ] Create `/types` directory for TypeScript definitions
- [ ] Set up Tailwind CSS
- [ ] Create .env.local template for API keys
