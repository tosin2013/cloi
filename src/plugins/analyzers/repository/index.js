import { BaseAnalyzer } from '../../../core/plugin-manager/interfaces.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Dynamic imports for optional dependencies
let simpleGit = null;
let ignore = null;
let semver = null;
let yaml = null;

try {
  const git = await import('simple-git');
  simpleGit = git.simpleGit;
  
  const ignoreModule = await import('ignore');
  ignore = ignoreModule.default;
  
  const semverModule = await import('semver');
  semver = semverModule.default;
  
  const yamlModule = await import('yaml');
  yaml = yamlModule.default;
} catch (error) {
  console.warn('⚠️ Some repository analysis dependencies not installed. Features may be limited.');
}

const execAsync = promisify(exec);

/**
 * RepositoryAnalyzer - Advanced repository analysis and expertise tracking
 * 
 * Capabilities:
 * - Multi-language codebase analysis (JavaScript, Python, Java, C#, Go, Rust, etc.)
 * - Infrastructure as Code analysis (Ansible, Terraform, Kubernetes, Docker)
 * - Git history and contributor expertise tracking
 * - Dependency and architecture mapping
 * - Framework and pattern detection
 * - Knowledge extraction and reporting
 */
export default class RepositoryAnalyzer extends BaseAnalyzer {
  constructor(manifest, config) {
    super(manifest, config);
    
    this.repositoryPath = process.cwd();
    this.git = simpleGit ? simpleGit(this.repositoryPath) : null;
    this.cache = new Map();
    this.analysisResults = null;
    
    // Language detection patterns
    this.languagePatterns = this.initializeLanguagePatterns();
    
    // Infrastructure patterns
    this.infrastructurePatterns = this.initializeInfrastructurePatterns();
    
    // Framework patterns
    this.frameworkPatterns = this.initializeFrameworkPatterns();
    
    // Initialize ignore patterns
    this.ignoreFilter = this.initializeIgnoreFilter();
  }

  /**
   * Check if this analyzer supports the given context
   */
  supports(context) {
    // Repository analyzer supports any context in a Git repository
    return this.isGitRepository();
  }

