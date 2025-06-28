# Browser Testing Integration Plugin

A comprehensive browser testing automation plugin for Cloi that provides cross-browser testing, visual regression testing, accessibility validation, and performance monitoring using Playwright.

## Features

### Cross-Browser Testing
- **Chromium** - Google Chrome, Microsoft Edge, Opera
- **Firefox** - Mozilla Firefox  
- **WebKit** - Safari (macOS)
- Headless and headed execution modes
- Custom viewport and device configurations

### Visual Regression Testing
- Screenshot comparison with pixel-perfect accuracy
- Configurable difference thresholds
- Baseline management and automatic updates
- Support for full-page and element screenshots

### Accessibility Testing
- WCAG 2.0, 2.1, and 2.2 compliance validation
- Multiple accessibility standards (A, AA, AAA)
- Detailed violation reporting with remediation guidance
- Integration with axe-core accessibility engine

### Performance Monitoring
- Core Web Vitals measurement (FCP, LCP, FID, CLS, TTFB)
- Code coverage analysis (JavaScript and CSS)
- Custom performance thresholds
- Network and resource timing

### Mobile and Responsive Testing
- Device emulation for popular mobile devices
- Portrait and landscape orientation testing
- Touch interaction simulation
- Responsive design validation

### Test Generation and Management
- Automatic test generation from user flows
- Multiple test templates (basic, form, navigation)
- Action recording and playback
- Test maintenance and updates

## Installation

### Prerequisites

The browser testing plugin requires Playwright and related dependencies:

```bash
# Install Playwright
npm install playwright @playwright/test

# Install additional dependencies for visual testing
npm install pixelmatch pngjs

# Install browsers
npx playwright install
```

### Plugin Installation

The browser testing plugin is included with Cloi by default. No additional installation required.

## Configuration

### Basic Configuration

```json
{
  "enabled": true,
  "browsers": {
    "chromium": {
      "enabled": true,
      "headless": true,
      "viewport": { "width": 1920, "height": 1080 }
    },
    "firefox": {
      "enabled": true,
      "headless": true,
      "viewport": { "width": 1920, "height": 1080 }
    },
    "webkit": {
      "enabled": false,
      "headless": true,
      "viewport": { "width": 1920, "height": 1080 }
    }
  },
  "testing": {
    "timeout": 30000,
    "retries": 2,
    "workers": 4,
    "outputDir": "./test-results"
  }
}
```

### Advanced Configuration

```json
{
  "visual": {
    "enabled": true,
    "threshold": 0.2,
    "updateSnapshots": false,
    "animations": "disabled"
  },
  "accessibility": {
    "enabled": true,
    "standards": ["wcag2a", "wcag2aa", "wcag21aa"],
    "tags": ["best-practice"]
  },
  "performance": {
    "enabled": true,
    "metrics": ["FCP", "LCP", "FID", "CLS", "TTFB"],
    "thresholds": {
      "FCP": 1800,
      "LCP": 2500,
      "FID": 100,
      "CLS": 0.1,
      "TTFB": 800
    }
  },
  "mobile": {
    "enabled": true,
    "devices": ["iPhone 13", "Pixel 5", "iPad Pro"],
    "orientations": ["portrait", "landscape"]
  }
}
```

### Environment Variables

```bash
# Browser configuration
export CLOI_BROWSER_TESTING_HEADLESS=true
export CLOI_BROWSER_TESTING_TIMEOUT=30000

# Visual testing
export CLOI_VISUAL_THRESHOLD=0.2
export CLOI_VISUAL_UPDATE_SNAPSHOTS=false

# Performance thresholds
export CLOI_PERFORMANCE_FCP_THRESHOLD=1800
export CLOI_PERFORMANCE_LCP_THRESHOLD=2500
```

## Usage

### CLI Usage

```bash
# Run all tests
node src/cli/modular.js browser-test run-tests --path ./tests

# Run tests on specific browsers
node src/cli/modular.js browser-test run-tests --browsers chromium,firefox

# Take screenshot
node src/cli/modular.js browser-test screenshot --url https://example.com --path ./screenshot.png

# Run visual regression test
node src/cli/modular.js browser-test visual-test --url https://example.com --name homepage

# Run accessibility test
node src/cli/modular.js browser-test accessibility-test --url https://example.com

# Run performance test
node src/cli/modular.js browser-test performance-test --url https://example.com

# Test mobile devices
node src/cli/modular.js browser-test mobile-test --url https://example.com --device "iPhone 13"

# Generate test from user flow
node src/cli/modular.js browser-test generate-test --url https://example.com --name "User Registration"

# Install browsers
node src/cli/modular.js browser-test install-browsers

# Update visual snapshots
node src/cli/modular.js browser-test update-snapshots
```

