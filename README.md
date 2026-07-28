# AgriVerse-AI 🌾

An AI Multi-Agent Agriculture System built for the **AgentVerse Hackathon**.

AgriVerse-AI leverages multiple specialized AI agents to provide comprehensive agricultural intelligence — covering weather, crop management, soil health, market trends, government schemes, and resource optimization.

---

## 🤖 Agents

| Agent | Responsibility |
|---|---|
| `weather_agent` | Real-time weather forecasting & alerts |
| `crop_agent` | Crop recommendation & disease detection |
| `soil_agent` | Soil health analysis & fertilizer advice |
| `market_agent` | Market price trends & demand forecasting |
| `government_agent` | Government schemes & subsidy information |
| `resource_agent` | Water, energy & resource optimization |

---

## 🏗️ Architecture

- **Orchestrator** coordinates all agents and routes queries
- **FastAPI** backend with RESTful endpoints
- **LLM-powered** agents using prompt templates
- **Modular** services and repositories for clean separation

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/PRIYA-P14/Farm_Fusion.git
cd AgriVerse-AI

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run the application
python main.py
```

---

## 📁 Project Structure

```
AgriVerse-AI/
├── agents/          # Individual AI agents
├── orchestrator/    # Multi-agent orchestrator
├── models/          # Data models
├── services/        # Business logic services
├── api/             # FastAPI routes & schemas
├── ai/              # LLM client & prompt templates
├── tools/           # Agent tools & utilities
├── datasets/        # Raw & processed datasets
├── database/        # DB connection & repositories
├── frontend/        # HTML templates & static files
├── tests/           # Unit & integration tests
├── config/          # Configuration files
└── docs/            # Documentation
```

---

## 🛠️ Tech Stack

- **Python 3.10+**
- **FastAPI** — REST API framework
- **LangChain / OpenAI** — LLM integration
- **SQLAlchemy** — ORM
- **Pydantic** — Data validation
- **Pytest** — Testing

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
