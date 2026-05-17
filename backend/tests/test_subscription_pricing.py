"""Unit tests for subscription pricing: days_count and period calculation."""

from datetime import date
from decimal import Decimal

import pytest

from app.models.subscription import SubscriptionPeriod
from app.services.pricing_service import (
    calculate_days_count,
    calculate_subscription_price,
    get_period_dates,
)


# ─── get_period_dates ─────────────────────────────────────────────────────────

class TestGetPeriodDates:
    def test_current_month_rest_mid_month(self):
        today = date(2025, 5, 17)
        start, end = get_period_dates(SubscriptionPeriod.CURRENT_MONTH_REST, today)
        assert start == date(2025, 5, 17)
        assert end == date(2025, 5, 31)

    def test_current_month_rest_last_day(self):
        today = date(2025, 5, 31)
        start, end = get_period_dates(SubscriptionPeriod.CURRENT_MONTH_REST, today)
        assert start == end == date(2025, 5, 31)

    def test_current_month_rest_feb_leap(self):
        today = date(2024, 2, 10)
        _, end = get_period_dates(SubscriptionPeriod.CURRENT_MONTH_REST, today)
        assert end == date(2024, 2, 29)

    def test_next_month_normal(self):
        today = date(2025, 5, 17)
        start, end = get_period_dates(SubscriptionPeriod.NEXT_MONTH, today)
        assert start == date(2025, 6, 1)
        assert end == date(2025, 6, 30)

    def test_next_month_december(self):
        today = date(2025, 12, 5)
        start, end = get_period_dates(SubscriptionPeriod.NEXT_MONTH, today)
        assert start == date(2026, 1, 1)
        assert end == date(2026, 1, 31)

    def test_next_3_months(self):
        today = date(2025, 5, 17)
        start, end = get_period_dates(SubscriptionPeriod.NEXT_3_MONTHS, today)
        assert start == date(2025, 6, 1)
        assert end == date(2025, 8, 31)

    def test_next_3_months_crosses_year(self):
        today = date(2025, 10, 1)
        start, end = get_period_dates(SubscriptionPeriod.NEXT_3_MONTHS, today)
        assert start == date(2025, 11, 1)
        assert end == date(2026, 1, 31)

    def test_next_6_months(self):
        today = date(2025, 5, 17)
        start, end = get_period_dates(SubscriptionPeriod.NEXT_6_MONTHS, today)
        assert start == date(2025, 6, 1)
        assert end == date(2025, 11, 30)

    def test_next_6_months_crosses_year(self):
        today = date(2025, 8, 1)
        start, end = get_period_dates(SubscriptionPeriod.NEXT_6_MONTHS, today)
        assert start == date(2025, 9, 1)
        assert end == date(2026, 2, 28)


# ─── calculate_days_count ─────────────────────────────────────────────────────

class TestCalculateDaysCount:
    def test_empty_schedule(self):
        assert calculate_days_count(set(), date(2025, 5, 1), date(2025, 5, 31)) == 0

    def test_start_after_end(self):
        assert calculate_days_count({0}, date(2025, 5, 31), date(2025, 5, 1)) == 0

    def test_mondays_in_may_2025(self):
        # May 2025: Mondays are 5, 12, 19, 26 → 4 Mondays
        count = calculate_days_count({0}, date(2025, 5, 1), date(2025, 5, 31))
        assert count == 4

    def test_mon_wed_fri_in_june_2025(self):
        # June 2025: Mon=2,9,16,23,30; Wed=4,11,18,25; Fri=6,13,20,27 → 5+4+4=13
        count = calculate_days_count({0, 2, 4}, date(2025, 6, 1), date(2025, 6, 30))
        assert count == 13

    def test_single_day_range(self):
        # May 5 2025 = Monday (weekday 0)
        assert calculate_days_count({0}, date(2025, 5, 5), date(2025, 5, 5)) == 1
        assert calculate_days_count({1}, date(2025, 5, 5), date(2025, 5, 5)) == 0

    def test_all_days(self):
        # All 7 days over a full week = 7
        count = calculate_days_count({0, 1, 2, 3, 4, 5, 6}, date(2025, 5, 5), date(2025, 5, 11))
        assert count == 7

    def test_weekends_in_may_2025(self):
        # Saturdays(5) and Sundays(6) in May 2025
        # Sat: 3,10,17,24,31 (5); Sun: 4,11,18,25 (4) → 9
        count = calculate_days_count({5, 6}, date(2025, 5, 1), date(2025, 5, 31))
        assert count == 9


# ─── calculate_subscription_price ────────────────────────────────────────────

class TestCalculateSubscriptionPrice:
    def test_no_credits(self):
        today = date(2025, 5, 17)
        rate = Decimal("300")
        days_set = {0, 2, 4}  # Mon, Wed, Fri
        start, end, days, gross, discount, total = calculate_subscription_price(
            rate, days_set, SubscriptionPeriod.CURRENT_MONTH_REST, today, Decimal("0")
        )
        assert start == date(2025, 5, 17)
        assert end == date(2025, 5, 31)
        # Remaining Mon/Wed/Fri in May from 17th: Mon=19,26; Wed=21,28; Fri=23,30 → 6
        assert days == 6
        assert gross == Decimal("1800")
        assert discount == Decimal("0")
        assert total == Decimal("1800")

    def test_partial_credit(self):
        today = date(2025, 5, 17)
        rate = Decimal("300")
        days_set = {0, 2, 4}
        _, _, days, gross, discount, total = calculate_subscription_price(
            rate, days_set, SubscriptionPeriod.CURRENT_MONTH_REST, today, Decimal("600")
        )
        assert gross == Decimal("1800")
        assert discount == Decimal("600")
        assert total == Decimal("1200")

    def test_credit_exceeds_gross_capped_at_zero(self):
        today = date(2025, 5, 17)
        rate = Decimal("300")
        days_set = {0}  # Only Monday; remaining: 19, 26 → 2 days
        _, _, _, gross, discount, total = calculate_subscription_price(
            rate, days_set, SubscriptionPeriod.CURRENT_MONTH_REST, today, Decimal("9999")
        )
        assert gross == Decimal("600")
        assert discount == Decimal("600")  # capped at gross
        assert total == Decimal("0")

    def test_next_month_pricing(self):
        today = date(2025, 5, 17)
        rate = Decimal("450")
        days_set = {1, 3, 5}  # Tue, Thu, Sat
        start, end, days, gross, _, _ = calculate_subscription_price(
            rate, days_set, SubscriptionPeriod.NEXT_MONTH, today, Decimal("0")
        )
        assert start == date(2025, 6, 1)
        assert end == date(2025, 6, 30)
        # June 2025 Tue: 3,10,17,24; Thu: 5,12,19,26; Sat: 7,14,21,28 → 4+4+4=12
        assert days == 12
        assert gross == Decimal("450") * 12
