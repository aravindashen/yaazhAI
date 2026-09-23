from sqlalchemy import Column, String, Integer, Text, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    display_name = Column(String(128), default="இளங்கோவன்")
    preferred_role = Column(String(32), default="study")
    preferred_language = Column(String(8), default="ta")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    study_progress = relationship("UserStudyProgress", back_populates="user", cascade="all, delete-orphan")
    research_notes = relationship("ResearchNoteModel", back_populates="user", cascade="all, delete-orphan")

class ClassicalWorkModel(Base):
    __tablename__ = "classical_works"
    
    id = Column(String(64), primary_key=True, index=True)
    title_ta = Column(String(128), nullable=False, index=True)
    title_en = Column(String(128), nullable=False, index=True)
    transliteration = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False, index=True) # பத்துப்பாட்டு, எட்டுத்தொகை, etc.
    period = Column(String(128), nullable=False)
    approx_date = Column(String(128), nullable=False)
    author_ta = Column(String(128), nullable=False, index=True)
    author_en = Column(String(128), nullable=False, index=True)
    description_ta = Column(Text, nullable=False)
    description_en = Column(Text, nullable=False)
    structure = Column(String(256), nullable=False)
    canonical_source = Column(String(256), nullable=False)
    verse_count = Column(Integer, default=0)
    
    verses = relationship("ClassicalVerseModel", back_populates="work", cascade="all, delete-orphan")

class ClassicalVerseModel(Base):
    __tablename__ = "classical_verses"
    
    id = Column(String(64), primary_key=True, index=True)
    work_id = Column(String(64), ForeignKey("classical_works.id"), index=True, nullable=False)
    work_title_ta = Column(String(128), nullable=False)
    work_title_en = Column(String(128), nullable=False)
    section_ta = Column(String(128), nullable=True) # e.g. அறத்துப்பால்
    chapter_ta = Column(String(128), nullable=True, index=True) # e.g. விருந்தோம்பல்
    chapter_en = Column(String(128), nullable=True, index=True)
    verse_number = Column(Integer, nullable=False, index=True)
    poet_ta = Column(String(128), nullable=False, index=True)
    poet_en = Column(String(128), nullable=False, index=True)
    meter_ta = Column(String(64), nullable=False) # குறள் வெண்பா, ஆசிரியப்பா
    thinai = Column(String(64), nullable=True) # குறிஞ்சி, முல்லை, etc.
    thurai = Column(String(64), nullable=True)
    lines_ta = Column(JSON, nullable=False) # List of lines
    full_text_ta = Column(Text, nullable=False, index=True)
    transliteration = Column(Text, nullable=False)
    word_split_ta = Column(JSON, nullable=False) # Array of split tokens
    vocabulary = Column(JSON, nullable=False) # List of vocabulary breakdown objects
    commentaries = Column(JSON, nullable=False) # List of commentaries
    translations = Column(JSON, nullable=False) # List of translations
    core_concepts = Column(JSON, nullable=False) # Array of concepts
    cultural_context_ta = Column(Text, nullable=False)
    cultural_context_en = Column(Text, nullable=False)
    canonical_source = Column(String(256), nullable=False)
    
    work = relationship("ClassicalWorkModel", back_populates="verses")

class TamilConceptModel(Base):
    __tablename__ = "tamil_concepts"
    
    id = Column(String(64), primary_key=True, index=True)
    name_ta = Column(String(128), nullable=False, index=True)
    name_en = Column(String(128), nullable=False, index=True)
    transliteration = Column(String(128), nullable=False)
    definition_ta = Column(Text, nullable=False)
    definition_en = Column(Text, nullable=False)
    classical_vocabulary = Column(JSON, default=list)
    primary_work_ids = Column(JSON, default=list)
    sample_verse_ids = Column(JSON, default=list)
    cultural_significance_ta = Column(Text, default="")

class TextualVariantModel(Base):
    __tablename__ = "textual_variants"
    
    id = Column(String(64), primary_key=True, index=True)
    work_id = Column(String(64), nullable=False, index=True)
    work_title_ta = Column(String(128), nullable=False)
    work_title_en = Column(String(128), nullable=False)
    verse_ref = Column(String(128), nullable=False)
    base_reading_ta = Column(Text, nullable=False)
    variant_reading_ta = Column(Text, nullable=False)
    source_manuscript = Column(String(256), nullable=False)
    printed_edition = Column(String(256), nullable=False)
    critical_analysis_ta = Column(Text, nullable=False)
    critical_analysis_en = Column(Text, nullable=False)

class ResearchNoteModel(Base):
    __tablename__ = "research_notes"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    verse_id = Column(String(64), default="general")
    title = Column(String(256), nullable=False)
    note_text = Column(Text, nullable=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="research_notes")

class UserStudyProgress(Base):
    __tablename__ = "user_study_progress"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    verse_id = Column(String(64), nullable=False)
    quiz_score = Column(Float, default=0.0)
    cards_reviewed = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    last_studied_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="study_progress")
