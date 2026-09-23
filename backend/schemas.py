from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CourseInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class ExamRename(BaseModel):
    title: str = Field(min_length=1, max_length=160)


class QuestionInput(BaseModel):
    source_id: str = Field(pattern=r"^[1-9][0-9]*$")
    question_number: int = Field(gt=0)
    question_text: str = Field(min_length=1)
    option_a: str = Field(min_length=1)
    option_b: str = Field(min_length=1)
    option_c: str = Field(min_length=1)
    option_d: str = Field(min_length=1)
    correct_answer: Literal["A", "B", "C", "D"]


class ExamInput(BaseModel):
    course_id: int
    title: str = Field(min_length=1, max_length=160)
    questions: list[QuestionInput] = Field(min_length=1)


class CheckInput(BaseModel):
    question_id: int
    selected_answer: Literal["A", "B", "C", "D"]


class AttemptInput(BaseModel):
    mode: Literal["exam", "study"] = "exam"
    question_ids: list[int] = Field(min_length=1)
    answers: dict[int, Literal["A", "B", "C", "D"] | None]

