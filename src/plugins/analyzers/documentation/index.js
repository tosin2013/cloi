import { BaseAnalyzer } from '../../../core/plugin-manager/interfaces.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Dynamic imports for optional dependencies
let markdownIt = null;
let grayMatter = null;
let remark = null;

try {
  const mdIt = await import('markdown-it');
  markdownIt = mdIt.default;
  
  const matter = await import('gray-matter');
  grayMatter = matter.default;
  
  const remarkModule = await import('remark');
  remark = remarkModule.remark;
} catch (error) {
  console.warn('⚠️ Some documentation analysis dependencies not installed. Features may be limited.');
}

const execAsync = promisify(exec);

/**
 * DocumentationAnalyzer - Intelligent documentation management and analysis
 * 
 * Capabilities:
 * - Documentation discovery and organization
 * - Coverage analysis and gap identification
 * - Automated documentation generation
 * - Content quality assessment
 * - Knowledge extraction and indexing
 * - Multi-format output support
 * - Integration with repository insights
 */
export default class DocumentationAnalyzer extends BaseAnalyzer {
  constructor(manifest, config) {
    super(manifest, config);
    
    this.repositoryPath = process.cwd();
    this.cache = new Map();
    this.documentationMap = new Map();
    this.coverageData = new Map();
    
    // Initialize markdown processor
    this.md = markdownIt ? markdownIt({
      html: true,
      linkify: true,
      typographer: true
    }) : null;
    
    // Documentation patterns and types
    this.docPatterns = this.initializeDocumentationPatterns();
    this.docTypes = this.initializeDocumentationTypes();
    this.templatePatterns = this.initializeTemplatePatterns();
  }

  /**
   * Check if this analyzer supports the given context
   */
  supports(context) {
    // Documentation analyzer supports any repository with documentation needs
    return this.hasDocumentationFiles() || this.shouldGenerateDocumentation(context);
  }

  /**
   * Analyze repository documentation comprehensively
   */
  async analyze(errorOutput, context = {}) {
    const startTime = Date.now();
    
    try {
      console.log('📚 Starting intelligent documentation analysis...');
      
      // Check cache first
      const cacheKey = await this.generateCacheKey();
      if (this.cache.has(cacheKey) && this.getConfig('caching.enabled', true)) {
        console.log('📋 Using cached documentation analysis results');
        return this.cache.get(cacheKey);
      }

      const analysis = {
        timestamp: new Date().toISOString(),
        repository: {
          path: this.repositoryPath,
          name: path.basename(this.repositoryPath)
        },
        documentation: {},
        coverage: {},
        quality: {},
        structure: {},
        gaps: {},
        recommendations: [],
        metrics: {},
        duration: 0
      };

      // Parallel analysis execution
      const tasks = [];
      
      if (this.getConfig('analysis.trackCoverage', true)) {
        tasks.push(this.analyzeDocumentationCoverage());
      }
      
      if (this.getConfig('analysis.analyzeStructure', true)) {
        tasks.push(this.analyzeDocumentationStructure());
      }
      
      if (this.getConfig('quality.checkCompleteness', true)) {
        tasks.push(this.analyzeDocumentationQuality());
      }
      
      if (this.getConfig('generation.enabled', true)) {
        tasks.push(this.analyzeGenerationOpportunities());
      }

      console.log(`🚀 Running ${tasks.length} documentation analysis tasks...`);
      const results = await Promise.allSettled(tasks);

      // Merge results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          Object.assign(analysis, result.value);
        } else {
          console.warn(`⚠️ Documentation analysis task ${i} failed:`, result.reason);
        }
      }

      // Generate recommendations and metrics
      analysis.recommendations = await this.generateRecommendations(analysis);
      analysis.metrics = this.generateMetrics(analysis);
      analysis.duration = Date.now() - startTime;

      // Cache results
      if (this.getConfig('caching.enabled', true)) {
        this.cache.set(cacheKey, analysis);
      }

