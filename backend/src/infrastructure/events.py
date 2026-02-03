"""Simple in-memory event bus for SSE notifications."""

import asyncio
from collections import defaultdict
from datetime import UTC, datetime


class EventBus:
    """In-memory pub/sub for server-sent events."""

    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

    def subscribe(self, channel: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[channel].append(queue)
        return queue

    def unsubscribe(self, channel: str, queue: asyncio.Queue):
        if channel in self._subscribers:
            self._subscribers[channel] = [
                q for q in self._subscribers[channel] if q is not queue
            ]

    async def publish(self, channel: str, event: dict):
        event.setdefault("timestamp", datetime.now(UTC).isoformat())
        for queue in self._subscribers.get(channel, []):
            await queue.put(event)
        # Also publish to the global channel
        if channel != "queue:all":
            for queue in self._subscribers.get("queue:all", []):
                await queue.put(event)


# Singleton instance
event_bus = EventBus()
