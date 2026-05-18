import calendar
from datetime import date, timedelta
from decimal import Decimal

from app.models.subscription import SubscriptionPeriod


def _add_months(d: date, n: int) -> date:
    month = d.month + n
    year = d.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    return d.replace(year=year, month=month, day=1)


def _last_day_of_month(d: date) -> date:
    return d.replace(day=calendar.monthrange(d.year, d.month)[1])


def get_period_dates(period_type: SubscriptionPeriod, today: date) -> tuple[date, date]:
    """Return (start, end) inclusive dates for the given subscription period."""
    if period_type == SubscriptionPeriod.CURRENT_MONTH_REST:
        return today, _last_day_of_month(today)

    next_month_first = _add_months(today, 1)

    if period_type == SubscriptionPeriod.NEXT_MONTH:
        return next_month_first, _last_day_of_month(next_month_first)

    if period_type == SubscriptionPeriod.NEXT_3_MONTHS:
        end_month_first = _add_months(today, 3)  # 3rd month relative to next
        return next_month_first, _last_day_of_month(end_month_first)

    # NEXT_6_MONTHS
    end_month_first = _add_months(today, 6)
    return next_month_first, _last_day_of_month(end_month_first)


def calculate_days_count(scheduled_days: set[int], start_date: date, end_date: date) -> int:
    """Count dates in [start, end] that fall on any of scheduled_days (0=Mon…6=Sun)."""
    if not scheduled_days or start_date > end_date:
        return 0
    total = 0
    current = start_date
    while current <= end_date:
        if current.weekday() in scheduled_days:
            total += 1
        current += timedelta(days=1)
    return total


def calculate_subscription_price(
    base_rate_per_day: Decimal,
    scheduled_days: set[int],
    period_type: SubscriptionPeriod,
    today: date,
    pending_credits: Decimal,
) -> tuple[date, date, int, Decimal, Decimal, Decimal]:
    """
    Returns (period_start, period_end, days_count, gross_amount, discount_amount, total_amount).
    discount_amount is capped at gross_amount so total never goes below zero.
    """
    start, end = get_period_dates(period_type, today)
    days = calculate_days_count(scheduled_days, start, end)
    gross = base_rate_per_day * days
    discount = min(pending_credits, gross)
    total = gross - discount
    return start, end, days, gross, discount, total