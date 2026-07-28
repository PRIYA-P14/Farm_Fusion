# AgriVerse-AI Architecture

## Overview
AgriVerse-AI uses a multi-agent architecture where each agent specializes in a domain of agricultural intelligence.

## Components

### Orchestrator
Routes incoming queries to the appropriate agent(s) based on intent classification.

### Agents
| Agent | Domain |
|---|---|
| WeatherAgent | Weather forecasting & alerts |
| CropAgent | Crop recommendation & disease detection |
| SoilAgent | Soil health & fertilizer advice |
| MarketAgent | Market prices & demand forecasting |
| GovernmentAgent | Schemes, subsidies & policies |
| ResourceAgent | Water, energy & resource optimization |

### Data Flow
```
User Query → API → Orchestrator → Agent(s) → LLM + Tools → Response
```
