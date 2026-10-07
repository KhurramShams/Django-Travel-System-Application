"""Serializers for Dashboard Analytics and Central Master Ledger."""

from rest_framework import serializers


class SecondaryMetricsSerializer(serializers.Serializer):
    bank_liquidity = serializers.CharField()
    active_packages = serializers.IntegerField()
    issued_tickets_count = serializers.IntegerField()
    hotel_bookings_count = serializers.IntegerField()


class DashboardMetricsSerializer(serializers.Serializer):
    total_customers = serializers.IntegerField()
    received_amount = serializers.CharField()
    remaining_amount = serializers.CharField()
    today_expense = serializers.CharField()
    secondary = SecondaryMetricsSerializer()


class MonthlyCashflowItemSerializer(serializers.Serializer):
    month = serializers.CharField()
    label = serializers.CharField()
    inflow = serializers.FloatField()
    outflow = serializers.FloatField()
    net_margin = serializers.FloatField()


class PackageOccupancyItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    package_code = serializers.CharField()
    capacity = serializers.IntegerField()
    enrolled = serializers.IntegerField()
    occupancy_rate = serializers.FloatField()
    departure_date = serializers.CharField(allow_null=True)


class ReceivablesStatusItemSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    amount = serializers.CharField()


class ReceivablesBreakdownSerializer(serializers.Serializer):
    paid = ReceivablesStatusItemSerializer()
    partial = ReceivablesStatusItemSerializer()
    unpaid = ReceivablesStatusItemSerializer()
    total_active_enrollments = serializers.IntegerField()


class LedgerEntrySerializer(serializers.Serializer):
    id = serializers.CharField()
    timestamp = serializers.CharField()
    date = serializers.CharField()
    source_module = serializers.CharField()
    description = serializers.CharField()
    transaction_type = serializers.CharField()
    amount = serializers.CharField()
    payment_mode = serializers.CharField(allow_null=True, required=False)
    account_or_bank = serializers.CharField(allow_null=True, required=False)
    party_name = serializers.CharField(allow_null=True, required=False)
    recorded_by = serializers.CharField(allow_null=True, required=False)
