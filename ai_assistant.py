"""ai_assistant.py
Lightweight, pluggable AI assistant logic with rule-based intent extraction.
Designed so a real LLM provider can later be swapped in (OpenAI, Anthropic, etc.).
"""
from __future__ import annotations
import datetime as _dt
from typing import List, Dict, Any, Optional
from dateutil import parser as date_parser
import re

INTENT_ADD = "ADD_TASK"
INTENT_COMPLETE = "COMPLETE_TASK"
INTENT_LIST = "LIST_TASKS"
INTENT_SNOOZE = "SNOOZE_TASK"
INTENT_DELETE = "DELETE_TASK"
INTENT_RESCHEDULE = "RESCHEDULE_TASK"
INTENT_FREE_UP = "FREE_UP"
INTENT_UNKNOWN = "UNKNOWN"

DATE_KEYWORDS = {
    'today': 0,
    'tomorrow': 1,
    'day after tomorrow': 2
}

PRIORITY_KEYWORDS = {
    'high': 'priority-high',
    'medium': 'priority-medium',
    'low': 'priority-low'
}

FREE_UP_PAT = re.compile(r"free up|make time|clear (?:my )?(?:day|afternoon|morning)", re.I)

class AssistantResult(Dict[str, Any]):
    pass

def _extract_date(text: str) -> Optional[_dt.datetime]:
    lower = text.lower()
    now = _dt.datetime.utcnow()
    for k, offset in DATE_KEYWORDS.items():
        if k in lower:
            return (now + _dt.timedelta(days=offset)).replace(hour=9, minute=0, second=0, microsecond=0)
    # Try relaxed parsing
    try:
        dt = date_parser.parse(text, fuzzy=True, default=now)
        return dt
    except Exception:
        return None

def _extract_priority(text: str) -> Optional[str]:
    for k,v in PRIORITY_KEYWORDS.items():
        if k in text.lower():
            return v
    return None

def interpret_messages(messages: List[Dict[str,str]]) -> AssistantResult:
    """Given a conversation (list of {role, content}), derive one action from the last user message.
    Currently single-turn extraction for simplicity.
    """
    if not messages:
        return AssistantResult(intent=INTENT_UNKNOWN, entities={}, response="I didn't receive any message.")
    last_user = next((m for m in reversed(messages) if m.get('role')=='user'), None)
    if not last_user:
        return AssistantResult(intent=INTENT_UNKNOWN, entities={}, response="I'm waiting for your instructions.")
    text = last_user.get('content','').strip()
    lower = text.lower()
    entities: Dict[str, Any] = {}

    # Free up schedule
    if FREE_UP_PAT.search(lower):
        entities['targetDate'] = _extract_date(lower) or _dt.datetime.utcnow()
        return AssistantResult(intent=INTENT_FREE_UP, entities=entities, response="Let me see which tasks we can postpone to free some time.")

    # Add task
    if any(k in lower for k in ['add ','create','remind me','schedule','new task']):
        entities['description'] = re.sub(r'^(add|create|schedule|new task)\s+','', text, flags=re.I)
        entities['dueDate'] = _extract_date(lower) or (_dt.datetime.utcnow() + _dt.timedelta(hours=1))
        pr = _extract_priority(lower)
        if pr: entities['priority'] = pr
        return AssistantResult(intent=INTENT_ADD, entities=entities, response="Adding that task.")

    # Complete task
    if any(k in lower for k in ['complete','mark done','finish','done with']):
        # Heuristic: after keyword
        m = re.search(r'(?:complete|finish|done with) (.+)', lower)
        if m: entities['description'] = m.group(1).strip()
        return AssistantResult(intent=INTENT_COMPLETE, entities=entities, response="Marking it complete if I find it.")

    # List tasks
    if any(k in lower for k in ['list','show','what\'s due','what is due','tasks for']):
        entities['targetDate'] = _extract_date(lower) or _dt.datetime.utcnow()
        return AssistantResult(intent=INTENT_LIST, entities=entities, response="Here is what I found.")

    # Snooze
    if 'snooze' in lower or 'delay' in lower:
        m = re.search(r'snooze (.+?) by (\d+)(m|h|d)', lower)
        if m:
            entities['description'] = m.group(1).strip()
            entities['duration'] = m.group(2)+m.group(3)
        return AssistantResult(intent=INTENT_SNOOZE, entities=entities, response="Attempting a snooze.")

    # Reschedule
    if 'reschedule' in lower or 'move' in lower:
        m = re.search(r'(?:reschedule|move) (.+?) to (.+)', lower)
        if m:
            entities['description'] = m.group(1).strip()
            entities['newDate'] = _extract_date(m.group(2))
        return AssistantResult(intent=INTENT_RESCHEDULE, entities=entities, response="Trying to update its date.")

    # Delete
    if 'delete' in lower or 'remove' in lower:
        m = re.search(r'(?:delete|remove) (.+)', lower)
        if m:
            entities['description'] = m.group(1).strip()
        return AssistantResult(intent=INTENT_DELETE, entities=entities, response="Removing if it exists.")

    return AssistantResult(intent=INTENT_UNKNOWN, entities={}, response="I can add, list, complete, snooze, reschedule or free up your schedule. Try: 'Free up tomorrow afternoon'.")


