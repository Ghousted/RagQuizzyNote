# Import all models so they register with Base.metadata before create_all is called.
from app.models.user import User  # noqa: F401
from app.models.note import Note  # noqa: F401
from app.models.topic import Topic  # noqa: F401
from app.models.chunk import Chunk  # noqa: F401
from app.models.flashcard import Flashcard  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.quiz import Quiz  # noqa: F401
