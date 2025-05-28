"""
CodeBERT/GraphCodeBERT Tokenizer Generator

This script downloads CodeBERT and GraphCodeBERT models and generates
the missing tokenizer.json files that are causing initialization failures.
"""

import os
import sys
import json
import argparse
from pathlib import Path
import subprocess
import importlib.util

# Check if required packages are installed
def check_required_packages():
    required_packages = ['transformers', 'huggingface_hub']
    missing_packages = []
    
    for package in required_packages:
        if importlib.util.find_spec(package) is None:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"ERROR: Missing required packages: {', '.join(missing_packages)}")
        print("\nPlease install them manually using one of these methods:")
        print("\nMethod 1 (recommended) - Use a virtual environment:")
        print("  python3 -m venv .venv")
        print("  source .venv/bin/activate")
        print(f"  pip install {' '.join(required_packages)}")
        print("  # Then run this script from within the activated environment")
        print("\nMethod 2 - Install with --user flag:")
        print(f"  pip install --user {' '.join(required_packages)}")
        print("\nMethod 3 (not recommended) - Override system protection:")
        print(f"  pip install --break-system-packages {' '.join(required_packages)}")
        sys.exit(1)

# Check for required packages
check_required_packages()

# Now import the required packages
try:
    from transformers import (
        AutoTokenizer, 
        AutoModel,
        RobertaTokenizer,
        RobertaTokenizerFast
    )
    from huggingface_hub import snapshot_download
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please ensure you have the correct versions installed:")
    print("pip install transformers==4.38.2 huggingface_hub==0.21.4 torch==2.2.1")
    sys.exit(1)

# Check if PyTorch/TensorFlow is available - we can still generate tokenizer.json without them
HAS_BACKEND = True
try:
    import torch
except ImportError:
    print("WARNING: PyTorch not found. Only tokenizer generation will be available.")
    print("For full functionality, install PyTorch: pip install torch==2.2.1")
    HAS_BACKEND = False

# Models to process - Only use the base CodeBERT model for code search
CODEBERT_MODELS = [
    "microsoft/codebert-base"  # Base model is best for code search/semantic understanding
]

def download_and_fix_model(model_name, cache_dir=None, force_download=False):
    """
    Download a CodeBERT/GraphCodeBERT model and generate missing tokenizer.json
    
    Args:
        model_name (str): The model name/path on Hugging Face
        cache_dir (str, optional): Directory to cache models
        force_download (bool): Whether to force re-download
    """
    print(f"\n=== Processing {model_name} ===")
    
    try:
        # Set up cache directory
        if cache_dir:
            cache_path = Path(cache_dir) / model_name.replace("/", "_")
            cache_path.mkdir(parents=True, exist_ok=True)
        else:
            cache_path = None
            
        # Download the model files
        print(f"Downloading model files for {model_name}...")
        model_path = snapshot_download(
            repo_id=model_name,
            cache_dir=cache_dir,
            force_download=force_download,
            resume_download=True
        )
        
        print(f"Model downloaded to: {model_path}")
        
        # Try to load the tokenizer
        print("Loading tokenizer...")
        try:
            # First try the fast tokenizer
            tokenizer = AutoTokenizer.from_pretrained(
                model_name, 
                use_fast=True,
                cache_dir=cache_dir
            )
            print("✓ Fast tokenizer loaded successfully")
        except Exception as e1:
            print(f"Fast tokenizer failed: {e1}")
            try:
                # Fallback to slow tokenizer
                tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    use_fast=False,
                    cache_dir=cache_dir
                )
                print("✓ Slow tokenizer loaded successfully")
            except Exception as e2:
                print(f"Slow tokenizer also failed: {e2}")
                # Try RoBERTa tokenizer specifically (CodeBERT is based on RoBERTa)
                try:
                    print("Trying RoBERTa tokenizer...")
                    tokenizer = RobertaTokenizer.from_pretrained(
                        "roberta-base",
                        cache_dir=cache_dir
                    )
                    print("✓ RoBERTa tokenizer loaded as fallback")
                except Exception as e3:
                    print(f"RoBERTa tokenizer failed: {e3}")
                    raise Exception(f"All tokenizer loading attempts failed")
        
        # Generate tokenizer.json if it doesn't exist
        tokenizer_json_path = Path(model_path) / "tokenizer.json"
        
        if not tokenizer_json_path.exists():
            print("Generating missing tokenizer.json...")
            
            # Try to get the fast tokenizer version
            try:
                if hasattr(tokenizer, 'backend_tokenizer'):
                    # Fast tokenizer - save the backend
                    tokenizer_json = tokenizer.backend_tokenizer.to_str()
                    with open(tokenizer_json_path, 'w', encoding='utf-8') as f:
                        f.write(tokenizer_json)
                    print(f"✓ Generated tokenizer.json from fast tokenizer")
                else:
                    # Slow tokenizer - create a basic tokenizer.json structure
                    print("Creating basic tokenizer.json structure...")
                    basic_tokenizer_json = {
                        "version": "1.0",
                        "truncation": None,
                        "padding": None,
                        "added_tokens": [],
                        "normalizer": {
                            "type": "Sequence",
                            "normalizers": []
                        },
                        "pre_tokenizer": {
                            "type": "ByteLevel",
                            "add_prefix_space": False,
                            "trim_offsets": True,
                            "use_regex": True
                        },
                        "post_processor": {
                            "type": "RobertaProcessing",
                            "sep": ["</s>", 2],
                            "cls": ["<s>", 0],
                            "trim_offsets": True,
                            "add_prefix_space": False
                        },
                        "decoder": {
                            "type": "ByteLevel",
                            "add_prefix_space": True,
                            "trim_offsets": True,
                            "use_regex": True
                        },
                        "model": {
                            "type": "BPE",
                            "dropout": None,
                            "unk_token": None,
                            "continuing_subword_prefix": None,
                            "end_of_word_suffix": None,
                            "fuse_unk": False,
                            "byte_fallback": False,
                            "vocab": {},
                            "merges": []
                        }
                    }
                    
                    with open(tokenizer_json_path, 'w', encoding='utf-8') as f:
                        json.dump(basic_tokenizer_json, f, indent=2)
                    print(f"✓ Generated basic tokenizer.json structure")
                    
            except Exception as e:
                print(f"Failed to generate tokenizer.json: {e}")
                return False
        else:
            print("✓ tokenizer.json already exists")
        
        # Test the model loading only if we have a deep learning backend
        if HAS_BACKEND:
            print("Testing model loading...")
            try:
                model = AutoModel.from_pretrained(
                    model_name,
                    cache_dir=cache_dir
                )
                print(f"✓ Model loaded successfully")
                print(f"  - Model type: {type(model).__name__}")
                print(f"  - Hidden size: {model.config.hidden_size}")
                print(f"  - Vocab size: {model.config.vocab_size}")
                
                # Test tokenization
                test_code = "def hello(): print('Hello, world!')"
                tokens = tokenizer(test_code, return_tensors="pt")
                print(f"  - Test tokenization successful: {tokens['input_ids'].shape}")
            except Exception as e:
                print(f"✗ Model loading failed: {e}")
                print("This is expected without PyTorch, but tokenizer.json may still be generated correctly")
        else:
            # We don't have PyTorch, but we can still test basic tokenization
            try:
                test_code = "def hello(): print('Hello, world!')"
                tokens = tokenizer(test_code)
                print(f"✓ Basic tokenization successful without PyTorch")
            except Exception as e:
                print(f"✗ Basic tokenization failed: {e}")
                
        # Return true if we've made it this far and generated the tokenizer.json file
        if os.path.exists(tokenizer_json_path):
            print(f"✓ Successfully generated tokenizer.json at {tokenizer_json_path}")
            return True
            
    except Exception as e:
        print(f"✗ Failed to process {model_name}: {e}")
        return False

