import datetime

from marshmallow import Schema, fields


def utcnow():
    return datetime.datetime.now(datetime.UTC)


class GetUserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(dump_only=True)
    is_admin = fields.Bool(dump_only=True)


class LoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class GetLoginRecordSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    login_dt = fields.DateTime(dump_only=True)


class GetDataEntrySchema(Schema):
    id = fields.Int(dump_only=True)
    date = fields.Date(dump_only=True)
    weight = fields.Float(dump_only=True)
    height = fields.Float(dump_only=True)
    notes = fields.Str(dump_only=True)


class AddDataEntrySchema(Schema):
    date = fields.Date(required=True)
    weight = fields.Float(load_default=None)
    height = fields.Float(load_default=None)
    notes = fields.Str(load_default=None)


class GetVisitSchema(Schema):
    id = fields.Int(dump_only=True)
    date = fields.DateTime(dump_only=True)
    doctor = fields.Str(dump_only=True)
    location = fields.Str(dump_only=True)
    type = fields.Str(dump_only=True)
    notes = fields.Str(dump_only=True)


class AddVisitSchema(Schema):
    date = fields.DateTime(required=True)
    doctor = fields.Str(required=True)
    location = fields.Str(required=True)
    type = fields.Str(required=True)
    notes = fields.Str(load_default=None)


class GetBreastfeedingSchema(Schema):
    id = fields.Int(dump_only=True)
    start_dt = fields.DateTime(dump_only=True)
    end_dt = fields.DateTime(dump_only=True)
    left_duration = fields.Int(dump_only=True)
    right_duration = fields.Int(dump_only=True)
    is_pumped = fields.Bool(dump_only=True)
    is_breast = fields.Bool(dump_only=True)
    ml_amount = fields.Int(dump_only=True)


class AddBreastfeedingSchema(Schema):
    start_dt = fields.DateTime(required=True)
    end_dt = fields.DateTime(required=True)
    left_duration = fields.Int(load_default=None)
    right_duration = fields.Int(load_default=None)
    is_pumped = fields.Bool(load_default=False)
    is_breast = fields.Bool(load_default=True)
    ml_amount = fields.Int(load_default=0)


class AddPhotoSchema(Schema):
    date = fields.DateTime(load_default=utcnow)
    notes = fields.Str(load_default="")


class GetPhotoSchema(Schema):
    id = fields.Int(dump_only=True)
    filename = fields.Method("get_filename", dump_only=True)
    date = fields.DateTime(dump_only=True)
    notes = fields.Str(dump_only=True)

    def get_filename(self, obj):
        return obj.storage_filename
