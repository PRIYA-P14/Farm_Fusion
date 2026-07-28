"""Market route — Market prices and trends."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/prices")
async def get_market_prices(crop_name: str, state: str):
    # TODO: Return current market prices
    pass


@router.get("/forecast")
async def get_price_forecast(crop_name: str, days_ahead: int = 30):
    # TODO: Return price forecast
    pass


@router.get("/best-market")
async def get_best_market(crop_name: str, location: str):
    # TODO: Return best market to sell
    pass