def apply_actions(result: AssistantResult, db) -> Dict[str, Any]:
    """Execute the interpreted intent against the SQLite DB.
    Returns dict with 'message' and optional 'refresh' flag.
    """
    intent = result['intent']
    entities = result.get('entities', {})
    cur = db.cursor()
    now = _dt.datetime.utcnow()

    try:
        if intent == INTENT_ADD:
            desc = entities.get('description') or 'Untitled Task'
            due = entities.get('dueDate') or (now + _dt.timedelta(hours=1))
            # Normalize due to a datetime object then ISO string
            if isinstance(due, _dt.datetime):
                due_dt = due
            else:
                try:
                    due_dt = date_parser.parse(str(due))
                except Exception:
                    due_dt = now + _dt.timedelta(hours=1)
            due_iso = due_dt.isoformat()
            priority = entities.get('priority','priority-medium')
            cur.execute("INSERT INTO tasks (description, dueDate, priority, createdAt) VALUES (?,?,?,?)", (desc, due_iso, priority, now.isoformat()))
            db.commit()
            return { 'message': f"Added task '{desc}' for {due_dt.strftime('%Y-%m-%d %H:%M')}", 'refresh': True }

        if intent == INTENT_COMPLETE:
            desc = entities.get('description')
            if not desc:
                return {'message':'Please specify which task to complete.'}
            cur.execute("UPDATE tasks SET completed=1, completedAt=? WHERE completed=0 AND deletedAt IS NULL AND description LIKE ?", (now.isoformat(), f"%{desc}%"))
            db.commit()
            return { 'message': f"Completed {cur.rowcount} task(s) matching '{desc}'.", 'refresh': cur.rowcount>0 }

        if intent == INTENT_LIST:
            target = entities.get('targetDate') or now
            if isinstance(target, _dt.datetime):
                date_prefix = target.strftime('%Y-%m-%d')
            else:
                date_prefix = str(target)[:10]
            cur.execute("SELECT description, dueDate, priority, completed FROM tasks WHERE deletedAt IS NULL AND substr(dueDate,1,10)=? ORDER BY dueDate", (date_prefix,))
            rows = cur.fetchall()
            if not rows:
                return { 'message': 'No tasks for that date.' }
            parts = []
            for r in rows[:12]:  # limit verbosity
                due_t = r['dueDate'][11:16]
                parts.append(f"{due_t} - {r['description']}")
            extra = '' if len(rows)<=12 else f" (+{len(rows)-12} more)"
            return { 'message': 'Tasks: ' + '; '.join(parts) + extra }

        if intent == INTENT_SNOOZE:
            desc = entities.get('description')
            dur = entities.get('duration','1h')
            if not desc:
                return {'message':'Which task should I snooze?'}
            multiplier = {'10m': (_dt.timedelta(minutes=10)), '1h': _dt.timedelta(hours=1), '1d': _dt.timedelta(days=1)}.get(dur, _dt.timedelta(hours=1))
            cur.execute("SELECT id, dueDate FROM tasks WHERE deletedAt IS NULL AND completed=0 AND description LIKE ? ORDER BY dueDate LIMIT 1", (f"%{desc}%",))
            row = cur.fetchone()
            if not row:
                return {'message':'Task not found to snooze.'}
            new_due = date_parser.parse(row['dueDate']) + multiplier
            cur.execute("UPDATE tasks SET dueDate=?, snoozedUntil=?, snoozeDuration=? WHERE id=?", (new_due.isoformat(), new_due.isoformat(), dur, row['id']))
            db.commit()
            return {'message': f"Snoozed task to {new_due.strftime('%H:%M')}", 'refresh': True }

        if intent == INTENT_RESCHEDULE:
            desc = entities.get('description')
            new_date = entities.get('newDate')
            if not (desc and new_date):
                return {'message':'Need a task and a new date/time.'}
            cur.execute("SELECT id FROM tasks WHERE deletedAt IS NULL AND completed=0 AND description LIKE ? ORDER BY dueDate LIMIT 1", (f"%{desc}%",))
            row = cur.fetchone()
            if not row:
                return {'message':'Task not found.'}
            # Normalize new_date to ISO
            if isinstance(new_date, _dt.datetime):
                new_dt = new_date
            else:
                try:
                    new_dt = date_parser.parse(str(new_date))
                except Exception:
                    return {'message':'Could not parse the new date/time.'}
            cur.execute("UPDATE tasks SET dueDate=? WHERE id=?", (new_dt.isoformat(), row['id']))
            db.commit()
            return {'message': f"Rescheduled to {new_dt.strftime('%Y-%m-%d %H:%M')}", 'refresh': True }

        if intent == INTENT_DELETE:
            desc = entities.get('description')
            if not desc:
                return {'message':'Which task should I delete?'}
            cur.execute("UPDATE tasks SET deletedAt=? WHERE deletedAt IS NULL AND description LIKE ?", (now.isoformat(), f"%{desc}%"))
            db.commit()
            return {'message': f"Deleted {cur.rowcount} task(s).", 'refresh': cur.rowcount>0 }

        if intent == INTENT_FREE_UP:
            target = entities.get('targetDate') or now
            if isinstance(target, _dt.datetime):
                date_prefix = target.strftime('%Y-%m-%d')
            else:
                date_prefix = str(target)[:10]
            cur.execute("SELECT id, description, dueDate, priority FROM tasks WHERE deletedAt IS NULL AND completed=0 AND substr(dueDate,1,10)=? ORDER BY dueDate", (date_prefix,))
            rows = cur.fetchall()
            if not rows:
                return {'message':'No tasks to optimize that day.'}
            # Strategy: move up to 3 lowest priority / latest tasks to next day same time
            # Determine candidate order: by priority asc then time desc
            def prio_val(p): return {'priority-high':3,'priority-medium':2,'priority-low':1}.get(p,2)
            sorted_rows = sorted(rows, key=lambda r: (prio_val(r['priority']), r['dueDate']), reverse=False)
            moved = []
            for r in reversed(sorted_rows): # start from lowest priority later tasks
                if len(moved)>=3: break
                old_dt = date_parser.parse(r['dueDate'])
                new_dt = old_dt + _dt.timedelta(days=1)
                cur.execute("UPDATE tasks SET dueDate=? WHERE id=?", (new_dt.isoformat(), r['id']))
                moved.append((r['description'], old_dt, new_dt))
            db.commit()
            if not moved:
                return {'message':'Could not find tasks suitable to move.'}
            summary = '; '.join(f"'{d}' to {n.strftime('%Y-%m-%d %H:%M')}" for d,_,n in moved)
            return {'message': f"Freed time by moving {len(moved)} task(s): {summary}", 'refresh': True }

        return {'message': result.get('response','I am not sure.')}
    except Exception as e:
        return {'message': f"Error executing action: {e}"}

__all__ = [
    'interpret_messages', 'apply_actions'
]
