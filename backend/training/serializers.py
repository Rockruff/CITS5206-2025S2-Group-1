from rest_framework import serializers
from .models import (
    Department,
    Person,
    Position,
    UserPosition,
    Category,
    UserCategory,
    Training,
    TrainingFieldDef,
    TrainingRecord,
    TrainingRecordFieldValue,
    CategoryTrainingRequirement,
    TrainingEvent,
    TrainingAttendance,
    compute_expiry,
    ExpiryMode,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = "__all__"


class UserPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPosition
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class UserCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCategory
        fields = "__all__"


class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = "__all__"


class TrainingFieldDefSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingFieldDef
        fields = "__all__"


class TrainingRecordFieldValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRecordFieldValue
        fields = "__all__"


class TrainingRecordSerializer(serializers.ModelSerializer):
    # allow nested read; for writes, send list of {field_def, value_*}
    field_values = TrainingRecordFieldValueSerializer(many=True, read_only=True)

    class Meta:
        model = TrainingRecord
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def validate(self, data):
        training = data.get("training") or (self.instance and self.instance.training)
        completed_at = data.get("completed_at") or (
            self.instance and self.instance.completed_at
        )
        if (
            training
            and training.expiry_mode == ExpiryMode.FIXED_DAYS
            and completed_at
            and not data.get("expiry_at")
        ):
            data["expiry_at"] = compute_expiry(training, completed_at)
        return data

    def _enforce_required_fields(self, record, incoming_values):
        """
        incoming_values: list of dicts {field_def, value_text/number/date/boolean/json}
        Ensures all active required defs for (GLOBAL or this training) are present.
        """
        if record.training is None:
            return
        # required defs = global (training is NULL) + specific to this training
        req_defs = (
            TrainingFieldDef.objects.filter(active=True, required=True)
            .filter(Q(training__isnull=True) | Q(training=record.training))
            .values_list("id", flat=True)
        )
        provided = {v["field_def"] for v in incoming_values if "field_def" in v}
        missing = [fid for fid in req_defs if fid not in provided]
        if missing:
            raise serializers.ValidationError(
                {"field_values": f"Missing required fields: {missing}"}
            )

    def create(self, validated_data):
        request = self.context.get("request")
        incoming_values = (request.data.get("field_values") or []) if request else []
        record = super().create(validated_data)
        if incoming_values:
            self._enforce_required_fields(record, incoming_values)
            objects = []
            for v in incoming_values:
                objects.append(
                    TrainingRecordFieldValue(
                        record=record,
                        field_def_id=v["field_def"],
                        value_text=v.get("value_text"),
                        value_number=v.get("value_number"),
                        value_date=v.get("value_date"),
                        value_boolean=v.get("value_boolean"),
                        value_json=v.get("value_json"),
                    )
                )
            TrainingRecordFieldValue.objects.bulk_create(objects)
        return record

    def update(self, instance, validated_data):
        request = self.context.get("request")
        incoming_values = (request.data.get("field_values") or []) if request else []
        record = super().update(instance, validated_data)
        if incoming_values:
            self._enforce_required_fields(record, incoming_values)
            # upsert semantics per (record, field_def)
            for v in incoming_values:
                obj, _ = TrainingRecordFieldValue.objects.update_or_create(
                    record=record,
                    field_def_id=v["field_def"],
                    defaults=dict(
                        value_text=v.get("value_text"),
                        value_number=v.get("value_number"),
                        value_date=v.get("value_date"),
                        value_boolean=v.get("value_boolean"),
                        value_json=v.get("value_json"),
                    ),
                )
        return record


class CategoryTrainingRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryTrainingRequirement
        fields = "__all__"


class TrainingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingEvent
        fields = "__all__"


class TrainingAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingAttendance
        fields = "__all__"
