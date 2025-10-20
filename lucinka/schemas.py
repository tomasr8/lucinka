from marshmallow import Schema, fields


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
