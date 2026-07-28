"""Government service — Schemes, subsidies, and policy information."""


class GovernmentService:
    async def get_schemes(self, state: str, crop_type: str | None = None) -> list:
        # TODO: Fetch government schemes
        pass

    async def get_subsidies(self, state: str, farmer_category: str) -> list:
        # TODO: Fetch subsidy information
        pass

    async def check_eligibility(self, scheme_id: str, farmer_data: dict) -> dict:
        # TODO: Check farmer eligibility for a scheme
        pass
