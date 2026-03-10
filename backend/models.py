from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    transcript = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    content = Column(Text)
    sentiment_label = Column(String)
    sentiment_score = Column(Integer)

    meeting = relationship("Meeting", back_populates="summary")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    task = Column(String)
    assignee = Column(String, nullable=True)
    deadline = Column(String, nullable=True)

    meeting = relationship("Meeting", back_populates="action_items")
