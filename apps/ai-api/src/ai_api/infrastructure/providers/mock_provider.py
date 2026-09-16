from collections.abc import Mapping
from typing import Any

from ai_api.domain.ports import (
    ChatMessage,
    CompletionResult,
    StructuredResult,
    StructuredTask,
)


class MockLlmProvider:
    """Deterministic provider for local development and tests.

    Unlike a canned-response stub, ``complete_json`` derives its payload from the context it is
    handed. That keeps grounding, empty-context, and refusal behaviour testable without a real
    model, and it never cites an id that was not supplied.
    """

    @property
    def name(self) -> str:
        return "mock"

    @property
    def model(self) -> str:
        return "mock-assist-v1"

    async def complete(self, messages: list[ChatMessage]) -> CompletionResult:
        user_turns = [message.content for message in messages if message.role == "user"]
        last = user_turns[-1] if user_turns else "Hello"
        reply = (
            "I'm Personal OS Assist (mock provider). "
            f'You said: "{last[:280]}". '
            "Wire OPENAI_API_KEY and set AI_PROVIDER=openai_compatible for a real model."
        )
        return CompletionResult(content=reply, provider=self.name, model=self.model)

    async def complete_json(
        self,
        *,
        task: StructuredTask,
        instructions: str,
        context: Mapping[str, Any],
    ) -> StructuredResult:
        payload = (
            _daily_payload(context) if task == "daily_intelligence" else _chat_payload(context)
        )
        return StructuredResult(payload=payload, provider=self.name, model=self.model)


def _daily_payload(context: Mapping[str, Any]) -> dict[str, Any]:
    raw_date = context.get("date")
    day = raw_date if isinstance(raw_date, str) else "today"

    insights = [
        *_routine_insights(context.get("routines"), day),
        *_finance_insights(context.get("financeSummary"), context.get("financeMonth")),
    ]

    if not insights:
        insights.append(
            {
                "id": f"general-{day}",
                "kind": "general",
                "priority": "low",
                "title": "Nothing scheduled to review",
                "detail": (
                    "No routines are scheduled for this day and no finance activity was "
                    "recorded, so there is nothing to surface yet."
                ),
                "sourceRefs": [],
            }
        )

    return {"insights": insights}


def _routine_insights(routines: Any, day: str) -> list[dict[str, Any]]:
    if not isinstance(routines, list):
        return []

    insights: list[dict[str, Any]] = []
    for routine in routines:
        if not isinstance(routine, Mapping):
            continue

        routine_id = routine.get("id")
        name = routine.get("name")
        completed = routine.get("completedItems")
        total = routine.get("totalItems")

        if not isinstance(routine_id, str) or not isinstance(name, str):
            continue
        if not isinstance(completed, int) or not isinstance(total, int):
            continue
        # Nothing scheduled, or nothing left to do, is not worth an insight.
        if total <= 0 or completed >= total:
            continue

        insights.append(
            {
                "id": f"routine-{routine_id}-{day}",
                "kind": "routine",
                "priority": "high" if completed == 0 else "medium",
                "title": f"{name}: {completed}/{total} done",
                "detail": f"{total - completed} of {total} items are still open for {day}.",
                "sourceRefs": [
                    _item_ref(routine) or {"type": "routine", "id": routine_id, "label": name}
                ],
                "suggestedAction": {
                    "title": f"Open {name}",
                    "detail": "Review the remaining items in the routines screen.",
                    "kind": "navigation",
                },
            }
        )

    return insights


def _finance_insights(summary: Any, month: Any) -> list[dict[str, Any]]:
    if not isinstance(summary, Mapping) or not isinstance(month, str):
        return []

    income = summary.get("incomeTotal")
    expense = summary.get("expenseTotal")
    if not isinstance(income, int) or not isinstance(expense, int):
        return []
    if income == 0 and expense == 0:
        return []

    net = income - expense
    state = "negative" if net < 0 else "positive"

    return [
        {
            "id": f"finance-{month}-net",
            "kind": "finance",
            "priority": "high" if net < 0 else "low",
            "title": f"{month} net is {state}",
            "detail": (
                f"Recorded income and expenses for {month} leave a {state} net balance. "
                "Amounts stay in the account's minor currency units."
            ),
            "sourceRefs": [{"type": "month", "id": month, "label": f"Finance for {month}"}],
            "suggestedAction": {
                "title": "Review this month's budget",
                "detail": "Open the finance screen for the category breakdown.",
                "kind": "navigation",
            },
        }
    ]


def _item_ref(routine: Mapping[str, Any]) -> dict[str, str] | None:
    items = routine.get("items")
    if not isinstance(items, list):
        return None

    for item in items:
        if not isinstance(item, Mapping) or item.get("completed") is True:
            continue
        item_id = item.get("id")
        item_name = item.get("name")
        if isinstance(item_id, str) and isinstance(item_name, str):
            return {"type": "routine_item", "id": item_id, "label": item_name}

    return None


def _chat_payload(context: Mapping[str, Any]) -> dict[str, Any]:
    question = _last_user_content(context)
    sources = _context_sources(context)
    snapshot = _snapshot_lines(context)

    if not sources and not snapshot:
        return {
            "reply": (
                "I don't have any of your Personal OS records in context for this question, so I "
                "can't answer it from your data. Open the screen you're asking about and ask "
                "again, or rephrase the question."
            )
        }

    parts = [f'You asked: "{question[:200]}".']
    if snapshot:
        parts.append("From your current context:")
        parts.extend(snapshot)
    parts.append("This is a read-only summary; nothing was changed.")

    payload: dict[str, Any] = {"reply": " ".join(parts)}
    if sources:
        payload["sources"] = sources
    return payload


def _last_user_content(context: Mapping[str, Any]) -> str:
    messages = context.get("messages")
    if not isinstance(messages, list):
        return ""

    content = ""
    for message in messages:
        if not isinstance(message, Mapping) or message.get("role") != "user":
            continue
        value = message.get("content")
        if isinstance(value, str):
            content = value
    return content


def _context_sources(context: Mapping[str, Any]) -> list[dict[str, str]]:
    sources: list[dict[str, str]] = []

    entity = context.get("entity")
    if isinstance(entity, Mapping):
        entity_id = entity.get("id")
        entity_type = entity.get("type")
        if isinstance(entity_id, str) and isinstance(entity_type, str):
            sources.append(
                {"type": entity_type, "id": entity_id, "label": f"{entity_type} {entity_id}"}
            )

    date = context.get("date")
    if isinstance(date, str):
        sources.append({"type": "day", "id": date, "label": date})

    return sources


def _snapshot_lines(context: Mapping[str, Any]) -> list[str]:
    snapshot = context.get("personalOS")
    if not isinstance(snapshot, Mapping):
        return []

    lines: list[str] = []

    routines = snapshot.get("routines")
    if isinstance(routines, list):
        tracked = [routine for routine in routines if isinstance(routine, Mapping)]
        if tracked:
            completed = sum(
                routine["completedItems"]
                for routine in tracked
                if isinstance(routine.get("completedItems"), int)
            )
            total = sum(
                routine["totalItems"]
                for routine in tracked
                if isinstance(routine.get("totalItems"), int)
            )
            lines.append(
                f"You have {len(tracked)} routines scheduled today with {completed}/{total} "
                "items complete."
            )

    finance = snapshot.get("finance")
    if isinstance(finance, Mapping):
        month = finance.get("month")
        net = finance.get("netTotal")
        if isinstance(month, str) and isinstance(net, int):
            lines.append(f"Your {month} net balance is {'positive' if net >= 0 else 'negative'}.")

    return lines