### Programmatic Usage

```javascript
import { pluginManager } from './src/core/plugin-manager/index.js';

// Load the browser testing plugin
const browserPlugin = await pluginManager.loadPlugin('integrations', 'browser-testing');

// Connect to browsers
await browserPlugin.connect();

// Run tests
const testResults = await browserPlugin.execute('run-tests', {
  testPath: './tests',
  browsers: ['chromium', 'firefox'],
  reporter: 'html'
});

// Take screenshot
const screenshot = await browserPlugin.execute('screenshot', {
  url: 'https://example.com',
  path: './homepage.png',
  fullPage: true
});

// Run visual regression test
const visualTest = await browserPlugin.execute('visual-test', {
  url: 'https://example.com',
  name: 'homepage',
  threshold: 0.1
});

// Check accessibility
const accessibilityResults = await browserPlugin.execute('accessibility-test', {
  url: 'https://example.com',
  standards: ['wcag2aa']
});

// Monitor performance
const performanceResults = await browserPlugin.execute('performance-test', {
  url: 'https://example.com',
  metrics: ['FCP', 'LCP', 'CLS']
});
```

## Operations

### Available Operations

- `run-tests` - Execute test suite across browsers
- `create-test` - Create new test file from template
- `screenshot` - Capture page screenshots
- `visual-test` - Perform visual regression testing
- `accessibility-test` - Run accessibility validation
- `performance-test` - Monitor performance metrics
- `mobile-test` - Test mobile device compatibility
- `generate-test` - Generate tests from user flows
- `install-browsers` - Install Playwright browsers
- `update-snapshots` - Update visual test baselines

### Operation Parameters

#### run-tests
```javascript
{
  testPath: './tests',
  browsers: ['chromium', 'firefox'],
  grep: 'login',
  headed: false,
  debug: false,
  reporter: 'html'
}
```

#### screenshot
```javascript
{
  url: 'https://example.com',
  path: './screenshot.png',
  fullPage: true,
  browser: 'chromium'
}
```

#### visual-test
```javascript
{
  url: 'https://example.com',
  name: 'homepage',
  threshold: 0.2
}
```

#### accessibility-test
```javascript
{
  url: 'https://example.com',
  standards: ['wcag2aa'],
  browser: 'chromium'
}
```

#### performance-test
```javascript
{
  url: 'https://example.com',
  metrics: ['FCP', 'LCP'],
  thresholds: { FCP: 1800, LCP: 2500 }
}
```

## Test Templates

### Basic Template

```javascript
import { test, expect } from '@playwright/test';

test('Homepage Test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

### Form Testing Template

```javascript
import { test, expect } from '@playwright/test';

test('Contact Form', async ({ page }) => {
  await page.goto('https://example.com/contact');
  
  // Fill form fields
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="message"]', 'Test message');
  
  // Submit form
  await page.click('[type="submit"]');
  
  // Verify success
  await expect(page).toHaveText('Thank you for your message');
});
```

### Navigation Template

```javascript
import { test, expect } from '@playwright/test';

