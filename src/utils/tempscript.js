/**
 * Temporary Python Script Module
 * 
 * Facilitates communication with Ollama language models via Python.
 * This module creates a temporary Python script with optimized settings
 * for efficient LLM interactions. The approach allows for better performance
 * configuration and processing than direct JS-to-Ollama communication,
 * particularly for complex prompts and responses.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Template for the Python script with optimized settings
export const PYTHON_SCRIPT_TEMPLATE = `
import sys
import os

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ollama_call import OllamaSetup
from optimization import LLMOptimizer

def analyze_error(prompt, model_name, optimization_set="error_analysis"):
    # Initialize Ollama
    ollama = OllamaSetup(model_name=model_name)
    if not ollama.ensure_setup():
        return "Error: Failed to setup Ollama"
    
    # Get optimized options for maximum performance
    options = LLMOptimizer.get_optimized_options(
        input_length=len(prompt),
        deterministic=False,
        use_quantization=True
    )
    
    # Add performance-focused optimizations based on the optimization set
    optimization_sets = {
        "error_analysis": {
            "temperature": 0.3,
            "num_predict": 512,
            "num_thread": min(8, os.cpu_count() or 2),
            "num_batch": 32,
            "mmap": True,
            "int8": True,
            "f16": False,
            "repeat_penalty": 1.0,
            "top_k": 10,
            "top_p": 0.9,
            "cache_mode": "all",
            "use_mmap": True,
            "use_mlock": True,
            "block_size": 32,
            "per_block_scales": [1.0],
            "zero_points": [0]
        },
        "error_determination": {
            "temperature": 0.1,
            "num_predict": 32,
            "num_thread": min(8, os.cpu_count() or 2),
            "num_batch": 32,
            "mmap": True,
            "int8": True,
            "f16": False,
            "repeat_penalty": 1.0,
            "top_k": 10,
            "top_p": 0.9,
            "cache_mode": "all",
            "use_mmap": True,
            "use_mlock": True
        },
        "command_generation": {
            "temperature": 0.1,
            "num_predict": 256,
            "num_thread": min(8, os.cpu_count() or 2),
            "num_batch": 32,
            "mmap": True,
            "int8": True,
            "f16": False,
            "repeat_penalty": 1.0,
            "top_k": 40,
            "top_p": 0.95,
            "cache_mode": "all",
            "use_mmap": True,
            "use_mlock": True
        },
        "patch_generation": {
            "temperature": 0.1,
            "num_predict": 768,
            "num_thread": min(8, os.cpu_count() or 2),
            "num_batch": 32,
            "mmap": True,
            "int8": True,
            "f16": False,
            "repeat_penalty": 1.0,
            "top_k": 40,
            "top_p": 0.95,
            "cache_mode": "all",
            "use_mmap": True,
            "use_mlock": True
        }
    }
    
    # Get the appropriate optimization set
    opt_set = optimization_sets.get(optimization_set, optimization_sets["error_analysis"])
    options.update(opt_set)
    
    # Query model with optimized settings
    response = ollama.query_model(prompt, options)
    return response.get("response", "No response from model")

if __name__ == "__main__":
    prompt = sys.argv[1]
    model = sys.argv[2]
    optimization_set = sys.argv[3] if len(sys.argv) > 3 else "error_analysis"
    result = analyze_error(prompt, model, optimization_set)
    print("-" * 80)
    print(result)
    print("-" * 80)
`;

/* ───────────────────────── LLM Query Runner ────────────────────────────── */
/**
 * Runs an LLM query using a Python script with optimized settings.
 * Creates a temporary Python script, executes it, and captures the output.
 * 
 * @param {string} prompt - The prompt to send to the LLM
 * @param {string} model - The model name to use (e.g., 'phi4:latest')
 * @param {string} [optimization_set="error_analysis"] - The optimization set to use
 * @returns {Promise<string>} - The LLM response
 */
export async function runLLMWithTempScript(prompt, model, optimization_set = "error_analysis") {
  const tempScriptPath = join(__dirname, 'temp_analyze.py');
  
  try {
    // Write the temporary Python script
    await fs.writeFile(tempScriptPath, PYTHON_SCRIPT_TEMPLATE);
    
    // Run the script with the prompt, model, and optimization set as arguments
    return await new Promise((resolve) => {
      const child = spawn('python3', [tempScriptPath, prompt, model, optimization_set]);
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', async () => {
        try {
          // Clean up the temporary file
          await fs.unlink(tempScriptPath);
        } catch (error) {
          console.error('Error cleaning up temp file:', error);
        }
        
        // Extract the result from between the marker lines
        const match = output.match(/^-{80}\n([\s\S]*?)\n-{80}$/m);
        resolve(match ? match[1].trim() : output.trim());
      });
    });
  } catch (error) {
    // Clean up in case of error
    try {
      await fs.unlink(tempScriptPath);
    } catch {
      // Ignore errors during cleanup
    }
    throw error;
  }
} 