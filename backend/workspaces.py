import hashlib
import re

from fastapi import Depends, Header, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Workspace


def get_workspace(x_workspace_key: str | None = Header(default=None), db: Session = Depends(get_db)) -> Workspace:
    if not x_workspace_key or not re.fullmatch(r"[0-9a-f]{64}", x_workspace_key):
        raise HTTPException(status_code=401, detail="This browser has no valid workspace key. Reload the page or restore your key in Settings.")
    workspace_id = hashlib.sha256(bytes.fromhex(x_workspace_key)).hexdigest()
    workspace = db.get(Workspace, workspace_id)
    if workspace is None:
        workspace = Workspace(id=workspace_id)
        db.add(workspace)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            workspace = db.get(Workspace, workspace_id)
    return workspace
