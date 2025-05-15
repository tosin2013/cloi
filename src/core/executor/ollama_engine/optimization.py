import os
import time
import re
import logging
from typing import Dict, Any, Optional, List
from functools import lru_cache
import orjson  # Replace standard json with orjson for performance

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("optimization")

# Precompile regex patterns
TIMESTAMP_PATTERN = re.compile(r'\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(.\d+)?\]')

class Int8Quantizer:
    """Lightweight 8-bit quantizer optimized for speed"""
    
    def __init__(self, cache_dir=None):
        self.quant_cache = {}
        self.is_initialized = False
        self.cache_dir = cache_dir or os.path.join(os.path.expanduser("~"), ".llm_quantization")
        os.makedirs(self.cache_dir, exist_ok=True)
        
    def initialize(self, ollama_instance, model_name, advanced_mode=False):
        """Simple initialization with minimal overhead"""
        cache_path = os.path.join(self.cache_dir, f"{model_name}_int8_calibration.json")
        
        # Try loading from cache first
        if os.path.exists(cache_path):
            if self.load_calibration_data(model_name, cache_path):
                return True
        
        # Use fixed optimal parameters
        thread_count = max(2, os.cpu_count() or 4)
        
        # Save parameters with optimized values
        self.quant_cache[model_name] = {
            "num_thread": thread_count,
            "num_batch": 32,  # Fixed optimal batch size
            "cache_mode": "all",
            "use_mmap": True,
            "use_mlock": True,
            "int8": True,
            "f16": False
        }
        
        self.is_initialized = True
        self.save_calibration_data(model_name, cache_path)
        return True
    
    def optimize_options(self, options: Optional[Dict[str, Any]], model_name: str) -> Dict[str, Any]:
        """Apply minimal optimizations to model options"""
        if options is None:
            options = {}
        
        # Apply model-specific optimizations
        options_copy = options.copy()
        
        # Enable essential optimizations
        options_copy.update({
            "mmap": True,
            "int8": True,
            "f16": False,
            "cache_mode": "all"
        })
        
        # Add optimized parameters if available
        if model_name in self.quant_cache:
            options_copy.update({
                "num_batch": self.quant_cache[model_name]["num_batch"],
                "num_thread": self.quant_cache[model_name]["num_thread"]
            })
                
        return options_copy
    
    def save_calibration_data(self, model_name: str, filepath: Optional[str] = None) -> str:
        """Save calibration data to file for future use"""
        if model_name not in self.quant_cache:
            raise ValueError(f"Model {model_name} not calibrated")
            
        if filepath is None:
            filepath = f"{model_name}_int8_calibration.json"
            
        data = {
            "model_name": model_name,
            "quant_cache": self.quant_cache[model_name],
            "timestamp": time.time(),
            "version": "1.0"
        }
        
        with open(filepath, 'wb') as f:
            f.write(orjson.dumps(data, option=orjson.OPT_INDENT_2))
            
        return filepath
    
    def load_calibration_data(self, model_name: str, filepath: str) -> bool:
        """Load calibration data from a file"""
        try:
            with open(filepath, 'rb') as f:
                data = orjson.loads(f.read())
                
            if data.get("model_name") == model_name:
                self.quant_cache[model_name] = data["quant_cache"]
                self.is_initialized = True
                logger.info(f"Loaded calibration data for {model_name}")
                return True
            else:
                logger.warning(f"Calibration data mismatch: expected {model_name}, got {data.get('model_name')}")
                return False
        except Exception as e:
            logger.error(f"Error loading calibration data: {e}")
            return False