  /**
   * Analyze the repository for languages, expertise, and intelligence
   */
  async analyze(errorOutput, context = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting comprehensive repository analysis...');
      
      // Check cache first
      const cacheKey = await this.generateCacheKey();
      if (this.cache.has(cacheKey) && this.getConfig('caching.enabled', true)) {
        console.log('📋 Using cached analysis results');
        return this.cache.get(cacheKey);
      }

      const analysis = {
        timestamp: new Date().toISOString(),
        repository: {
          path: this.repositoryPath,
          name: path.basename(this.repositoryPath)
        },
        languages: {},
        infrastructure: {},
        frameworks: [],
        expertise: {},
        intelligence: {},
        metrics: {},
        duration: 0
      };

      // Parallel analysis execution
      const tasks = [];
      
      if (this.getConfig('languages.detectAll', true)) {
        tasks.push(this.analyzeLanguages());
      }
      
      if (this.getConfig('infrastructure.analyzeAnsible', true)) {
        tasks.push(this.analyzeInfrastructure());
      }
      
      if (this.getConfig('expertise.enabled', true)) {
        tasks.push(this.analyzeExpertise());
      }
      
      if (this.getConfig('intelligence.enabled', true)) {
        tasks.push(this.analyzeIntelligence());
      }

      console.log(`🚀 Running ${tasks.length} analysis tasks in parallel...`);
      const results = await Promise.allSettled(tasks);

      // Merge results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          Object.assign(analysis, result.value);
        } else {
          console.warn(`⚠️ Analysis task ${i} failed:`, result.reason);
        }
      }

      // Generate metrics
      analysis.metrics = this.generateMetrics(analysis);
      analysis.duration = Date.now() - startTime;

      // Cache results
      if (this.getConfig('caching.enabled', true)) {
        this.cache.set(cacheKey, analysis);
      }

      this.analysisResults = analysis;
      console.log(`✅ Repository analysis completed in ${analysis.duration}ms`);
      
      return analysis;
    } catch (error) {
      console.error('❌ Repository analysis failed:', error);
      throw new Error(`Repository analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze programming languages in the repository
   */
  async analyzeLanguages() {
    console.log('🔤 Analyzing programming languages...');
    
    const languages = {};
    const files = await this.getRepositoryFiles();
    
    for (const file of files) {
      if (this.shouldSkipFile(file)) continue;
      
      try {
        const language = this.detectLanguage(file);
        if (language) {
          if (!languages[language]) {
            languages[language] = {
              files: [],
              totalLines: 0,
              totalBytes: 0,
              extensions: new Set(),
              frameworks: new Set(),
              dependencies: new Set()
            };
          }
          
          const stats = await this.analyzeFile(file);
          languages[language].files.push(file);
          languages[language].totalLines += stats.lines;
          languages[language].totalBytes += stats.bytes;
          languages[language].extensions.add(path.extname(file));
          
          // Detect frameworks and dependencies
          const frameworks = await this.detectFrameworksInFile(file, language);
          frameworks.forEach(fw => languages[language].frameworks.add(fw));
          
          const dependencies = await this.detectDependenciesInFile(file, language);
          dependencies.forEach(dep => languages[language].dependencies.add(dep));
        }
      } catch (error) {
        console.warn(`⚠️ Failed to analyze file ${file}:`, error.message);
      }
    }

    // Convert Sets to Arrays and calculate percentages
    const totalBytes = Object.values(languages).reduce((sum, lang) => sum + lang.totalBytes, 0);
    
    for (const [language, data] of Object.entries(languages)) {
      data.percentage = totalBytes > 0 ? (data.totalBytes / totalBytes) * 100 : 0;
      data.extensions = Array.from(data.extensions);
      data.frameworks = Array.from(data.frameworks);
      data.dependencies = Array.from(data.dependencies);
    }

    console.log(`📊 Found ${Object.keys(languages).length} programming languages`);
    return { languages };
  }

  /**
   * Analyze infrastructure as code files
   */
  async analyzeInfrastructure() {
    console.log('🏗️ Analyzing infrastructure as code...');
    
    const infrastructure = {
      ansible: { files: [], playbooks: [], roles: [], inventories: [] },
      terraform: { files: [], modules: [], providers: [], resources: [] },
      kubernetes: { files: [], deployments: [], services: [], configmaps: [] },
      docker: { files: [], images: [], services: [], networks: [] },
      cloudformation: { files: [], stacks: [], resources: [] },
      helm: { files: [], charts: [], templates: [] }
    };

    const files = await this.getRepositoryFiles();
    
    for (const file of files) {
      if (this.shouldSkipFile(file)) continue;
      
      try {
        // Ansible analysis
        if (this.isAnsibleFile(file)) {
          infrastructure.ansible.files.push(file);
          const ansibleData = await this.analyzeAnsibleFile(file);
          Object.assign(infrastructure.ansible, ansibleData);
        }
        
        // Terraform analysis
        if (this.isTerraformFile(file)) {
          infrastructure.terraform.files.push(file);
          const terraformData = await this.analyzeTerraformFile(file);
          Object.assign(infrastructure.terraform, terraformData);
        }
        
        // Kubernetes analysis
        if (this.isKubernetesFile(file)) {
          infrastructure.kubernetes.files.push(file);
          const k8sData = await this.analyzeKubernetesFile(file);
          Object.assign(infrastructure.kubernetes, k8sData);
        }
        
        // Docker analysis
        if (this.isDockerFile(file)) {
          infrastructure.docker.files.push(file);
          const dockerData = await this.analyzeDockerFile(file);
          Object.assign(infrastructure.docker, dockerData);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to analyze infrastructure file ${file}:`, error.message);
      }
    }

    console.log('🔧 Infrastructure analysis completed');
    return { infrastructure };
  }

  /**
   * Analyze contributor expertise based on Git history
   */
  async analyzeExpertise() {
    console.log('👥 Analyzing contributor expertise...');
    
    if (!this.git) {
      console.warn('⚠️ Git not available, skipping expertise analysis');
      return { expertise: {} };
    }

    const expertise = {};
    
    try {
      // Get commit history
      const commits = await this.git.log({
        maxCount: this.getConfig('analysis.maxHistoryDepth', 1000)
      });

      // Analyze each commit
      for (const commit of commits.all) {
        const author = commit.author_name;
        const email = commit.author_email;
        const date = new Date(commit.date);
        const message = commit.message;
        
        if (!expertise[author]) {
          expertise[author] = {
            email,
            commits: 0,
            linesAdded: 0,
            linesDeleted: 0,
            filesModified: new Set(),
            languages: new Set(),
            areas: new Set(),
            recentActivity: 0,
            firstCommit: date,
            lastCommit: date
          };
        }

        const expert = expertise[author];
        expert.commits++;
        expert.lastCommit = date > expert.lastCommit ? date : expert.lastCommit;
        expert.firstCommit = date < expert.firstCommit ? date : expert.firstCommit;

        // Analyze commit changes
        try {
          const diff = await this.git.diffSummary([`${commit.hash}^`, commit.hash]);
          expert.linesAdded += diff.insertions || 0;
          expert.linesDeleted += diff.deletions || 0;
          
          // Track modified files and languages
          if (diff.files) {
            diff.files.forEach(file => {
              expert.filesModified.add(file.file);
              const language = this.detectLanguage(file.file);
              if (language) {
                expert.languages.add(language);
              }
              
              // Detect areas of expertise
              const area = this.detectAreaFromPath(file.file);
              if (area) {
                expert.areas.add(area);
              }
            });
          }
        } catch (diffError) {
          // Skip diff analysis for this commit if it fails
        }

        // Calculate recent activity (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (date > sixMonthsAgo) {
          expert.recentActivity++;
        }
      }

      // Convert Sets to Arrays and calculate expertise scores
      for (const [author, data] of Object.entries(expertise)) {
        data.filesModified = Array.from(data.filesModified);
        data.languages = Array.from(data.languages);
        data.areas = Array.from(data.areas);
        
        // Calculate expertise score
        const recentWeight = this.getConfig('expertise.recentActivityWeight', 0.7);
        const ownershipWeight = this.getConfig('expertise.codeOwnershipWeight', 0.3);
        
        data.expertiseScore = (
          (data.recentActivity * recentWeight) +
          (data.filesModified.length * ownershipWeight)
        ) / Math.max(1, commits.total);
        
        data.totalContributions = data.linesAdded + data.linesDeleted;
      }

      console.log(`👨‍💻 Analyzed expertise for ${Object.keys(expertise).length} contributors`);
      return { expertise };
    } catch (error) {
      console.warn('⚠️ Failed to analyze expertise:', error.message);
      return { expertise: {} };
    }
  }

  /**
   * Analyze codebase intelligence and patterns
   */
  async analyzeIntelligence() {
    console.log('🧠 Analyzing codebase intelligence...');
    
    const intelligence = {
      architecture: {},
      patterns: [],
      dependencies: {},
      modules: {},
      complexity: {},
      quality: {}
    };

    try {
      // Analyze architecture patterns
      intelligence.architecture = await this.analyzeArchitecture();
      
      // Detect design patterns
      intelligence.patterns = await this.detectDesignPatterns();
      
      // Analyze dependencies
      intelligence.dependencies = await this.analyzeDependencies();
      
      // Map modules and structure
      intelligence.modules = await this.analyzeModuleStructure();
      
      // Calculate complexity metrics
      intelligence.complexity = await this.analyzeComplexity();
      
      console.log('🎯 Codebase intelligence analysis completed');
      return { intelligence };
    } catch (error) {
      console.warn('⚠️ Failed to analyze intelligence:', error.message);
      return { intelligence };
    }
  }

  /**
   * Helper methods for language detection
   */
  initializeLanguagePatterns() {
    return {
      javascript: ['.js', '.mjs', '.jsx'],
      typescript: ['.ts', '.tsx', '.d.ts'],
      python: ['.py', '.pyw', '.pyx', '.pyi'],
      java: ['.java', '.class', '.jar'],
      csharp: ['.cs', '.csx', '.csproj'],
      go: ['.go'],
      rust: ['.rs', '.toml'],
      php: ['.php', '.phtml', '.inc'],
      ruby: ['.rb', '.rbw', '.rake', '.gemspec'],
      swift: ['.swift'],
      kotlin: ['.kt', '.kts'],
      cpp: ['.cpp', '.cxx', '.cc', '.c++', '.hpp', '.hxx'],
      c: ['.c', '.h'],
      scala: ['.scala', '.sc'],
      clojure: ['.clj', '.cljs', '.cljc'],
      elixir: ['.ex', '.exs'],
      erlang: ['.erl', '.hrl'],
      haskell: ['.hs', '.lhs'],
      dart: ['.dart'],
      lua: ['.lua'],
      perl: ['.pl', '.pm', '.pod'],
      r: ['.r', '.R', '.rmd'],
      shell: ['.sh', '.bash', '.zsh', '.fish'],
      powershell: ['.ps1', '.psm1', '.psd1'],
      sql: ['.sql', '.mysql', '.pgsql'],
      html: ['.html', '.htm', '.xhtml'],
      css: ['.css'],
      scss: ['.scss', '.sass'],
      less: ['.less'],
      yaml: ['.yml', '.yaml'],
      json: ['.json'],
      xml: ['.xml', '.xsd', '.xsl'],
      markdown: ['.md', '.markdown', '.mdown']
    };
  }

  initializeInfrastructurePatterns() {
    return {
      ansible: {
        files: ['.yml', '.yaml'],
        directories: ['playbooks', 'roles', 'group_vars', 'host_vars'],
        keywords: ['hosts:', 'tasks:', 'handlers:', 'vars:', 'become:']
      },
      terraform: {
        files: ['.tf', '.tfvars', '.tfstate'],
        keywords: ['resource', 'provider', 'variable', 'output', 'module']
      },
      kubernetes: {
        files: ['.yml', '.yaml'],
        keywords: ['apiVersion:', 'kind:', 'metadata:', 'spec:']
      },
      docker: {
        files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
        keywords: ['FROM', 'RUN', 'COPY', 'EXPOSE', 'CMD']
      }
    };
  }

  initializeFrameworkPatterns() {
    return {
      react: ['react', '@types/react', 'jsx', 'tsx'],
      vue: ['vue', '@vue/', '.vue'],
      angular: ['@angular/', 'angular', '.component.ts'],
      svelte: ['svelte', '.svelte'],
      next: ['next', 'next.config.js'],
      nuxt: ['nuxt', 'nuxt.config.js'],
      django: ['django', 'manage.py', 'settings.py'],
      flask: ['flask', 'app.py'],
      fastapi: ['fastapi', 'main.py'],
      spring: ['springframework', 'spring-boot'],
      express: ['express', 'app.js'],
      nestjs: ['@nestjs/', 'nest'],
      laravel: ['laravel', 'artisan', 'composer.json'],
      rails: ['rails', 'Gemfile', 'config.ru']
    };
  }

  initializeIgnoreFilter() {
    if (!ignore) return null;
    
    const ignorePatterns = this.getConfig('analysis.excludePatterns', []);
    return ignore().add(ignorePatterns);
  }

  /**
   * File analysis methods
   */
  async getRepositoryFiles() {
    const files = [];
    
    const walkDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.repositoryPath, fullPath);
          
          if (this.ignoreFilter && this.ignoreFilter.ignores(relativePath)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await walkDir(this.repositoryPath);
    return files;
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath).toLowerCase();
    
    // Check exact filename matches first
    const filenameMatches = {
      'dockerfile': 'docker',
      'vagrantfile': 'ruby',
      'makefile': 'make',
      'rakefile': 'ruby',
      'gemfile': 'ruby',
      'pipfile': 'python',
      'cargo.toml': 'rust',
      'go.mod': 'go',
      'package.json': 'javascript',
      'composer.json': 'php',
      'pom.xml': 'java',
      'build.gradle': 'java'
    };
    
    if (filenameMatches[filename]) {
      return filenameMatches[filename];
    }
    
    // Check extension patterns
    for (const [language, extensions] of Object.entries(this.languagePatterns)) {
      if (extensions.includes(ext)) {
        return language;
      }
    }
    
    return null;
  }

  async analyzeFile(filePath) {
    try {
      const fullPath = path.join(this.repositoryPath, filePath);
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n').length;
      
      return {
        bytes: stats.size,
        lines,
        lastModified: stats.mtime
      };
    } catch (error) {
      return { bytes: 0, lines: 0, lastModified: null };
    }
  }

  shouldSkipFile(filePath) {
    const maxSize = this.parseSize(this.getConfig('languages.maxFileSize', '10MB'));
    const minSize = this.getConfig('languages.minFileSize', 10);
    
    try {
      const fullPath = path.join(this.repositoryPath, filePath);
      const stats = fs.statSync(fullPath);
      return stats.size > maxSize || stats.size < minSize;
    } catch {
      return true;
    }
  }

  parseSize(sizeStr) {
    const units = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
    if (!match) return parseInt(sizeStr) || 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] ? units[match[2].toUpperCase()] : 1;
    return value * unit;
  }

  /**
   * Infrastructure analysis methods
   */
  isAnsibleFile(filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filePath);
    const dirname = path.dirname(filePath);
    
    return (
      ['.yml', '.yaml'].includes(ext) &&
      (
        dirname.includes('playbook') ||
        dirname.includes('role') ||
        filename.includes('playbook') ||
        filename.includes('role') ||
        this.containsAnsibleKeywords(filePath)
      )
    );
  }

  isTerraformFile(filePath) {
    const ext = path.extname(filePath);
    return ['.tf', '.tfvars', '.tfstate'].includes(ext);
  }

  isKubernetesFile(filePath) {
    const ext = path.extname(filePath);
    return ['.yml', '.yaml'].includes(ext) && this.containsKubernetesKeywords(filePath);
  }

  isDockerFile(filePath) {
    const filename = path.basename(filePath).toLowerCase();
    return (
      filename === 'dockerfile' ||
      filename.startsWith('dockerfile.') ||
      filename === 'docker-compose.yml' ||
      filename === 'docker-compose.yaml'
    );
  }

  async containsAnsibleKeywords(filePath) {
    try {
      const content = await fs.readFile(path.join(this.repositoryPath, filePath), 'utf8');
      const keywords = this.infrastructurePatterns.ansible.keywords;
      return keywords.some(keyword => content.includes(keyword));
    } catch {
      return false;
    }
  }

  async containsKubernetesKeywords(filePath) {
    try {
      const content = await fs.readFile(path.join(this.repositoryPath, filePath), 'utf8');
      const keywords = this.infrastructurePatterns.kubernetes.keywords;
      return keywords.some(keyword => content.includes(keyword));
    } catch {
      return false;
    }
  }

  async analyzeAnsibleFile(filePath) {
    // Placeholder for detailed Ansible analysis
    return {
      playbooks: [],
      roles: [],
      tasks: [],
      variables: []
    };
  }

  async analyzeTerraformFile(filePath) {
    // Placeholder for detailed Terraform analysis
    return {
      resources: [],
      providers: [],
      modules: [],
      variables: []
    };
  }

  async analyzeKubernetesFile(filePath) {
    // Placeholder for detailed Kubernetes analysis
    return {
      deployments: [],
      services: [],
      configmaps: [],
      secrets: []
    };
  }

  async analyzeDockerFile(filePath) {
    // Placeholder for detailed Docker analysis
    return {
      images: [],
      services: [],
      volumes: [],
      networks: []
    };
  }

  /**
   * Framework and dependency detection
   */
  async detectFrameworksInFile(filePath, language) {
    const frameworks = [];
    
    try {
      const content = await fs.readFile(path.join(this.repositoryPath, filePath), 'utf8');
      
      for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
        if (patterns.some(pattern => content.includes(pattern))) {
          frameworks.push(framework);
        }
      }
    } catch {
      // Skip if file can't be read
    }
    
    return frameworks;
  }

  async detectDependenciesInFile(filePath, language) {
    const dependencies = [];
    
    // Language-specific dependency detection logic would go here
    // For now, return empty array
    
    return dependencies;
  }

  /**
   * Advanced analysis methods
   */
  async analyzeArchitecture() {
    return {
      type: 'unknown',
      patterns: [],
      layers: []
    };
  }

  async detectDesignPatterns() {
    return [];
  }

  async analyzeDependencies() {
    return {
      direct: [],
      transitive: [],
      outdated: [],
      vulnerable: []
    };
  }

  async analyzeModuleStructure() {
    return {
      modules: [],
      imports: [],
      exports: []
    };
  }

  async analyzeComplexity() {
    return {
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maintainabilityIndex: 0
    };
  }

  detectAreaFromPath(filePath) {
    const pathParts = filePath.split('/');
    
    const areaMap = {
      frontend: ['frontend', 'client', 'web', 'ui', 'components'],
      backend: ['backend', 'server', 'api', 'services'],
      database: ['database', 'db', 'models', 'migrations'],
      infrastructure: ['infrastructure', 'infra', 'deploy', 'ansible', 'terraform'],
      testing: ['test', 'tests', 'spec', '__tests__'],
      documentation: ['docs', 'documentation', 'readme']
    };
    
    for (const [area, keywords] of Object.entries(areaMap)) {
      if (pathParts.some(part => keywords.includes(part.toLowerCase()))) {
        return area;
      }
    }
    
    return 'general';
  }

  /**
   * Utility methods
   */
  isGitRepository() {
    try {
      const gitPath = path.join(this.repositoryPath, '.git');
      return fs.existsSync ? fs.existsSync(gitPath) : true;
    } catch {
      return false;
    }
  }

  async generateCacheKey() {
    try {
      if (!this.git) return 'no-git';
      const latestCommit = await this.git.log({ maxCount: 1 });
      return latestCommit.latest?.hash || 'unknown';
    } catch {
      return 'cache-error';
    }
  }

  generateMetrics(analysis) {
    const totalFiles = Object.values(analysis.languages || {})
      .reduce((sum, lang) => sum + lang.files.length, 0);
    
    const totalLines = Object.values(analysis.languages || {})
      .reduce((sum, lang) => sum + lang.totalLines, 0);
    
    const totalContributors = Object.keys(analysis.expertise || {}).length;
    
    return {
      totalFiles,
      totalLines,
      totalContributors,
      languageCount: Object.keys(analysis.languages || {}).length,
      frameworkCount: analysis.frameworks?.length || 0,
      infrastructureTypes: Object.keys(analysis.infrastructure || {}).length
    };
  }

  /**
   * Get analyzer priority (higher = more specific)
   */
  getPriority() {
    return 60; // Medium-high priority for repository analysis
  }
}