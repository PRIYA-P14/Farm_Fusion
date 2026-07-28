"""Notification service — Alerts and notifications for farmers."""


class NotificationService:
    async def send_weather_alert(self, farmer_id: str, alert: dict) -> bool:
        # TODO: Send weather alert via SMS/email/push
        pass

    async def send_market_alert(self, farmer_id: str, alert: dict) -> bool:
        # TODO: Send market price alert
        pass

    async def send_scheme_notification(self, farmer_id: str, scheme: dict) -> bool:
        # TODO: Notify about new government schemes
        pass
