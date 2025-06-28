import { BaseIntegration } from '../../../core/plugin-manager/interfaces.js';
import fs from 'fs/promises';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

// Dynamic imports for optional dependencies
let playwright = null;
let playwrightTest = null;
let pixelmatch = null;
let PNG = null;

try {
  const pw = await import('playwright');
  playwright = {
    chromium: pw.chromium,
    firefox: pw.firefox,
    webkit: pw.webkit,
    devices: pw.devices
  };
  
  const pwTest = await import('@playwright/test');
  playwrightTest = {
    test: pwTest.test,
    expect: pwTest.expect
  };
  
  const pm = await import('pixelmatch');
  pixelmatch = pm.default;
  
  const pngjs = await import('pngjs');
  PNG = pngjs.PNG;
} catch (error) {
  console.warn('⚠️ Playwright dependencies not installed. Browser testing features will be limited.');
}

const execAsync = promisify(exec);

/**
 * BrowserTestingIntegration - Advanced browser testing automation
 * 
 * Features:
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Visual regression testing with screenshot comparison
 * - Accessibility testing with WCAG compliance
 * - Performance monitoring and metrics collection
 * - Mobile and responsive testing
 * - API testing integration
 * - Test generation and maintenance
 */
export default class BrowserTestingIntegration extends BaseIntegration {
  constructor(manifest, config) {
    super(manifest, config);
    
    this.supportedBrowsers = ['chromium', 'firefox', 'webkit'];
    this.browserInstances = new Map();
    this.testSuites = new Map();
    this.screenshots = new Map();
    
    // Initialize browser engines
    this.browsers = playwright ? {
      chromium: playwright.chromium,
      firefox: playwright.firefox, 
      webkit: playwright.webkit
    } : {
      chromium: null,
      firefox: null,
      webkit: null
    };
    
    this.devices = playwright?.devices || {};
    
    // Initialize test runner
    this.initializeTestRunner();
  }

  /**
   * Initialize Playwright test runner configuration
   */
  initializeTestRunner() {
    this.testConfig = {
      timeout: this.getConfig('testing.timeout', 30000),
      retries: this.getConfig('testing.retries', 2),
      workers: this.getConfig('testing.workers', 4),
      use: {
        headless: this.getConfig('browsers.chromium.headless', true),
        viewport: this.getConfig('browsers.chromium.viewport', { width: 1920, height: 1080 }),
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure'
      },
      projects: this.generateBrowserProjects()
    };
  }

  /**
   * Generate browser project configurations
   */
  generateBrowserProjects() {
    const projects = [];
    
    for (const browser of this.supportedBrowsers) {
      const browserConfig = this.getConfig(`browsers.${browser}`, {});
      if (browserConfig.enabled) {
        projects.push({
          name: browser,
          use: {
            ...devices[browserConfig.device] || {},
            viewport: browserConfig.viewport,
            headless: browserConfig.headless
          }
        });
      }
    }
    
    // Add mobile device projects if enabled
    if (this.getConfig('mobile.enabled', false) && this.devices) {
      const mobileDevices = this.getConfig('mobile.devices', []);
      for (const device of mobileDevices) {
        if (this.devices[device]) {
          projects.push({
            name: `mobile-${device.replace(/\s+/g, '-').toLowerCase()}`,
            use: this.devices[device]
          });
        }
      }
    }
    
    return projects;
  }

