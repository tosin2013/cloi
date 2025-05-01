"""
Ollama Setup Script for Phi Model
---------------------------------
This script handles the installation, setup, and management of Ollama with the Phi model
for completely local LLM inference.
"""
import os
import sys
import platform
import subprocess
import requests
import time
import json
import shutil
import argparse
from typing import Optional, Dict, Any, List, Tuple, Union

class OllamaSetup:
    """Handles Ollama installation, service management, and model management"""
    
    def __init__(self, model_name: str = "phi4"):
        """
        Initialize the Ollama setup handler
        
        Args:
            model_name: Name of the model to use (default: phi4)
        """
        self.model_name = model_name
        self.system = platform.system().lower()
        self.ollama_url = "http://localhost:11434"
        
    def check_installation(self) -> bool:
        """Check if Ollama is installed on the system"""
        return shutil.which('ollama') is not None

    def install_ollama(self) -> bool:
        """Install Ollama based on the operating system"""
        print("Ollama not found. Installing Ollama...")
        
        if self.system == "linux":
            try:
                # Check if curl is installed
                if not shutil.which('curl'):
                    print("curl is required but not installed. Installing curl...")
                    subprocess.run("sudo apt-get update && sudo apt-get install -y curl", shell=True, check=True)
                
                print("Installing Ollama on Linux...")
                subprocess.run(
                    "curl -fsSL https://ollama.com/install.sh | sh",
                    shell=True, check=True
                )
                print("Ollama installed successfully on Linux")
                return True
            except subprocess.CalledProcessError as e:
                print(f"Failed to install Ollama on Linux: {e}")
                print("Please try manual installation:")
                print("1. curl -fsSL https://ollama.com/install.sh | sh")
                print("2. Or visit https://ollama.com for alternative installation methods")
                return False
                
        elif self.system == "darwin":  # macOS
            try:
                print("Installing Ollama on macOS...")
                
                # Check if Homebrew is installed
                if shutil.which('brew'):
                    print("Using Homebrew to install Ollama...")
                    subprocess.run("brew install ollama", shell=True, check=True)
                else:
                    # Using the official install script for macOS
                    subprocess.run(
                        "curl -fsSL https://ollama.com/install.sh | sh",
                        shell=True, check=True
                    )
                
                print("Ollama installed successfully on macOS")
                return True
            except subprocess.CalledProcessError as e:
                print(f"Failed to install Ollama on macOS: {e}")
                print("Please try manual installation:")
                print("1. If you have Homebrew: brew install ollama")
                print("2. Download from https://ollama.com")
                return False
        else:
            print(f"Unsupported operating system: {self.system}")
            print("Please install Ollama manually from https://ollama.com")
            return False

    def check_service_running(self) -> bool:
        """Check if Ollama service is running"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False

    def start_service(self) -> bool:
        """Start the Ollama service"""
        print("Starting Ollama service...")
        
        # Check if service is already running
        if self.check_service_running():
            print("Ollama service is already running")
            return True
        
        # Start Ollama service
        if self.system in ["linux", "darwin"]:
            with open("ollama_service.log", "w") as log_file:
                process = subprocess.Popen(
                    ["ollama", "serve"],
                    stdout=log_file, 
                    stderr=log_file
                )
        
        # Wait for the service to start
        print("Waiting for Ollama service to start...")
        for i in range(15):  # Try 15 times with 2-second delays
            if i > 0 and i % 5 == 0:
                print(f"Still waiting... ({i*2} seconds)")
            if self.check_service_running():
                print("Ollama service is running")
                return True
            time.sleep(2)
        
        print("Failed to start Ollama service. Check the logs in ollama_service.log")
        print("You can try starting it manually with 'ollama serve' in a separate terminal")
        return False

    def list_models(self) -> List[str]:
        """List available models in Ollama"""
        try:
            result = subprocess.run(
                ["ollama", "list"], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True,
                check=True
            )
            
            # Parse the models from output
            models = []
            for line in result.stdout.splitlines():
                if line and not line.startswith("NAME"):  # Skip header
                    parts = line.split()
                    if parts:
                        models.append(parts[0])
            return models
        except subprocess.SubprocessError:
            return []

    def pull_model(self) -> bool:
        """Pull the specified model from Ollama"""
        print(f"Checking for {self.model_name} model...")
        
        # Check if model already exists
        if self.model_name in self.list_models():
            print(f"{self.model_name} model is already downloaded")
            return True
            
        print(f"Pulling the {self.model_name} model... This may take several minutes.")
        print("(Most Phi models are 4-5GB in size)")
        
        try:
            # Pull the model with progress output
            process = subprocess.Popen(
                ["ollama", "pull", self.model_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Print progress
            for line in iter(process.stdout.readline, ''):
                print(line.strip())
                if not line:
                    break
                    
            process.stdout.close()
            return_code = process.wait()
            
            if return_code == 0:
                print(f"{self.model_name} model pulled successfully")
                return True
            else:
                print(f"Failed to pull {self.model_name} model. Return code: {return_code}")
                return False
        except subprocess.SubprocessError as e:
            print(f"Error pulling {self.model_name} model: {e}")
            return False

    def delete_model(self, model_name: str) -> bool:
        """Delete a model from Ollama"""
        print(f"Deleting {model_name} model...")
        
        try:
            result = subprocess.run(
                ["ollama", "rm", model_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            print(f"{model_name} model deleted successfully")
            return True
        except subprocess.SubprocessError as e:
            print(f"Error deleting {model_name} model: {e}")
            return False

    def query_model(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send a prompt to the local Ollama API and get a response.
        
        Args:
            prompt: The prompt to send to the model
            options: Optional parameters for the model (temperature, etc)
            
        Returns:
            Dict containing the model's response and metadata
        """
        url = f"{self.ollama_url}/api/generate"
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": True  # Enable streaming
        }
        
        # Add options if provided
        if options:
            payload["options"] = options
        
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = requests.post(url, json=payload, timeout=120, stream=True)
                response.raise_for_status()
                
                # Process streaming response
                full_response = ""
                for line in response.iter_lines():
                    if line:
                        try:
                            json_response = json.loads(line)
                            if "response" in json_response:
                                full_response += json_response["response"]
                            if json_response.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
                
                return {"response": full_response}
                
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    print(f"Connection attempt {attempt + 1} failed: {e}")
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    return {"error": f"Error communicating with Ollama API: {str(e)}"}

    def ensure_setup(self) -> bool:
        """
        Ensure Ollama is installed, running, and the model is available.
        Returns True if setup is successful, False otherwise.
        """
        # Check operating system compatibility
        if self.system not in ["linux", "darwin"]:
            print(f"This script supports Linux and macOS only. Detected system: {platform.system()}")
            print("Please install Ollama manually from https://ollama.com")
            return False
            
        print(f"Running on {platform.system()} {platform.release()}")
        
        # Check if Ollama is installed
        if not self.check_installation():
            # Install Ollama if not installed
            if not self.install_ollama():
                print("Failed to install Ollama. Please install manually and try again.")
                return False
        else:
            print("Ollama is already installed")
        
        # Start Ollama service
        if not self.start_service():
            print("Failed to start Ollama service. Please start it manually and try again.")
            return False
        
        # Pull model if needed
        if not self.pull_model():
            print(f"Failed to pull the {self.model_name} model. Please try again later.")
            return False
            
        return True
        
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ollama Setup and Model Management")
    parser.add_argument("--model", type=str, default="phi4", help="Model name to use")
    parser.add_argument("--pull", action="store_true", help="Pull the specified model")
    parser.add_argument("--delete", action="store_true", help="Delete the specified model")
    args = parser.parse_args()
    
    ollama = OllamaSetup(model_name=args.model)
    
    if args.pull:
        if not ollama.ensure_setup():
            sys.exit(1)
        if not ollama.pull_model():
            sys.exit(1)
    elif args.delete:
        if not ollama.delete_model(args.model):
            sys.exit(1)
    else:
        if not ollama.ensure_setup():
            sys.exit(1)
        