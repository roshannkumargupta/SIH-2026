import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket import manager

logger = logging.getLogger("websocket_router")

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/caregiver/{caregiver_id}")
async def caregiver_websocket_endpoint(websocket: WebSocket, caregiver_id: str):
    """
    Real-time WebSocket connection for caregiver alerts.
    Receives high-priority notification pushes when critical events occur
    (e.g., missed medication, distress mood check-in, fatigue-flagged game session).
    """
    await manager.connect(websocket, caregiver_id)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "caregiver_id": caregiver_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "connected",
        })

        while True:
            # Keep connection open, handle client heartbeats (PING -> PONG)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, caregiver_id)
    except Exception as exc:
        logger.warning(f"[WebSocket] Exception in session for '{caregiver_id}': {exc}")
        manager.disconnect(websocket, caregiver_id)
