from __future__ import annotations

from datetime import date, datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Integer, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from werkzeug.security import check_password_hash


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    is_admin: Mapped[bool] = mapped_column(db.Boolean, nullable=False)

    login_records: Mapped[list[LoginRecord]] = db.relationship("LoginRecord", back_populates="user")

    def verify_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User({self.id}) {self.username}>"


class LoginRecord(db.Model):
    __tablename__ = "login_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"), nullable=False)
    login_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=db.func.now())

    user: Mapped[User] = db.relationship(back_populates="login_records")

    def __repr__(self) -> str:
        return f"<LoginRecord({self.id}) user_id={self.user_id} login_dt={self.login_dt}>"


class DataEntry(db.Model):
    __tablename__ = "data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"), nullable=False)
    created_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=db.func.now())
    date: Mapped[date] = mapped_column(db.Date, nullable=False)
    weight: Mapped[float | None] = mapped_column(db.Float, nullable=True)
    height: Mapped[float | None] = mapped_column(db.Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(db.Text, nullable=True)

    user: Mapped[User] = db.relationship()

    def __repr__(self) -> str:
        return (
            f"<DataEntry({self.id}) user_id={self.user_id} date={self.date} weight={self.weight} height={self.height}>"
        )


class Visit(db.Model):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"), nullable=False)
    created_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=db.func.now())
    date: Mapped[date] = mapped_column(db.DateTime, nullable=False)
    doctor: Mapped[str] = mapped_column(db.Text, nullable=False)
    location: Mapped[str] = mapped_column(db.Text, nullable=False)
    type: Mapped[str] = mapped_column(db.Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(db.Text, nullable=True)

    user: Mapped[User] = db.relationship()

    def __repr__(self) -> str:
        return f"<Visit({self.id}) user_id={self.user_id} date={self.date} time={self.time} doctor={self.doctor} location={self.location}>"


class Breastfeeding(db.Model):
    __tablename__ = "breastfeeding"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"), nullable=False)
    created_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=db.func.now())
    start_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    end_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    left_duration: Mapped[int | None] = mapped_column(db.Integer, nullable=True)
    right_duration: Mapped[int | None] = mapped_column(db.Integer, nullable=True)
    is_pumped: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    is_breast: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=True)
    ml_amount: Mapped[int] = mapped_column(db.Integer, nullable=False, default=0)

    user: Mapped[User] = db.relationship()

    def __repr__(self) -> str:
        return f"<Breastfeeding({self.id}) user_id={self.user_id} date={self.date} start_time={self.start_time} end_time={self.end_time} breast={self.breast} left_duration={self.left_duration} right_duration={self.right_duration} is_pumped={self.is_pumped} is_breast={self.is_breast} ml_amount={self.ml_amount}>"


class Photo(db.Model):
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    notes: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    ext: Mapped[str] = mapped_column(db.Text, nullable=False)
    created_dt: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=db.func.now())
    user_id: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"), nullable=False)

    user: Mapped[User] = db.relationship()

    @property
    def storage_filename(self) -> str:
        return f"{self.id}{self.ext}"

    def __repr__(self) -> str:
        return f"<Photo({self.id}) date={self.date} notes={self.notes} created_dt={self.created_dt} user_id={self.user_id}>"
