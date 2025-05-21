/**
 * UI Feedback Module for LLM Operations
 * 
 * Provides progress indicators and animations for potentially lengthy LLM operations.
 */

/**
 * Starts and manages a terminal spinner animation with changing text phrases.
 * Indicates that a potentially long-running operation (like LLM interaction) is in progress.
 * @param {string[]} [customPhrases] - Optional custom phrases to display during thinking
 * @param {boolean} [fixedBottom] - Whether to keep the spinner at the bottom of the terminal
 * @returns {function(): void} - A function to stop the animation and clear the line.
 */
export function startThinking(customPhrases, fixedBottom = false) {
  const defaultPhrases = [
    'Brewing ideas','Cooking up something','Putting it together',
    'Low-key figuring it out','Thoughts are thoughting',
    'Prompt engineering in progress','Summoning tokens',
    'Reasoning like a transformer','Tokens are tokening',
    'Forking the universe','Ctrl+C won\'t help here'
  ];
  
  const phrases = customPhrases || defaultPhrases.sort(() => Math.random() - 0.5);
  let seconds = 0;
  let spinnerFrame = 0;
  let currentPhrase = phrases[0];
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();
  
  const updateDisplay = () => {
    if (fixedBottom) {
      // Save current cursor position
      process.stdout.write('\x1B[s');
      // Move to bottom of terminal
      process.stdout.write('\x1B[999B');
      // Clear the line
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${spinner[spinnerFrame]} ${currentPhrase} (${seconds}s)`);
      // Restore cursor position
      process.stdout.write('\x1B[u');
    } else {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${spinner[spinnerFrame]} ${currentPhrase} (${seconds}s)`);
    }
  };

  // Spinner animation
  const spinnerInterval = setInterval(() => {
    spinnerFrame = (spinnerFrame + 1) % spinner.length;
    updateDisplay();
  }, 80);

  const tick = () => {
    currentPhrase = phrases[Math.floor(seconds / 10) % phrases.length];
    seconds++;
    updateDisplay();
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => {
    clearInterval(id);
    clearInterval(spinnerInterval);
    if (fixedBottom) {
      // Save current cursor position
      process.stdout.write('\x1B[s');
      // Move to bottom of terminal
      process.stdout.write('\x1B[999B');
      // Clear the line
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      // Restore cursor position
      process.stdout.write('\x1B[u');
    } else {
      process.stdout.write('\n');
    }
  };
}

/**
 * Returns thinking phrases specifically for error analysis
 * @returns {string[]} - Array of thinking phrases for analysis
 */
export function getThinkingPhrasesForAnalysis() {
  return [
    'Parsing the error, line by line...',
    'Locating the point of failure...',
    'Trying to make sense of the red text...',
    'This terminal error looks familiar...',
    'Analyzing what went wrong, precisely...',
    'Diagnosing the issue like a seasoned dev...',
    'Unraveling the terminal\'s last cry...',
    'Let\'s see why the shell screamed this time...'
  ].sort(() => Math.random() - 0.5);
}

/**
 * Returns thinking phrases specifically for patch generation
 * @returns {string[]} - Array of thinking phrases for patch generation
 */
export function getThinkingPhrasesForPatch() {
  return [
    'Locating the offending lines...',
    'Composing a surgical code fix...',
    'Patching with precision...',
    'Rewriting history, one `+` at a time...',
    'Turning errors into green text...',
    'Looking for the cleanest possible fix...',
    'Coding like it\'s commit time...',
    'Preparing a fix you can actually `git apply`...',
  ].sort(() => Math.random() - 0.5);
}

/**
 * Returns thinking phrases specifically for code summarization
 * @returns {string[]} - Array of thinking phrases for code summarization
 */
export function getThinkingPhrasesForSummarization() {
  return [
    'Reading the codebase...',
    'Parsing code structures...',
    'Understanding the logic flow...',
    'Extracting core concepts...',
    'Identifying key components...',
    'Mapping functions and relationships...',
    'Distilling essential patterns...',
    'Compressing code into concepts...',
    'Finding the signal in the syntax...',
    'Translating code to human language...'
  ].sort(() => Math.random() - 0.5);
} 