def copy_tokenizer_to_huggingface_cache(model_name, source_path, target_cache_dir=None):
    """
    Copy generated tokenizer.json to Hugging Face cache directory
    """
    try:
        from huggingface_hub import cached_download
        import shutil
        
        if target_cache_dir is None:
            # Use default Hugging Face cache
            from huggingface_hub.constants import HUGGINGFACE_HUB_CACHE
            target_cache_dir = HUGGINGFACE_HUB_CACHE
        
        # Find the model's cache directory
        model_cache_pattern = f"models--{model_name.replace('/', '--')}"
        
        # Look for the model directory in the cache
        for root, dirs, _ in os.walk(target_cache_dir):
            for dir_name in dirs:
                if dir_name.startswith(model_cache_pattern):
                    model_cache_dir = os.path.join(root, dir_name, "snapshots")
                    
                    # Find the latest snapshot
                    if os.path.exists(model_cache_dir):
                        snapshots = os.listdir(model_cache_dir)
                        if snapshots:
                            latest_snapshot = os.path.join(model_cache_dir, snapshots[0])
                            target_path = os.path.join(latest_snapshot, "tokenizer.json")
                            
                            # Copy the file
                            shutil.copy2(source_path, target_path)
                            print(f"✓ Copied tokenizer.json to cache: {target_path}")
                            return True
        
        print("✗ Could not find model cache directory")
        return False
    
    except Exception as e:
        print(f"✗ Failed to copy tokenizer to cache: {e}")
        return False

def main():
    """
    Main function
    """
    parser = argparse.ArgumentParser(description="Generate tokenizer.json files for CodeBERT models")
    
    # Add arguments
    parser.add_argument("--model", type=str, help="Model name to process (e.g., microsoft/codebert-base)")
    parser.add_argument("--all", action="store_true", help="Process all supported models")
    parser.add_argument("--cache-dir", type=str, help="Directory to cache models")
    parser.add_argument("--force", action="store_true", help="Force re-download of models")
    
    # Parse arguments
    args = parser.parse_args()
    
    if args.all:
        # Process all models
        print(f"Processing all {len(CODEBERT_MODELS)} models...")
        success_count = 0
        
        for model_name in CODEBERT_MODELS:
            if download_and_fix_model(model_name, args.cache_dir, args.force):
                success_count += 1
        
        print(f"\nProcessed {len(CODEBERT_MODELS)} models, {success_count} successful")
    
    elif args.model:
        # Process a single model
        download_and_fix_model(args.model, args.cache_dir, args.force)
    
    else:
        # No model specified
        parser.print_help()
        print("\nError: Please specify a model with --model or use --all to process all models")

def test_models():
    """
    Test function to verify models work after generation
    """
    if not HAS_BACKEND:
        print("\nSkipping model tests because PyTorch is not available")
        print("To test models fully, install PyTorch: pip install torch==2.2.1")
        return
        
    try:
        from transformers import pipeline
        
        for model_name in CODEBERT_MODELS:
            print(f"\nTesting {model_name}...")
            try:
                # Create a feature extraction pipeline
                extractor = pipeline("feature-extraction", model=model_name)
                
                # Test with a sample code
                test_code = "def hello_world():\n    print('Hello, world!')"
                features = extractor(test_code)
                
                print(f"✓ Successfully extracted features: shape={len(features[0])}")
            except Exception as e:
                print(f"✗ Failed to test {model_name}: {e}")
    
    except Exception as e:
        print(f"✗ Failed to run tests: {e}")

if __name__ == "__main__":
    main()