      console.log(`✅ Documentation analysis completed in ${analysis.duration}ms`);
      return analysis;
    } catch (error) {
      console.error('❌ Documentation analysis failed:', error);
      throw new Error(`Documentation analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze documentation coverage across the codebase
   */
  async analyzeDocumentationCoverage() {
    console.log('📊 Analyzing documentation coverage...');
    
    const coverage = {
      overall: { documented: 0, total: 0, percentage: 0 },
      byLanguage: {},
      byArea: {},
      byType: {},
      missingDocs: [],
      wellDocumented: []
    };

    try {
      // Analyze code files for documentation
      const codeFiles = await this.getCodeFiles();
      
      for (const file of codeFiles) {
        const analysis = await this.analyzeFileDocumentation(file);
        const language = this.detectLanguage(file);
        const area = this.detectAreaFromPath(file);
        
        // Update language coverage
        if (!coverage.byLanguage[language]) {
          coverage.byLanguage[language] = { documented: 0, total: 0, percentage: 0 };
        }
        coverage.byLanguage[language].total++;
        if (analysis.isDocumented) {
          coverage.byLanguage[language].documented++;
        }
        
        // Update area coverage
        if (!coverage.byArea[area]) {
          coverage.byArea[area] = { documented: 0, total: 0, percentage: 0 };
        }
        coverage.byArea[area].total++;
        if (analysis.isDocumented) {
          coverage.byArea[area].documented++;
        }
        
        // Track overall coverage
        coverage.overall.total++;
        if (analysis.isDocumented) {
          coverage.overall.documented++;
          coverage.wellDocumented.push({
            file,
            score: analysis.score,
            types: analysis.documentationTypes
          });
        } else {
          coverage.missingDocs.push({
            file,
            reasons: analysis.missingReasons,
            priority: analysis.priority
          });
        }
      }

      // Calculate percentages
      coverage.overall.percentage = coverage.overall.total > 0 
        ? (coverage.overall.documented / coverage.overall.total) * 100 : 0;
      
      for (const lang of Object.values(coverage.byLanguage)) {
        lang.percentage = lang.total > 0 ? (lang.documented / lang.total) * 100 : 0;
      }
      
      for (const area of Object.values(coverage.byArea)) {
        area.percentage = area.total > 0 ? (area.documented / area.total) * 100 : 0;
      }

      console.log(`📈 Documentation coverage: ${coverage.overall.percentage.toFixed(1)}%`);
      return { coverage };
    } catch (error) {
      console.warn('⚠️ Failed to analyze documentation coverage:', error.message);
      return { coverage };
    }
  }

  /**
   * Analyze documentation structure and organization
   */
  async analyzeDocumentationStructure() {
    console.log('🗂️ Analyzing documentation structure...');
    
    const structure = {
      directories: [],
      files: [],
      types: {},
      organization: {},
      navigation: {},
      indexes: [],
      orphaned: []
    };

    try {
      const docDirs = this.getConfig('analysis.scanDirectories', ['docs', 'documentation']);
      
      for (const dir of docDirs) {
        const dirPath = path.join(this.repositoryPath, dir);
        
        try {
          await fs.access(dirPath);
          const dirAnalysis = await this.analyzeDocumentationDirectory(dirPath);
          structure.directories.push(dirAnalysis);
        } catch {
          // Directory doesn't exist, skip
        }
      }

      // Analyze scattered documentation files
      const scatteredDocs = await this.findScatteredDocumentation();
      structure.files = scatteredDocs;

      // Analyze organization patterns
      structure.organization = this.analyzeOrganizationPatterns(structure);
      
      // Check for navigation and indexes
      structure.navigation = await this.analyzeNavigationStructure(structure);
      structure.indexes = await this.findIndexFiles(structure);
      
      console.log(`📁 Found ${structure.directories.length} documentation directories`);
      return { structure };
    } catch (error) {
      console.warn('⚠️ Failed to analyze documentation structure:', error.message);
      return { structure };
    }
  }

  /**
   * Analyze documentation quality and completeness
   */
  async analyzeDocumentationQuality() {
    console.log('✨ Analyzing documentation quality...');
    
    const quality = {
      overallScore: 0,
      files: [],
      issues: [],
      strengths: [],
      consistency: {},
      accessibility: {},
      freshness: {}
    };

    try {
      const docFiles = await this.getAllDocumentationFiles();
      
      for (const file of docFiles) {
        const fileQuality = await this.analyzeDocumentationFileQuality(file);
        quality.files.push(fileQuality);
        
        // Collect issues and strengths
        quality.issues.push(...fileQuality.issues);
        quality.strengths.push(...fileQuality.strengths);
      }

      // Calculate overall quality score
      const totalScore = quality.files.reduce((sum, file) => sum + file.score, 0);
      quality.overallScore = quality.files.length > 0 ? totalScore / quality.files.length : 0;

      // Analyze consistency across files
      quality.consistency = this.analyzeDocumentationConsistency(quality.files);
      
      // Check accessibility features
      quality.accessibility = this.analyzeAccessibilityFeatures(quality.files);
      
      // Analyze freshness and currency
      quality.freshness = await this.analyzeDocumentationFreshness(quality.files);

      console.log(`⭐ Overall documentation quality score: ${quality.overallScore.toFixed(1)}/100`);
      return { quality };
    } catch (error) {
      console.warn('⚠️ Failed to analyze documentation quality:', error.message);
      return { quality };
    }
  }

  /**
   * Analyze opportunities for automated documentation generation
   */
  async analyzeGenerationOpportunities() {
    console.log('🤖 Analyzing documentation generation opportunities...');
    
    const opportunities = {
      apiDocumentation: [],
      codeDocumentation: [],
      userGuides: [],
      tutorials: [],
      templates: [],
      automation: {}
    };

    try {
      // Analyze API documentation opportunities
      opportunities.apiDocumentation = await this.analyzeApiDocumentationOpportunities();
      
      // Analyze code documentation opportunities
      opportunities.codeDocumentation = await this.analyzeCodeDocumentationOpportunities();
      
      // Identify user guide opportunities
      opportunities.userGuides = await this.analyzeUserGuideOpportunities();
      
      // Find tutorial opportunities
      opportunities.tutorials = await this.analyzeTutorialOpportunities();
      
      // Assess template needs
      opportunities.templates = await this.analyzeTemplateOpportunities();
      
      // Evaluate automation possibilities
      opportunities.automation = await this.analyzeAutomationOpportunities();

      console.log(`🔧 Found ${Object.values(opportunities).flat().length} generation opportunities`);
      return { opportunities };
    } catch (error) {
      console.warn('⚠️ Failed to analyze generation opportunities:', error.message);
      return { opportunities };
    }
  }

  /**
   * File and content analysis methods
   */
  async analyzeFileDocumentation(filePath) {
    const analysis = {
      isDocumented: false,
      score: 0,
      documentationTypes: [],
      missingReasons: [],
      priority: 'low'
    };

    try {
      const content = await fs.readFile(path.join(this.repositoryPath, filePath), 'utf8');
      const language = this.detectLanguage(filePath);
      
      // Check for inline documentation
      const hasComments = this.hasInlineDocumentation(content, language);
      const hasJSDoc = this.hasJSDocComments(content);
      const hasTypeDoc = this.hasTypeDocComments(content);
      const hasDocstrings = this.hasPythonDocstrings(content);
      
      if (hasComments || hasJSDoc || hasTypeDoc || hasDocstrings) {
        analysis.isDocumented = true;
        analysis.score = this.calculateDocumentationScore(content, language);
        
        if (hasJSDoc) analysis.documentationTypes.push('jsdoc');
        if (hasTypeDoc) analysis.documentationTypes.push('typedoc');
        if (hasDocstrings) analysis.documentationTypes.push('docstring');
        if (hasComments) analysis.documentationTypes.push('inline');
      } else {
        analysis.missingReasons.push('No inline documentation found');
        analysis.priority = this.calculateDocumentationPriority(filePath, content);
      }
      
      return analysis;
    } catch (error) {
      analysis.missingReasons.push('File analysis failed');
      return analysis;
    }
  }

  async analyzeDocumentationDirectory(dirPath) {
    const analysis = {
      path: dirPath,
      files: [],
      subdirectories: [],
      types: {},
      organization: 'unknown',
      hasIndex: false,
      coverage: 0
    };

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subAnalysis = await this.analyzeDocumentationDirectory(fullPath);
          analysis.subdirectories.push(subAnalysis);
        } else if (entry.isFile() && this.isDocumentationFile(entry.name)) {
          const fileAnalysis = await this.analyzeDocumentationFile(fullPath);
          analysis.files.push(fileAnalysis);
          
          // Track documentation types
          const type = this.getDocumentationType(entry.name);
          if (!analysis.types[type]) analysis.types[type] = 0;
          analysis.types[type]++;
          
          // Check for index files
          if (this.isIndexFile(entry.name)) {
            analysis.hasIndex = true;
          }
        }
      }
      
      // Determine organization pattern
      analysis.organization = this.determineOrganizationPattern(analysis);
      
      return analysis;
    } catch (error) {
      console.warn(`Failed to analyze directory ${dirPath}:`, error.message);
      return analysis;
    }
  }

  async analyzeDocumentationFileQuality(filePath) {
    const quality = {
      file: filePath,
      score: 0,
      issues: [],
      strengths: [],
      metadata: {},
      structure: {},
      content: {}
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);
      
      // Parse frontmatter if exists
      if (grayMatter) {
        const parsed = grayMatter(content);
        quality.metadata = parsed.data;
        quality.content.body = parsed.content;
      } else {
        quality.content.body = content;
      }
      
      // Analyze structure
      quality.structure = this.analyzeDocumentStructure(quality.content.body);
      
      // Check various quality metrics
      const checks = [
        this.checkDocumentLength(content),
        this.checkHeaderStructure(content),
        this.checkLinkValidity(content),
        this.checkCodeExamples(content),
        this.checkImages(content),
        this.checkAccessibility(content)
      ];
      
      let totalScore = 0;
      for (const check of checks) {
        totalScore += check.score;
        if (check.issues) quality.issues.push(...check.issues);
        if (check.strengths) quality.strengths.push(...check.strengths);
      }
      
      quality.score = totalScore / checks.length;
      quality.lastModified = stats.mtime;
      
      return quality;
    } catch (error) {
      quality.issues.push({ type: 'error', message: `Failed to analyze: ${error.message}` });
      return quality;
    }
  }

  /**
   * Helper methods for documentation detection and analysis
   */
  initializeDocumentationPatterns() {
    return {
      files: ['.md', '.markdown', '.rst', '.adoc', '.txt'],
      directories: ['docs', 'documentation', 'wiki', 'guides', 'manual'],
      readmePatterns: ['readme', 'README', 'ReadMe'],
      changelogPatterns: ['changelog', 'CHANGELOG', 'CHANGES', 'HISTORY'],
      licensePatterns: ['license', 'LICENSE', 'COPYING'],
      contributingPatterns: ['contributing', 'CONTRIBUTING', 'CONTRIBUTE']
    };
  }

  initializeDocumentationTypes() {
    return {
      'readme': ['readme.md', 'README.md', 'readme.txt'],
      'api': ['api.md', 'API.md', 'reference.md'],
      'guide': ['guide.md', 'tutorial.md', 'howto.md'],
      'changelog': ['changelog.md', 'CHANGELOG.md'],
      'contributing': ['contributing.md', 'CONTRIBUTING.md'],
      'license': ['license.md', 'LICENSE.md'],
      'architecture': ['architecture.md', 'design.md'],
      'deployment': ['deployment.md', 'install.md'],
      'troubleshooting': ['troubleshooting.md', 'faq.md']
    };
  }

  initializeTemplatePatterns() {
    return {
      'issue': ['.github/ISSUE_TEMPLATE/', 'issue_template.md'],
      'pr': ['.github/PULL_REQUEST_TEMPLATE/', 'pull_request_template.md'],
      'docs': ['docs/templates/', 'templates/docs/'],
      'guides': ['guides/templates/', 'templates/guides/']
    };
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    return languageMap[ext] || 'unknown';
  }

  detectAreaFromPath(filePath) {
    const pathParts = filePath.split('/');
    const areaMap = {
      'frontend': ['frontend', 'client', 'web', 'ui'],
      'backend': ['backend', 'server', 'api'],
      'database': ['database', 'db', 'models'],
      'infrastructure': ['infrastructure', 'deploy', 'ops'],
      'testing': ['test', 'tests', 'spec'],
      'docs': ['docs', 'documentation']
    };
    
    for (const [area, keywords] of Object.entries(areaMap)) {
      if (pathParts.some(part => keywords.includes(part.toLowerCase()))) {
        return area;
      }
    }
    return 'general';
  }

  hasDocumentationFiles() {
    try {
      const commonDocs = ['README.md', 'docs/', 'documentation/'];
      return commonDocs.some(doc => {
        try {
          const fullPath = path.join(this.repositoryPath, doc);
          return fs.existsSync ? fs.existsSync(fullPath) : false;
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }

  shouldGenerateDocumentation(context) {
    // Check if context suggests documentation needs
    return context.files?.some(f => this.detectLanguage(f) !== 'unknown') || false;
  }

  isDocumentationFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.docPatterns.files.includes(ext);
  }

  isIndexFile(filename) {
    const name = filename.toLowerCase();
    return ['index.md', 'readme.md', 'index.html', 'toc.md'].includes(name);
  }

  getDocumentationType(filename) {
    const name = filename.toLowerCase();
    for (const [type, patterns] of Object.entries(this.docTypes)) {
      if (patterns.some(pattern => name.includes(pattern.toLowerCase()))) {
        return type;
      }
    }
    return 'general';
  }

  /**
   * Content analysis methods
   */
  hasInlineDocumentation(content, language) {
    const commentPatterns = {
      'javascript': ['/**', '//'],
      'typescript': ['/**', '//'],
      'python': ['"""', "'''", '#'],
      'java': ['/**', '//'],
      'csharp': ['///', '//'],
      'go': ['/*', '//'],
      'rust': ['///', '//'],
      'php': ['/**', '//'],
      'ruby': ['#']
    };
    
    const patterns = commentPatterns[language] || ['//'];
    return patterns.some(pattern => content.includes(pattern));
  }

  hasJSDocComments(content) {
    return /\/\*\*[\s\S]*?\*\//.test(content);
  }

  hasTypeDocComments(content) {
    return /\/\*\*[\s\S]*?@/.test(content);
  }

  hasPythonDocstrings(content) {
    return /"""[\s\S]*?"""/.test(content) || /'''[\s\S]*?'''/.test(content);
  }

  calculateDocumentationScore(content, language) {
    let score = 0;
    
    // Base score for having documentation
    score += 30;
    
    // Bonus for comprehensive documentation
    if (content.length > 500) score += 20;
    if (this.hasExamples(content)) score += 25;
    if (this.hasParameterDocs(content)) score += 15;
    if (this.hasReturnDocs(content)) score += 10;
    
    return Math.min(score, 100);
  }

  calculateDocumentationPriority(filePath, content) {
    // Higher priority for public APIs, main modules, etc.
    if (filePath.includes('api') || filePath.includes('public')) return 'high';
    if (filePath.includes('index') || filePath.includes('main')) return 'medium';
    if (content.length > 1000) return 'medium';
    return 'low';
  }

  hasExamples(content) {
    return /example|Example|EXAMPLE/.test(content);
  }

  hasParameterDocs(content) {
    return /@param|@parameter|Parameters:|Args:/.test(content);
  }

  hasReturnDocs(content) {
    return /@returns?|@return|Returns:|Return:/.test(content);
  }

  /**
   * Generation and recommendation methods
   */
  async generateRecommendations(analysis) {
    const recommendations = [];
    
    // Coverage-based recommendations
    if (analysis.coverage?.overall?.percentage < 50) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: 'Improve documentation coverage',
        description: 'Less than 50% of code files have documentation',
        action: 'Add inline documentation to critical functions and classes'
      });
    }
    
    // Structure-based recommendations
    if (!analysis.structure?.navigation?.hasIndex) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        title: 'Create documentation index',
        description: 'No main documentation index found',
        action: 'Create an index.md or README.md in the docs directory'
      });
    }
    
    // Quality-based recommendations
    if (analysis.quality?.overallScore < 70) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Improve documentation quality',
        description: 'Documentation quality score is below 70%',
        action: 'Review and improve existing documentation content'
      });
    }
    
    return recommendations;
  }

  generateMetrics(analysis) {
    return {
      totalDocuments: analysis.structure?.files?.length || 0,
      coveragePercentage: analysis.coverage?.overall?.percentage || 0,
      qualityScore: analysis.quality?.overallScore || 0,
      missingDocs: analysis.coverage?.missingDocs?.length || 0,
      recommendationCount: analysis.recommendations?.length || 0
    };
  }

  async generateCacheKey() {
    try {
      // Use directory modification time as cache key
      const stats = await fs.stat(this.repositoryPath);
      return `docs-${stats.mtime.getTime()}`;
    } catch {
      return 'docs-cache-error';
    }
  }

  /**
   * Placeholder methods for advanced analysis
   */
  async getCodeFiles() {
    // Return list of code files in repository
    return [];
  }

  async getAllDocumentationFiles() {
    // Return list of all documentation files
    return [];
  }

  async findScatteredDocumentation() {
    // Find documentation files outside standard directories
    return [];
  }

  analyzeOrganizationPatterns(structure) {
    // Analyze how documentation is organized
    return { pattern: 'unknown', score: 0 };
  }

  async analyzeNavigationStructure(structure) {
    // Analyze navigation and linking structure
    return { hasIndex: false, linkage: 'poor' };
  }

  async findIndexFiles(structure) {
    // Find index and table of contents files
    return [];
  }

  analyzeDocumentationConsistency(files) {
    // Analyze consistency across documentation files
    return { score: 0, issues: [] };
  }

  analyzeAccessibilityFeatures(files) {
    // Check accessibility features in documentation
    return { score: 0, features: [] };
  }

  async analyzeDocumentationFreshness(files) {
    // Analyze how up-to-date documentation is
    return { score: 0, outdated: [] };
  }

  async analyzeApiDocumentationOpportunities() {
    // Find opportunities for API documentation generation
    return [];
  }

  async analyzeCodeDocumentationOpportunities() {
    // Find opportunities for code documentation
    return [];
  }

  async analyzeUserGuideOpportunities() {
    // Find opportunities for user guide creation
    return [];
  }

  async analyzeTutorialOpportunities() {
    // Find opportunities for tutorial creation
    return [];
  }

  async analyzeTemplateOpportunities() {
    // Find opportunities for template creation
    return [];
  }

  async analyzeAutomationOpportunities() {
    // Analyze automation possibilities
    return { score: 0, opportunities: [] };
  }

  async analyzeDocumentationFile(filePath) {
    // Analyze individual documentation file
    return { path: filePath, type: 'unknown', quality: 0 };
  }

  analyzeDocumentStructure(content) {
    // Analyze structure of document content
    return { headers: [], sections: [], toc: false };
  }

  determineOrganizationPattern(analysis) {
    // Determine organization pattern from analysis
    return 'flat';
  }

  checkDocumentLength(content) {
    return { score: 50, issues: [], strengths: [] };
  }

  checkHeaderStructure(content) {
    return { score: 50, issues: [], strengths: [] };
  }

  checkLinkValidity(content) {
    return { score: 50, issues: [], strengths: [] };
  }

  checkCodeExamples(content) {
    return { score: 50, issues: [], strengths: [] };
  }

  checkImages(content) {
    return { score: 50, issues: [], strengths: [] };
  }

  checkAccessibility(content) {
    return { score: 50, issues: [], strengths: [] };
  }

  /**
   * Get analyzer priority
   */
  getPriority() {
    return 40; // Medium priority for documentation analysis
  }
}