  /**
   * Check if integration is properly configured
   */
  async isConfigured() {
    try {
      // Check if Playwright dependencies are available
      if (!playwright) {
        return false;
      }
      
      // Check if Playwright CLI is available
      await execAsync('npx playwright --version');
      
      // Check if at least one browser is enabled
      const enabledBrowsers = this.getEnabledBrowsers();
      return enabledBrowsers.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Connect and initialize browser instances
   */
  async connect(options = {}) {
    const results = {
      success: true,
      browsers: {},
      errors: []
    };

    if (!playwright) {
      results.success = false;
      results.errors.push('Playwright not available');
      return results;
    }

    const enabledBrowsers = this.getEnabledBrowsers();
    
    for (const browserName of enabledBrowsers) {
      try {
        console.log(`Launching ${browserName} browser...`);
        const browserConfig = this.getConfig(`browsers.${browserName}`, {});
        
        if (!this.browsers[browserName]) {
          throw new Error(`Browser ${browserName} not available`);
        }
        
        const browser = await this.browsers[browserName].launch({
          headless: browserConfig.headless !== false,
          ...options.launchOptions
        });
        
        this.browserInstances.set(browserName, browser);
        results.browsers[browserName] = {
          status: 'connected',
          version: browser.version()
        };
        
        console.log(`✅ ${browserName} browser launched successfully`);
      } catch (error) {
        console.warn(`⚠️ Failed to launch ${browserName}: ${error.message}`);
        results.browsers[browserName] = {
          status: 'failed',
          error: error.message
        };
        results.errors.push(`${browserName}: ${error.message}`);
      }
    }

    results.success = results.errors.length === 0;
    return results;
  }

  /**
   * Disconnect and close browser instances
   */
  async disconnect() {
    const results = {};
    
    for (const [browserName, browser] of this.browserInstances) {
      try {
        await browser.close();
        results[browserName] = 'disconnected';
      } catch (error) {
        results[browserName] = `disconnect failed: ${error.message}`;
      }
    }
    
    this.browserInstances.clear();
    return results;
  }

  /**
   * Check if connected to browsers
   */
  async isConnected() {
    return this.browserInstances.size > 0;
  }

  /**
   * Execute browser testing operations
   */
  async execute(operation, params = {}) {
    if (!await this.isConnected() && operation !== 'install-browsers') {
      await this.connect();
    }

    switch (operation) {
      case 'run-tests':
        return await this.runTests(params);
      case 'create-test':
        return await this.createTest(params);
      case 'screenshot':
        return await this.takeScreenshot(params);
      case 'visual-test':
        return await this.runVisualTest(params);
      case 'accessibility-test':
        return await this.runAccessibilityTest(params);
      case 'performance-test':
        return await this.runPerformanceTest(params);
      case 'mobile-test':
        return await this.runMobileTest(params);
      case 'generate-test':
        return await this.generateTest(params);
      case 'install-browsers':
        return await this.installBrowsers(params);
      case 'update-snapshots':
        return await this.updateSnapshots(params);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Run test suite
   */
  async runTests(params) {
    const testPath = params.testPath || './tests';
    const browsers = params.browsers || this.getEnabledBrowsers();
    const options = {
      grep: params.grep,
      headed: params.headed,
      debug: params.debug,
      reporter: params.reporter || 'html',
      ...params.options
    };

    try {
      console.log(`Running tests in: ${testPath}`);
      console.log(`Browsers: ${browsers.join(', ')}`);

      const results = await this.executePlaywrightTests(testPath, browsers, options);
      
      return {
        success: results.exitCode === 0,
        exitCode: results.exitCode,
        duration: results.duration,
        summary: results.summary,
        reports: results.reports,
        artifacts: results.artifacts
      };
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  /**
   * Execute Playwright tests
   */
  async executePlaywrightTests(testPath, browsers, options) {
    const startTime = Date.now();
    const outputDir = this.getConfig('testing.outputDir', './test-results');
    
    // Generate Playwright config
    const configPath = await this.generatePlaywrightConfig(browsers, options);
    
    // Build command
    const args = [
      'playwright', 'test',
      '--config', configPath,
      testPath
    ];
    
    if (options.grep) {
      args.push('--grep', options.grep);
    }
    
    if (options.headed) {
      args.push('--headed');
    }
    
    if (options.debug) {
      args.push('--debug');
    }
    
    if (options.reporter) {
      args.push('--reporter', options.reporter);
    }

    try {
      const { stdout, stderr } = await execAsync(`npx ${args.join(' ')}`);
      
      const duration = Date.now() - startTime;
      const summary = this.parseTestResults(stdout);
      
      return {
        exitCode: 0,
        duration,
        summary,
        stdout,
        stderr,
        reports: await this.collectReports(outputDir),
        artifacts: await this.collectArtifacts(outputDir)
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const summary = this.parseTestResults(error.stdout || '');
      
      return {
        exitCode: error.code || 1,
        duration,
        summary,
        stdout: error.stdout,
        stderr: error.stderr,
        error: error.message,
        reports: await this.collectReports(outputDir),
        artifacts: await this.collectArtifacts(outputDir)
      };
    }
  }

  /**
   * Create a new test file
   */
  async createTest(params) {
    const testName = params.name;
    const testType = params.type || 'e2e';
    const target = params.target; // URL or component
    const template = params.template || 'basic';
    
    const testContent = this.generateTestTemplate(testName, testType, target, template);
    const testPath = path.join(params.outputDir || './tests', `${testName}.spec.js`);
    
    await fs.mkdir(path.dirname(testPath), { recursive: true });
    await fs.writeFile(testPath, testContent, 'utf8');
    
    return {
      success: true,
      testPath,
      testName,
      testType,
      content: testContent
    };
  }

  /**
   * Take screenshot of a page
   */
  async takeScreenshot(params) {
    const url = params.url;
    const browser = params.browser || 'chromium';
    const options = {
      fullPage: params.fullPage !== false,
      path: params.path,
      ...params.options
    };

    if (!this.browserInstances.has(browser)) {
      throw new Error(`Browser ${browser} not connected`);
    }

    const browserInstance = this.browserInstances.get(browser);
    const context = await browserInstance.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url);
      const screenshot = await page.screenshot(options);
      
      if (options.path) {
        await fs.mkdir(path.dirname(options.path), { recursive: true });
      }
      
      return {
        success: true,
        screenshot: options.path ? null : screenshot,
        path: options.path,
        url,
        browser,
        timestamp: new Date().toISOString()
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Run visual regression test
   */
  async runVisualTest(params) {
    const url = params.url;
    const testName = params.name;
    const threshold = params.threshold || this.getConfig('visual.threshold', 0.2);
    
    const screenshotPath = path.join(
      this.getConfig('testing.screenshotDir', './screenshots'),
      `${testName}.png`
    );
    
    const baselinePath = path.join(
      this.getConfig('testing.screenshotDir', './screenshots'),
      'baseline',
      `${testName}.png`
    );

    // Take current screenshot
    await this.takeScreenshot({
      url,
      path: screenshotPath,
      fullPage: true
    });

    // Compare with baseline if it exists
    if (await this.fileExists(baselinePath)) {
      const comparison = await this.compareImages(baselinePath, screenshotPath, threshold);
      
      return {
        success: comparison.match,
        testName,
        url,
        baseline: baselinePath,
        current: screenshotPath,
        difference: comparison.diff,
        pixelDifference: comparison.pixelDiff,
        threshold,
        match: comparison.match
      };
    } else {
      // Create baseline
      await fs.mkdir(path.dirname(baselinePath), { recursive: true });
      await fs.copyFile(screenshotPath, baselinePath);
      
      return {
        success: true,
        testName,
        url,
        baseline: baselinePath,
        message: 'Baseline created'
      };
    }
  }

  /**
   * Run accessibility test
   */
  async runAccessibilityTest(params) {
    const url = params.url;
    const standards = params.standards || this.getConfig('accessibility.standards', ['wcag2aa']);
    const browser = params.browser || 'chromium';

    if (!this.browserInstances.has(browser)) {
      throw new Error(`Browser ${browser} not connected`);
    }

    const browserInstance = this.browserInstances.get(browser);
    const context = await browserInstance.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url);
      
      // Inject axe-core for accessibility testing
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@latest/axe.min.js'
      });

      // Run accessibility scan
      const results = await page.evaluate(async (standards) => {
        const axe = window.axe;
        if (!axe) {
          throw new Error('axe-core not loaded');
        }
        
        return await axe.run(document, {
          tags: standards
        });
      }, standards);

      const violations = results.violations || [];
      const passes = results.passes || [];
      
      return {
        success: violations.length === 0,
        url,
        violations: violations.length,
        passes: passes.length,
        results: {
          violations: violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
            help: v.help,
            helpUrl: v.helpUrl
          })),
          summary: {
            violations: violations.length,
            passes: passes.length,
            incomplete: results.incomplete?.length || 0,
            inapplicable: results.inapplicable?.length || 0
          }
        },
        standards,
        timestamp: new Date().toISOString()
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Run performance test
   */
  async runPerformanceTest(params) {
    const url = params.url;
    const browser = params.browser || 'chromium';
    const metrics = params.metrics || this.getConfig('performance.metrics', ['FCP', 'LCP']);
    const thresholds = params.thresholds || this.getConfig('performance.thresholds', {});

    if (!this.browserInstances.has(browser)) {
      throw new Error(`Browser ${browser} not connected`);
    }

    const browserInstance = this.browserInstances.get(browser);
    const context = await browserInstance.newContext();
    const page = await context.newPage();

    try {
      // Enable performance tracking
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      const startTime = Date.now();
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Get Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // Get paint metrics
          const paintEntries = performance.getEntriesByType('paint');
          for (const entry of paintEntries) {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
          }
          
          // Get LCP using PerformanceObserver
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              vitals.LCP = lastEntry.startTime;
              observer.disconnect();
              resolve(vitals);
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Fallback timeout
            setTimeout(() => resolve(vitals), 2000);
          } else {
            resolve(vitals);
          }
        });
      });

      // Get additional metrics
      const navigationEntry = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return nav ? {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          domComplete: nav.domComplete - nav.domInteractive,
          loadComplete: nav.loadEventEnd - nav.loadEventStart
        } : {};
      });

      const coverage = {
        js: await page.coverage.stopJSCoverage(),
        css: await page.coverage.stopCSSCoverage()
      };

      const performanceMetrics = {
        ...webVitals,
        ...navigationEntry,
        TTFB: response ? Date.now() - startTime : null,
        loadTime,
        coverage: {
          js: this.calculateCoverage(coverage.js),
          css: this.calculateCoverage(coverage.css)
        }
      };

      // Check against thresholds
      const violations = [];
      for (const [metric, threshold] of Object.entries(thresholds)) {
        if (performanceMetrics[metric] && performanceMetrics[metric] > threshold) {
          violations.push({
            metric,
            value: performanceMetrics[metric],
            threshold,
            exceeded: performanceMetrics[metric] - threshold
          });
        }
      }

      return {
        success: violations.length === 0,
        url,
        metrics: performanceMetrics,
        violations,
        thresholds,
        passed: Object.keys(thresholds).length - violations.length,
        timestamp: new Date().toISOString()
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Run mobile device testing
   */
  async runMobileTest(params) {
    const url = params.url;
    const deviceName = params.device || 'iPhone 13';
    const orientation = params.orientation || 'portrait';
    
    if (!this.devices || !this.devices[deviceName]) {
      throw new Error(`Device ${deviceName} not supported`);
    }

    const browserInstance = this.browserInstances.get('chromium');
    if (!browserInstance) {
      throw new Error('Chromium browser not connected');
    }

    const device = this.devices[deviceName];
    const context = await browserInstance.newContext({
      ...device,
      isMobile: true
    });

    const page = await context.newPage();

    try {
      if (orientation === 'landscape') {
        await page.setViewportSize({
          width: device.viewport.height,
          height: device.viewport.width
        });
      }

      await page.goto(url);
      
      // Take screenshot
      const screenshotPath = path.join(
        this.getConfig('testing.screenshotDir', './screenshots'),
        'mobile',
        `${deviceName.replace(/\s+/g, '-')}-${orientation}.png`
      );
      
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Check responsive elements
      const responsiveCheck = await page.evaluate(() => {
        const issues = [];
        
        // Check for horizontal scroll
        if (document.body.scrollWidth > window.innerWidth) {
          issues.push('Horizontal scroll detected');
        }
        
        // Check for tiny text
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 16 && fontSize > 0) {
            issues.push(`Small font size detected: ${fontSize}px`);
            break; // Report only first instance
          }
        }
        
        return issues;
      });

      return {
        success: responsiveCheck.length === 0,
        url,
        device: deviceName,
        orientation,
        screenshot: screenshotPath,
        issues: responsiveCheck,
        viewport: await page.viewportSize(),
        timestamp: new Date().toISOString()
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Generate test from existing user flows
   */
  async generateTest(params) {
    const url = params.url;
    const testName = params.name;
    const actions = params.actions || [];
    const browser = params.browser || 'chromium';

    const testTemplate = `
import { test, expect } from '@playwright/test';

test('${testName}', async ({ page }) => {
  // Navigate to the page
  await page.goto('${url}');
  
  // Generated actions
${actions.map(action => this.generateActionCode(action)).join('\n')}
  
  // Add your assertions here
  await expect(page).toHaveTitle(/.*${testName}.*/);
});
`;

    const testPath = path.join(
      params.outputDir || './tests/generated',
      `${testName.replace(/\s+/g, '-').toLowerCase()}.spec.js`
    );

    await fs.mkdir(path.dirname(testPath), { recursive: true });
    await fs.writeFile(testPath, testTemplate.trim(), 'utf8');

    return {
      success: true,
      testPath,
      testName,
      url,
      actions: actions.length,
      content: testTemplate.trim()
    };
  }

  /**
   * Install Playwright browsers
   */
  async installBrowsers(params) {
    const browsers = params.browsers || this.getEnabledBrowsers();
    
    try {
      console.log(`Installing browsers: ${browsers.join(', ')}`);
      
      const { stdout, stderr } = await execAsync(`npx playwright install ${browsers.join(' ')}`);
      
      return {
        success: true,
        browsers,
        output: stdout,
        errors: stderr
      };
    } catch (error) {
      throw new Error(`Browser installation failed: ${error.message}`);
    }
  }

  /**
   * Update visual test snapshots
   */
  async updateSnapshots(params) {
    const testPath = params.testPath || './tests';
    
    try {
      const { stdout, stderr } = await execAsync(`npx playwright test ${testPath} --update-snapshots`);
      
      return {
        success: true,
        output: stdout,
        errors: stderr,
        message: 'Snapshots updated successfully'
      };
    } catch (error) {
      throw new Error(`Snapshot update failed: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */
  
  getEnabledBrowsers() {
    return this.supportedBrowsers.filter(browser => 
      this.getConfig(`browsers.${browser}.enabled`, false)
    );
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async compareImages(baselinePath, currentPath, threshold) {
    if (!PNG || !pixelmatch) {
      throw new Error('Image comparison dependencies not available');
    }
    
    const baseline = PNG.sync.read(await fs.readFile(baselinePath));
    const current = PNG.sync.read(await fs.readFile(currentPath));
    
    const { width, height } = baseline;
    const diff = new PNG({ width, height });
    
    const pixelDiff = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold }
    );
    
    const totalPixels = width * height;
    const diffPercentage = (pixelDiff / totalPixels) * 100;
    
    return {
      pixelDiff,
      totalPixels,
      diffPercentage,
      match: diffPercentage <= threshold,
      diff: diff.data
    };
  }

  generateTestTemplate(testName, testType, target, template) {
    const templates = {
      basic: `
import { test, expect } from '@playwright/test';

test('${testName}', async ({ page }) => {
  await page.goto('${target}');
  await expect(page).toHaveTitle(/.*${testName}.*/);
});`,
      form: `
import { test, expect } from '@playwright/test';

test('${testName} - Form Testing', async ({ page }) => {
  await page.goto('${target}');
  
  // Fill form fields
  // await page.fill('[name="email"]', 'test@example.com');
  // await page.fill('[name="password"]', 'password123');
  
  // Submit form
  // await page.click('[type="submit"]');
  
  // Verify success
  // await expect(page).toHaveURL(/.*success.*/);
});`,
      navigation: `
import { test, expect } from '@playwright/test';

test('${testName} - Navigation Test', async ({ page }) => {
  await page.goto('${target}');
  
  // Test navigation links
  // await page.click('text=About');
  // await expect(page).toHaveURL(/.*about.*/);
  
  // Test back navigation
  // await page.goBack();
  // await expect(page).toHaveURL('${target}');
});`
    };

    return templates[template] || templates.basic;
  }

  generateActionCode(action) {
    switch (action.type) {
      case 'click':
        return `  await page.click('${action.selector}');`;
      case 'fill':
        return `  await page.fill('${action.selector}', '${action.value}');`;
      case 'navigate':
        return `  await page.goto('${action.url}');`;
      case 'wait':
        return `  await page.waitForSelector('${action.selector}');`;
      default:
        return `  // ${action.type}: ${action.description || 'Custom action'}`;
    }
  }

  async generatePlaywrightConfig(browsers, options) {
    const config = {
      testDir: './tests',
      timeout: this.testConfig.timeout,
      retries: this.testConfig.retries,
      workers: this.testConfig.workers,
      reporter: options.reporter || 'html',
      use: {
        ...this.testConfig.use,
        trace: options.trace || 'retain-on-failure'
      },
      projects: browsers.map(browser => ({
        name: browser,
        use: {
          ...this.getConfig(`browsers.${browser}`, {})
        }
      }))
    };

    const configPath = path.join(process.cwd(), 'playwright.config.tmp.js');
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    
    await fs.writeFile(configPath, configContent, 'utf8');
    return configPath;
  }

  parseTestResults(output) {
    const lines = output.split('\n');
    const summary = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };

    for (const line of lines) {
      const passedMatch = line.match(/(\d+) passed/);
      const failedMatch = line.match(/(\d+) failed/);
      const skippedMatch = line.match(/(\d+) skipped/);

      if (passedMatch) summary.passed = parseInt(passedMatch[1]);
      if (failedMatch) summary.failed = parseInt(failedMatch[1]);
      if (skippedMatch) summary.skipped = parseInt(skippedMatch[1]);
    }

    summary.total = summary.passed + summary.failed + summary.skipped;
    return summary;
  }

  async collectReports(outputDir) {
    const reports = {};
    
    try {
      const reportDir = path.join(outputDir, 'playwright-report');
      if (await this.fileExists(reportDir)) {
        reports.html = path.join(reportDir, 'index.html');
      }
      
      const jsonReport = path.join(outputDir, 'results.json');
      if (await this.fileExists(jsonReport)) {
        reports.json = jsonReport;
      }
    } catch (error) {
      console.warn('Failed to collect reports:', error.message);
    }
    
    return reports;
  }

  async collectArtifacts(outputDir) {
    const artifacts = {
      screenshots: [],
      videos: [],
      traces: []
    };
    
    try {
      const screenshotDir = path.join(outputDir, 'test-results');
      if (await this.fileExists(screenshotDir)) {
        // Collect artifacts from test results
        // This would be more sophisticated in a real implementation
        artifacts.screenshots.push(screenshotDir);
      }
    } catch (error) {
      console.warn('Failed to collect artifacts:', error.message);
    }
    
    return artifacts;
  }

  calculateCoverage(coverageData) {
    if (!coverageData || coverageData.length === 0) {
      return { percentage: 0, covered: 0, total: 0 };
    }
    
    let totalBytes = 0;
    let coveredBytes = 0;
    
    for (const entry of coverageData) {
      totalBytes += entry.text.length;
      for (const range of entry.ranges) {
        coveredBytes += range.end - range.start;
      }
    }
    
    return {
      percentage: totalBytes > 0 ? (coveredBytes / totalBytes) * 100 : 0,
      covered: coveredBytes,
      total: totalBytes
    };
  }

  /**
   * Get integration status
   */
  async getStatus() {
    const enabledBrowsers = this.getEnabledBrowsers();
    const status = {
      connected: await this.isConnected(),
      browsers: {},
      configuration: {
        visual: this.getConfig('visual.enabled', false),
        accessibility: this.getConfig('accessibility.enabled', false),
        performance: this.getConfig('performance.enabled', false),
        mobile: this.getConfig('mobile.enabled', false)
      },
      lastUsed: this.lastUsed || null
    };

    for (const browser of this.supportedBrowsers) {
      status.browsers[browser] = {
        enabled: enabledBrowsers.includes(browser),
        connected: this.browserInstances.has(browser),
        config: this.getConfig(`browsers.${browser}`, {})
      };
    }

    return status;
  }

  /**
   * Get available operations
   */
  getAvailableOperations() {
    return [
      'run-tests',
      'create-test',
      'screenshot',
      'visual-test',
      'accessibility-test',
      'performance-test',
      'mobile-test',
      'generate-test',
      'install-browsers',
      'update-snapshots'
    ];
  }
}