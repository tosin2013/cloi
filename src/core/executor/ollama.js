/**
 * Ollama Executor Module
 * 
 * Handles execution of LLM queries via local Ollama models.
 * Uses the Ollama JavaScript client for direct model interaction.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { BOX } from '../../ui/terminalUI.js';
import boxen from 'boxen';
import { askYesNo } from '../../ui/terminalUI.js';
import { cpus } from 'os';
import ollama from 'ollama';

// Get directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Returns a static list of recommended Ollama models
 * @returns {string[]} - Array of model names
 */
export function getAvailableModels() {
  return [
    'llama3.1:8b',
    'gemma3:4b',
    'gemma3:12b',
    'qwen3:8b',
    'qwen3:14b',
    'phi4:14b',
    'phi4-reasoning:plus'
  ];
}

/**
 * Reads the list of currently installed Ollama models
 * @returns {Promise<string[]>} - Array of installed model names
 */
export async function readModels() {
  try {
    const output = execSync('ollama list', { encoding: 'utf8' });
    
    const models = output
      .split(/\r?\n/)
      .slice(1)                         // drop header line: NAME   SIZE
      .filter(Boolean)
      .map(l => l.split(/\s+/)[0]);    // first token is the model name
    
    return models;
  } catch (error) {
    console.error(chalk.red('Error reading models:'), error.message);
    return [];
  }
}

/**
 * Installs an Ollama model with UI progress feedback
 * @param {string} modelName - Model to install
 * @returns {Promise<boolean>} - True if installation succeeded
 */
export async function installModel(modelName) {
  // Start UI progress indicator
  const downloader = startDownloading(modelName);
  
  try {
    // Use direct ollama CLI call to install the model
    const child = spawn('ollama', ['pull', modelName]);
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      // Extract progress information from Ollama's output
      const progressMatch = output.match(/(\d+%)/);
      if (progressMatch) {
        downloader.updateProgress(chalk.blue(progressMatch[0]));
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      // Extract progress information from Ollama's error output
      const progressMatch = output.match(/(\d+%)/);
      if (progressMatch) {
        downloader.updateProgress(chalk.blue(progressMatch[0]));
      }
    });

    return new Promise((resolve) => {
      child.on('close', (code) => {
        downloader.stop();
        resolve(code === 0);
      });
    });
  } catch (error) {
    downloader.stop();
    console.error(chalk.red(`Failed to install model ${modelName}: ${error.message}`));
    return false;
  }
}

/**
 * Starts a download progress indicator
 * @param {string} modelName - The model being downloaded
 * @returns {{stop: function(): void, updateProgress: function(string): void}} - Controller
 */
