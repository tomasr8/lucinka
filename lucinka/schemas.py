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
