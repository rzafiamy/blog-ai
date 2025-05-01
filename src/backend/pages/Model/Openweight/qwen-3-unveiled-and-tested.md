---
title: Qwen 3 unveiled and tested
author: rzl
image: https://camo.githubusercontent.com/8793b3b4014d538b367ec8819dcca85e79cb8d910c808fa7849e3cd85e2ebe79/68747470733a2f2f7169616e77656e2d7265732e6f73732d616363656c65726174652d6f766572736561732e616c6979756e63732e636f6d2f6c6f676f5f7177656e332e706e67
date: 2025-05-01
---
![Qwen 3 Logo](https://upload.wikimedia.org/wikipedia/commons/6/6e/Qwen_logo.png)

> “Think deeper, act faster.” — Qwen 3 tagline

## 🧠 Introduction

Alibaba has officially unveiled **Qwen 3**, its most advanced open-source large language model (LLM) to date. This release marks a significant leap in AI innovation, introducing hybrid reasoning capabilities that aim to rival, and in some benchmarks surpass, models from OpenAI and Google. 

## 🚀 Key Features

- **Hybrid Reasoning Modes**: Seamless switching between "thinking" mode for complex tasks and "non-thinking" mode for general-purpose interactions. 
- **Model Variants**:
  - *Dense Models*: 0.6B, 1.7B, 4B, 8B, 14B, 32B parameters.
  - *Mixture-of-Experts (MoE) Models*: 30B-A3B, 235B-A22B. 
- **Multilingual Support**: Trained on 36 trillion tokens across 119 languages and dialects. 
- **Extended Context Window**: Supports up to 128K tokens for most models. 

## 📊 Benchmark Performance

Qwen 3 models have demonstrated impressive results:

- **Qwen3-235B-A22B**: Outperforms OpenAI's o3-mini and Google's Gemini 2.5 Pro in coding and math benchmarks. 
- **Qwen3-32B**: Surpasses OpenAI's o1 model in several evaluations, including LiveCodeBench. 

![Benchmark Comparison](https://upload.wikimedia.org/wikipedia/commons/3/3f/Qwen3_benchmark.png)

## 🔧 Installation & Usage

To get started with Qwen 3:

```bash
# Clone the repository
git clone https://github.com/QwenLM/Qwen3.git
cd Qwen3

# Install dependencies
pip install -r requirements.txt

# Run the model
python run_model.py --model qwen3-14b
```

For more detailed instructions, refer to the [official GitHub repository](https://github.com/QwenLM/Qwen3).

## 📚 Code Example

Here's a simple Python snippet to interact with the Qwen 3 model:

```python
from qwen import QwenModel

# Initialize the model
model = QwenModel("qwen3-14b")

# Generate a response
response = model.generate("Explain the theory of relativity.")
print(response)
```

## 📈 Performance Metrics

| Model             | Parameters | Context Length | Languages Supported | Benchmark Highlights             |
| | | | |

## 🎧 Audio Sample
<audio controls class="w-full mt-2 rounded border border-lemur-green shadow">
  <source src="/media/example.mp3" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>