export function startDownloading(modelName) {
  let spinnerFrame = 0;
  let progress = '';
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();
  
  const updateDisplay = () => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${spinner[spinnerFrame]} Installing ${modelName}… ${progress}`);
  };

  // Spinner animation
  const spinnerInterval = setInterval(() => {
    spinnerFrame = (spinnerFrame + 1) % spinner.length;
    updateDisplay();
  }, 80);

  const tick = () => {
    updateDisplay();
  };
  tick();
  const id = setInterval(tick, 1000);
  return {
    stop: () => {
      clearInterval(id);
      clearInterval(spinnerInterval);
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    },
    updateProgress: (newProgress) => {
      progress = newProgress;
      updateDisplay();
    }
  };
}

/**
 * Ensures required model is installed
 * @param {string} model - Model name to ensure
 * @returns {Promise<boolean>} - True if successful
 */
export async function ensureModel(model) {
  try {
    // Check if Ollama is installed
    try {
      execSync('which ollama', { stdio: 'ignore' });
    } catch {
      console.error(chalk.red('Ollama CLI not found. Please install Ollama first.'));
      return false;
    }
    
    // Ensure the model exists
    const models = await readModels();
    if (!models.includes(model)) {
      console.log(chalk.yellow(`Model ${model} not found. Installing...`));
      if (!(await installModel(model))) {
        console.error(chalk.red(`Failed to install ${model}. Please install it manually.`));
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`Error ensuring model: ${error.message}`));
    return false;
  }
}

/**
 * Runs a query using Ollama with streaming output
 * @param {string} prompt - The prompt to send
 * @param {string} model - Model to use
 * @param {string} optimizationSet - Optimization preset
 * @param {Function} [onStreamStart] - Optional callback when streaming begins
 * @returns {Promise<string>} - The model's response
 */
export async function queryOllamaStream(prompt, model, optimizationSet = "error_analysis", onStreamStart = null) {
  try {
    await ensureModel(model);

    const cpuThreads = Math.min(8, (cpus()?.length || 2));
    const defaultOptions = {
      temperature: 0.1,
      num_predict: 768,
      num_thread: cpuThreads,
      num_batch: 32,
      mmap: true,
      int8: true,
      f16: false,
      repeat_penalty: 1.0,
      top_k: 40,
      top_p: 0.95,
      cache_mode: "all",
      use_mmap: true,
      use_mlock: true
    };

    // Get optimization set specific options
    const optimizationSets = {
      "error_analysis": { temperature: 0.3, num_predict: 512 },
      "error_determination": { temperature: 0.1, num_predict: 32 },
      "command_generation": { temperature: 0.1, num_predict: 256 },
      "patch_generation": { temperature: 0.1, num_predict: 768 }
    };

    const optSet = optimizationSets[optimizationSet] || optimizationSets["error_analysis"];
    const options = { ...defaultOptions, ...optSet };

    let fullResponse = '';
    const stream = await ollama.chat({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      stream: optimizationSet === "error_analysis",
      options: options
    });

    if (optimizationSet === "error_analysis") {
      let outputBuffer = '';
      let firstChunkReceived = false;
      
      // Notify that streaming has started, if callback provided
      if (typeof onStreamStart === 'function') {
        onStreamStart();
      }

      for await (const chunk of stream) {
        if (!firstChunkReceived) {
          firstChunkReceived = true;
        }
        const content = chunk.message?.content || '';
        if (content) {
          outputBuffer += content;
          // Output in gray with no indentation
          process.stdout.write(chalk.gray(content));
        }
      }
      
      // Print a final newline
      process.stdout.write('\n');
      fullResponse = outputBuffer;
    } else {
      const response = await stream;
      fullResponse = response.message?.content || '';
    }

    return fullResponse;
  } catch (error) {
    console.error(chalk.red(`Error querying model: ${error.message}`));
    throw error;
  }
}

/**
 * Runs a query using Ollama with optimized settings for each prompt type
 * @param {string} prompt - The prompt to send
 * @param {string} model - Model to use
 * @param {string} optimizationSet - Optimization preset
 * @param {Function} [onStreamStart] - Optional callback when streaming begins
 * @returns {Promise<string>} - The model's response
 */
export async function queryOllamaWithTempScript(prompt, model, optimizationSet = "error_analysis", onStreamStart = null) {
  try {
    await ensureModel(model);
    
    // Use the new streaming query function instead of Python executor
    return await queryOllamaStream(prompt, model, optimizationSet, onStreamStart);
  } catch (error) {
    console.error(chalk.red(`Error querying model: ${error.message}`));
    throw error;
  }
}

/**
 * Runs a query using Ollama's JS client with structured output
 * @param {string} prompt - The prompt to send
 * @param {string} model - Model to use
 * @param {Object} schema - JSON schema for structured output
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The structured response
 */
export async function queryOllamaStructured(prompt, model, schema, options = {}) {
  await ensureModel(model);

  const cpuThreads = Math.min(8, (cpus()?.length || 2));
  const defaultOptions = {
    temperature: 0.1,
    num_predict: 768,
    num_thread: cpuThreads,
    num_batch: 32,
    mmap: true,
    int8: true,
    f16: false,
    repeat_penalty: 1.0,
    top_k: 40,
    top_p: 0.95,
    cache_mode: "all",
    use_mmap: true,
    use_mlock: true
  };

  const combinedOptions = { ...defaultOptions, ...options };

  try {
    const response = await ollama.chat({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      format: schema,  // Pass the schema to the format parameter
      stream: false,   // Structured outputs don't work with streaming
      options: combinedOptions
    });
    
    return JSON.parse(response.message.content);
  } catch (error) {
    console.error(chalk.red(`Error in structured query: ${error.message}`));
    throw error;
  }
}