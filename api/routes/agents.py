"""Agents route — Query individual or all agents."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_agents():
    # TODO: Return list of registered agents
    pass


@router.post("/query")
async def query_agent(agent_name: str, query: str):
    # TODO: Route query to specified agent
    pass


@router.post("/query/all")
async def query_all_agents(query: str):
    # TODO: Broadcast query to all agents
    pass
