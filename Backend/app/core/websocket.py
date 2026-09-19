import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Set, Optional
from uuid import UUID
from fastapi import WebSocket
from sqlalchemy.orm import Session

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    """Manages real-time WebSocket connections for caregivers."""

    def __init__(self):
        # Map caregiver_id (str) to list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, caregiver_id: str):
        await websocket.accept()
        if caregiver_id not in self.active_connections:
            self.active_connections[caregiver_id] = []
        self.active_connections[caregiver_id].append(websocket)
        logger.info(
            f"[WebSocket] Caregiver '{caregiver_id}' connected. "
            f"Active connections for user: {len(self.active_connections[caregiver_id])}"
        )

    def disconnect(self, websocket: WebSocket, caregiver_id: str):
        if caregiver_id in self.active_connections:
            if websocket in self.active_connections[caregiver_id]:
                self.active_connections[caregiver_id].remove(websocket)
            if not self.active_connections[caregiver_id]:
                del self.active_connections[caregiver_id]
        logger.info(f"[WebSocket] Caregiver '{caregiver_id}' disconnected.")

    async def send_personal_message(self, message: dict, caregiver_id: str):
        """Sends a JSON message to all open WebSockets for a specific caregiver."""
        if caregiver_id in self.active_connections:
            dead_sockets = []
            for connection in list(self.active_connections[caregiver_id]):
                try:
                    await connection.send_json(message)
                except Exception as exc:
                    logger.warning(f"[WebSocket] Send failed for caregiver '{caregiver_id}': {exc}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect(dead, caregiver_id)

    async def broadcast_to_all(self, message: dict):
        """Broadcasts a JSON message to all connected caregivers."""
        for caregiver_id, connections in list(self.active_connections.items()):
            dead_sockets = []
            for connection in list(connections):
                try:
                    await connection.send_json(message)
                except Exception as exc:
                    logger.warning(f"[WebSocket] Broadcast failed for '{caregiver_id}': {exc}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.disconnect(dead, caregiver_id)


manager = ConnectionManager()


def broadcast_notification_to_caregivers(
    notification_dict: dict,
    patient_id: UUID | str,
    db: Optional[Session] = None,
):
    """
    Non-blocking broadcast helper called when a new notification is generated.
    Resolves caregivers linked to the patient via CaretakerPatient and DoctorPatient,
    and dispatches the NOTIFICATION_ALERT payload over open WebSockets.
    """
    from app.models.relationship import CaretakerPatient, DoctorPatient

    caregiver_ids: Set[str] = set()

    try:
        pid = UUID(str(patient_id)) if isinstance(patient_id, str) else patient_id
        if db is not None:
            caretakers = (
                db.query(CaretakerPatient)
                .filter(CaretakerPatient.patient_id == pid, CaretakerPatient.active == True)
                .all()
            )
            for c in caretakers:
                caregiver_ids.add(str(c.caretaker_id))

            doctors = (
                db.query(DoctorPatient)
                .filter(DoctorPatient.patient_id == pid, DoctorPatient.active == True)
                .all()
            )
            for d in doctors:
                caregiver_ids.add(str(d.doctor_id))
        else:
            from app.core.database import SessionLocal
            session = SessionLocal()
            try:
                caretakers = (
                    session.query(CaretakerPatient)
                    .filter(CaretakerPatient.patient_id == pid, CaretakerPatient.active == True)
                    .all()
                )
                for c in caretakers:
                    caregiver_ids.add(str(c.caretaker_id))

                doctors = (
                    session.query(DoctorPatient)
                    .filter(DoctorPatient.patient_id == pid, DoctorPatient.active == True)
                    .all()
                )
                for d in doctors:
                    caregiver_ids.add(str(d.doctor_id))
            finally:
                session.close()
    except Exception as exc:
        logger.warning(f"[WebSocket] Caregiver lookup error for patient {patient_id}: {exc}")

    payload = {
        "type": "NOTIFICATION_ALERT",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": notification_dict,
    }

    async def _send_all():
        if caregiver_ids:
            for cid in caregiver_ids:
                await manager.send_personal_message(payload, cid)
        await manager.send_personal_message(payload, "all")
        if not caregiver_ids:
            await manager.broadcast_to_all(payload)

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        loop.create_task(_send_all())
    else:
        try:
            asyncio.run(_send_all())
        except Exception as exc:
            logger.debug(f"[WebSocket] Synchronous broadcast dispatch error: {exc}")