class QuantizedOllamaWrapper:
    """Lightweight wrapper for Ollama calls with essential optimizations"""
    
    def __init__(self, ollama_instance, model_name):
        self.ollama = ollama_instance
        self.model_name = model_name
        self.quantizer = Int8Quantizer()
        self.is_quantized = False
        self.request_cache = lru_cache(maxsize=100)(self._query_model_uncached)
        
    def enable_quantization(self, advanced_mode=False):
        """Enable quantization with minimal overhead"""
        if not self.is_quantized:
            success = self.quantizer.initialize(self.ollama, self.model_name, advanced_mode)
            self.is_quantized = success
        return self.is_quantized
    
    def _query_model_uncached(self, prompt, options_tuple):
        """Uncached query implementation with minimal overhead"""
        # Convert options tuple back to dict
        options = dict(options_tuple) if options_tuple else {}
        
        # Apply essential optimizations
        opt_options = options.copy()
        opt_options.update({
            "mmap": True,
            "int8": True,
            "f16": False,
            "num_thread": min(4, os.cpu_count() or 2),
            "num_batch": 32,  # Fixed optimal batch size
            "cache_mode": "all"
        })
        
        # Make the optimized API call
        return self.ollama.query_model(prompt, opt_options)
    
    def query_model(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Query the model with minimal overhead"""
        if not self.is_quantized:
            self.enable_quantization()
        
        # Convert options dict to tuple of items for hashing
        options_tuple = tuple(sorted((k, v) for k, v in (options or {}).items() 
                             if k in ['temperature', 'top_p', 'top_k']))
        
        # Use the cached function
        return self.request_cache(prompt, options_tuple)

class LLMOptimizer:
    """Centralized optimization module for LLM calls"""
    
    _last_warmup_time = 0
    _warmup_interval = 300  # 5 minutes
    _quant_cache = {}
    
    @staticmethod
    def initialize_quantization(ollama_instance, model_name: str) -> bool:
        """Initialize quantization with block-wise approach
        
        Args:
            ollama_instance: The Ollama instance to initialize
            model_name: Name of the model to initialize
            
        Returns:
            True if initialization was successful
        """
        try:
            # Use fixed optimal parameters
            thread_count = max(2, os.cpu_count() or 4)
            
            # Save parameters with optimized values
            LLMOptimizer._quant_cache[model_name] = {
                "num_thread": thread_count,
                "num_batch": 32,  # Fixed optimal batch size
                "cache_mode": "all",
                "use_mmap": True,
                "use_mlock": True,
                "int8": True,
                "f16": False,
                "block_size": 32,  # Block size for block-wise quantization
                "per_block_scales": [1.0],  # Initial scale
                "zero_points": [0]  # Initial zero point
            }
            
            return True
        except Exception as e:
            print(f"Warning: Quantization initialization failed: {e}")
            return False
    
    @staticmethod
    def warmup_model(ollama_instance, model_name: str) -> bool:
        """Warm up the model to reduce cold start latency
        
        Args:
            ollama_instance: The Ollama instance to warm up
            model_name: Name of the model to warm up
            
        Returns:
            True if warmup was successful
        """
        current_time = time.time()
        
        # Only warm up if enough time has passed since last warmup
        if current_time - LLMOptimizer._last_warmup_time < LLMOptimizer._warmup_interval:
            return True
            
        try:
            # Initialize quantization if not already done
            if model_name not in LLMOptimizer._quant_cache:
                LLMOptimizer.initialize_quantization(ollama_instance, model_name)
            
            # Use a minimal prompt for warmup
            warmup_prompt = "Warming up model"
            
            # Get optimized options for warmup
            options = LLMOptimizer.get_optimized_options(
                input_length=len(warmup_prompt),
                deterministic=True
            )
            
            # Make a minimal inference
            response = ollama_instance.query_model(warmup_prompt, options)
            
            # Update last warmup time
            LLMOptimizer._last_warmup_time = current_time
            
            return True
        except Exception as e:
            print(f"Warning: Model warmup failed: {e}")
            return False
    
    @staticmethod
    def get_optimized_options(options: Dict[str, Any] = None, 
                            input_length: Optional[int] = None,
                            deterministic: bool = False,
                            use_quantization: bool = True) -> Dict[str, Any]:
        """Get optimized options for the model based on input characteristics
        
        Args:
            options: Base options to enhance
            input_length: Length of input prompt for optimization tuning
            deterministic: Whether to optimize for deterministic output
            use_quantization: Whether to use quantization
            
        Returns:
            Dict with optimized options
        """
        # Start with default options
        opt_options = options.copy() if options else {}
        
        # Base thread count on available CPUs
        cpu_count = os.cpu_count() or 4
        thread_count = min(8, cpu_count)  # Cap at 8 threads
        
        # Scale batch size based on input length and available threads
        if input_length:
            # For very short inputs, use smaller batch size
            if input_length < 100:
                batch_size = min(32, thread_count * 4)  # Smaller batch for short prompts
            # For medium inputs
            elif input_length < 500:
                batch_size = min(64, thread_count * 8)
            # For long inputs
            else:
                batch_size = min(128, thread_count * 16)
        else:
            # Default batch size if input length unknown
            batch_size = 32
        
        # Set quantization parameters
        if use_quantization:
            opt_options.update({
                "int8": True,  # Use int8 quantization
                "f16": False,  # Disable f16
                "block_size": 32,  # Block size for block-wise quantization
                "per_block_scales": [1.0],  # Initial scale
                "zero_points": [0]  # Initial zero point
            })
        
        # Set thread and batch parameters
        opt_options.update({
            "num_thread": thread_count,
            "num_batch": batch_size,
            "mmap": True,      # Memory mapping for better performance
            "cache_mode": "all" # Cache everything for better repeat performance
        })
        
        # Add deterministic settings if needed
        if deterministic:
            opt_options.update({
                "top_k": 1,
                "top_p": 0.1,
                "temperature": 0.0
            })
            
        return opt_options
    
    @staticmethod
    def get_optimized_prompt(prompt: str, max_length: int = 1000) -> str:
        """Optimize prompt for LLM processing
        
        Args:
            prompt: The original prompt
            max_length: Maximum allowed prompt length
            
        Returns:
            Optimized prompt
        """
        # Remove extraneous whitespace
        prompt = prompt.strip()
        
        # Remove timestamps
        prompt = TIMESTAMP_PATTERN.sub('', prompt)
        
        # If prompt is too long, truncate with indicator
        if len(prompt) > max_length:
            # Try to truncate at a natural boundary like a newline
            truncate_point = prompt[:max_length].rfind('\n')
            if truncate_point > max_length // 2:
                return prompt[:truncate_point] + "\n[... truncated ...]"
            else:
                # Fall back to hard truncation
                return prompt[:max_length] + "\n[... truncated ...]"
        
        return prompt 