test('Site Navigation', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Test navigation links
  await page.click('text=About');
  await expect(page).toHaveURL(/.*about.*/);
  
  // Test back navigation
  await page.goBack();
  await expect(page).toHaveURL('https://example.com');
});
```

## Visual Regression Testing

### Setup

1. Create baseline screenshots:
```bash
node src/cli/modular.js browser-test visual-test --url https://example.com --name homepage
```

2. Run visual tests:
```bash
node src/cli/modular.js browser-test run-tests --path ./tests/visual
```

3. Update baselines when UI changes:
```bash
node src/cli/modular.js browser-test update-snapshots
```

### Configuration

```javascript
// playwright.config.js
module.exports = {
  use: {
    // Disable animations for consistent screenshots
    reducedMotion: 'reduce'
  },
  expect: {
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    animations: 'disabled'
  }
};
```

## Accessibility Testing

### WCAG Standards

- **WCAG 2.0 Level A** - Basic accessibility
- **WCAG 2.0 Level AA** - Standard accessibility (recommended)
- **WCAG 2.0 Level AAA** - Enhanced accessibility
- **WCAG 2.1 Level AA** - Modern accessibility standards
- **WCAG 2.2 Level AA** - Latest accessibility standards

### Example Test

```javascript
test('Accessibility - Homepage', async ({ page }) => {
  await page.goto('https://example.com');
  
  const results = await page.evaluate(async () => {
    const axe = await import('axe-core');
    return await axe.run();
  });
  
  expect(results.violations).toHaveLength(0);
});
```

## Performance Testing

### Core Web Vitals

- **First Contentful Paint (FCP)** - Time to first content render
- **Largest Contentful Paint (LCP)** - Time to largest content render  
- **First Input Delay (FID)** - Time to first user interaction
- **Cumulative Layout Shift (CLS)** - Visual stability measure
- **Time to First Byte (TTFB)** - Server response time

### Performance Test Example

```javascript
test('Performance - Homepage', async ({ page }) => {
  await page.goto('https://example.com');
  
  const metrics = await page.evaluate(() => {
    return JSON.stringify(performance.getEntriesByType('navigation')[0]);
  });
  
  const timing = JSON.parse(metrics);
  expect(timing.loadEventEnd - timing.loadEventStart).toBeLessThan(3000);
});
```

## Mobile Testing

### Supported Devices

- **iPhone Models**: iPhone 12, iPhone 13, iPhone 14, iPhone SE
- **Android Models**: Pixel 5, Pixel 6, Galaxy S21, Galaxy S22
- **Tablets**: iPad Pro, iPad Air, Galaxy Tab
- **Desktop**: Various screen sizes and resolutions

### Mobile Test Example

```javascript
test('Mobile - iPhone 13', async ({ page, context }) => {
  // Set iPhone 13 viewport
  await page.setViewportSize({ width: 390, height: 844 });
  
  await page.goto('https://example.com');
  
  // Test mobile navigation
  await page.click('[data-mobile-menu]');
  await expect(page.locator('[data-mobile-nav]')).toBeVisible();
});
```

## Test Generation

### From User Actions

```javascript
const actions = [
  { type: 'navigate', url: 'https://example.com/login' },
  { type: 'fill', selector: '[name="email"]', value: 'test@example.com' },
  { type: 'fill', selector: '[name="password"]', value: 'password123' },
  { type: 'click', selector: '[type="submit"]' },
  { type: 'wait', selector: '.dashboard' }
];

await browserPlugin.execute('generate-test', {
  name: 'User Login Flow',
  url: 'https://example.com/login',
  actions: actions
});
```

## Browser Configuration

### Chromium Options

```javascript
{
  headless: true,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  args: [
    '--disable-web-security',
    '--disable-features=TranslateUI',
    '--no-first-run'
  ]
}
```

### Firefox Options

```javascript
{
  headless: true,
  viewport: { width: 1920, height: 1080 },
  firefoxUserPrefs: {
    'media.navigator.streams.fake': true,
    'media.navigator.permission.disabled': true
  }
}
```

### WebKit Options

```javascript
{
  headless: true,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
}
```

## Reports and Artifacts

### HTML Report

```bash
# Generate HTML report
npx playwright test --reporter=html

# Open report
npx playwright show-report
```

### JSON Report

```bash
# Generate JSON report
npx playwright test --reporter=json --output-file=results.json
```

### JUnit Report

```bash
# Generate JUnit report for CI/CD
npx playwright test --reporter=junit --output-file=results.xml
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Browser Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install
        
      - name: Run browser tests
        run: node src/cli/modular.js browser-test run-tests
        
      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
```

### GitLab CI

```yaml
browser-tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm ci
    - npx playwright install
    - node src/cli/modular.js browser-test run-tests
  artifacts:
    when: always
    paths:
      - test-results/
    reports:
      junit: test-results/results.xml
```

## Troubleshooting

### Common Issues

#### Browser Installation
```bash
# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

#### Timeout Issues
```javascript
// Increase timeout
test.setTimeout(60000);

// Or in config
{
  timeout: 60000
}
```

#### Headless Mode Issues
```javascript
// Run in headed mode for debugging
{
  headless: false
}
```

#### Screenshot Differences
```bash
# Update all snapshots
node src/cli/modular.js browser-test update-snapshots

# Update specific test snapshots
npx playwright test --update-snapshots visual-tests/
```

### Debug Mode

```bash
# Run with debug
node src/cli/modular.js browser-test run-tests --debug

# Run single test with debug
npx playwright test --debug specific-test.spec.js
```

## Best Practices

### Test Organization

```
tests/
├── e2e/           # End-to-end tests
├── visual/        # Visual regression tests
├── accessibility/ # Accessibility tests
├── performance/   # Performance tests
├── mobile/        # Mobile-specific tests
└── fixtures/      # Test data and utilities
```

### Page Object Model

```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('[name="email"]');
    this.passwordInput = page.locator('[name="password"]');
    this.loginButton = page.locator('[type="submit"]');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### Test Data Management

```javascript
// fixtures/testData.js
export const testUsers = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  user: { email: 'user@example.com', password: 'user123' }
};
```

## Contributing

To contribute to the browser testing plugin:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite: `node src/plugins/integrations/browser-testing/test.js`
5. Submit a pull request

## License

This plugin is part of the Cloi project and is licensed under GPL-3.0.