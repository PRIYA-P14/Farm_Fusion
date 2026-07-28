# Installation Guide

## Prerequisites
- Python 3.10+
- PostgreSQL
- Git

## Setup

```bash
git clone https://github.com/PRIYA-P14/Farm_Fusion.git
cd AgriVerse-AI
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python main.py
```

## Environment Variables
See `.env.example` for all required variables.
