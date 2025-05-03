from dateutil import parser as dateutil_parser # Using dateutil for more robust parsing
import datetime
import json
import os
from flask import Flask, request, jsonify, render_template, send_from_directory
import logging

# --- Flask App Setup ---
app = Flask(__name__, static_folder='.', template_folder='.')
logging.basicConfig(level=logging.INFO)
log = app.logger # Use Flask's built-in logger

# --- In-Memory Data Storage (VOLATILE - Replace with Database) ---
# Simulating database tables with dictionaries
# WARNING: All data is lost when the script stops!
tasks = {} # {task_id: task_dict} - Active tasks
deleted_tasks = {} # {task_id: task_dict} - Soft-deleted tasks
# No separate completed_tasks dict; completion is a flag in the main 'tasks' dict
next_task_id = 1

# --- Helper Functions ---

def generate_task_id():
    """Generates a unique sequential task ID."""
    global next_task_id
    # In a real DB, this would be handled by auto-incrementing primary keys
    task_id = next_task_id
    next_task_id += 1
    log.info(f"Generated new task ID: {task_id}")
    return task_id

def parse_datetime_string_robust(date_str, time_str):
    """
    Parses date and time strings from frontend into a Python datetime object.
    Uses dateutil.parser for flexibility.
    Assumes date_str is like 'DD/MM/YYYY' or 'MM/DD/YYYY'
    Assumes time_str is like 'H:MM AM/PM' or 'HH:MM'
    """
    if not date_str or not time_str:
        log.warning("parse_datetime_string_robust called with empty date or time string.")
        return None

    try:
        # Combine and let dateutil try to parse common formats
        # Giving dayfirst=True hints towards DD/MM/YYYY if ambiguous
        # You might need to pass the user's date format setting here
        # For now, we'll try dayfirst=True as a common European format
        # dt_str = f"{date_str} {time_str}"
        # parsed_dt = parser.parse(dt_str, dayfirst=True) # Example: Prioritize DD/MM

        # More robust: Try specific formats based on potential settings
        # Assuming JS sends DD/MM/YYYY or MM/DD/YYYY based on setting
        # And HH:MM or H:MM AM/PM based on setting
        # For simplicity here, let's assume JS standardizes to YYYY-MM-DD HH:MM:SS before sending
        # OR we parse common formats expected from the UI pickers
        # Example assuming MM/DD/YYYY H:MM AM/PM or DD/MM/YYYY HH:MM
        formats_to_try = [
            '%m/%d/%Y %I:%M %p', # MM/DD/YYYY H:MM AM/PM
            '%d/%m/%Y %I:%M %p', # DD/MM/YYYY H:MM AM/PM
            '%m/%d/%Y %H:%M',   # MM/DD/YYYY HH:MM
            '%d/%m/%Y %H:%M'    # DD/MM/YYYY HH:MM
        ]
        parsed_dt = None
        for fmt in formats_to_try:
            try:
                parsed_dt = datetime.datetime.strptime(f"{date_str} {time_str}", fmt)
                log.debug(f"Successfully parsed '{date_str} {time_str}' using format '{fmt}'")
                break # Stop on first success
            except ValueError:
                continue # Try next format

        if parsed_dt is None:
             raise ValueError("Could not parse date/time with known formats")

        log.debug(f"Parsed '{date_str} {time_str}' into datetime: {parsed_dt}")
        return parsed_dt
    except Exception as e:
        log.error(f"Error parsing date/time string: '{date_str} {time_str}'. Error: {e}")
        return None # Return None if parsing fails

def task_to_dict_for_json(task):
    """
    Converts a task dictionary (with datetime objects) to a
    JSON-serializable dictionary (converting datetimes to ISO strings).
    Handles None values for dates.
    """
    if not isinstance(task, dict):
        log.error(f"Invalid task type passed to task_to_dict_for_json: {type(task)}")
        return None

    serializable_task = task.copy()
    for key, value in serializable_task.items():
        if isinstance(value, (datetime.datetime, datetime.date)):
            serializable_task[key] = value.isoformat()
        elif not isinstance(value, (str, int, float, bool, list, dict, type(None))):
             log.warning(f"Task serialization: Unexpected type {type(value)} for key '{key}'. Converting to string.")
             serializable_task[key] = str(value)
    return serializable_task

def get_priority_value(priority_str):
    """Assigns a numerical value for sorting priorities."""
    prio_map = {'priority-high': 3, 'priority-medium': 2, 'priority-low': 1}
    return prio_map.get(priority_str, 0) # Default to 0 if unknown

# --- Static File Serving ---

@app.route('/styles.css')
def serve_css():
    """Serves the styles.css file."""
    return send_from_directory('.', 'styles.css')

@app.route('/script.js')
def serve_js():
    """Serves the script.js file."""
    return send_from_directory('.', 'script.js')

# --- HTML Serving ---

@app.route('/')
def index():
    """Serves the main index.html file."""
    log.info("Serving index.html")
    return render_template('index.html')

# --- API Endpoints ---

@app.route('/api/tasks', methods=['GET'])
def get_tasks_by_date():
    """
    Gets active (not completed, not deleted) tasks for a specific date.
    Requires 'date' query parameter (YYYY-MM-DD).
    Supports sorting by 'time' (default) or 'priority'.
    """
    date_filter_str = request.args.get('date')
    sort_order = request.args.get('sort', 'time') # Default to time sort
    log.info(f"GET /api/tasks request. Date: {date_filter_str}, Sort: {sort_order}")

    if not date_filter_str:
        log.warning("Missing 'date' query parameter for /api/tasks")
        # Default to today if needed, but frontend should always provide it now
        # target_date = datetime.date.today()
        return jsonify({"error": "Missing 'date' query parameter (YYYY-MM-DD)"}), 400
    else:
        try:
            target_date = datetime.datetime.strptime(date_filter_str, '%Y-%m-%d').date()
        except ValueError:
            log.error(f"Invalid date format received: {date_filter_str}")
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    tasks_to_return = []
    try:
        # --- DB Interaction Placeholder ---
        # Replace this loop with a database query:
        # SELECT * FROM tasks WHERE date(dueDate) = target_date AND completed = false AND deletedAt IS NULL;
        current_tasks_list = list(tasks.values())
        for task in current_tasks_list:
            due_date = task.get('dueDate')
            # Check if active and matches the target date
            if (not task.get('completed') and not task.get('deletedAt') and
                    due_date and isinstance(due_date, datetime.datetime) and
                    due_date.date() == target_date):
                serializable = task_to_dict_for_json(task)
                if serializable:
                    tasks_to_return.append(serializable)

        # --- Sorting ---
        if sort_order == 'priority':
            # Sort by priority (descending), then time (ascending)
            tasks_to_return.sort(key=lambda x: (-get_priority_value(x.get('priority')),
                                                  datetime.datetime.fromisoformat(x['dueDate'])))
        else: # Default sort by time (ascending)
            tasks_to_return.sort(key=lambda x: datetime.datetime.fromisoformat(x['dueDate']))

        log.info(f"Returning {len(tasks_to_return)} tasks for {target_date} (sorted by {sort_order}).")
        return jsonify(tasks_to_return)

    except Exception as e:
         log.exception(f"Error in get_tasks_by_date")
         return jsonify({"error": "An internal server error occurred processing tasks"}), 500

@app.route('/api/tasks/all', methods=['GET'])
def get_all_active_tasks():
    """
    Gets ALL active (not completed, not deleted) tasks.
    Used for upcoming tasks view - filtering should ideally happen here based on query params.
    """
    log.info("GET /api/tasks/all request received.")
    # --- Filtering Placeholder ---
    # TODO: Add optional query parameters like 'startDate', 'endDate', 'limit'
    # filter_param = request.args.get('filter') # e.g., 'next7', 'next30'
    # Implement filtering logic based on dates
    try:
        active_tasks = []
        # --- DB Interaction Placeholder ---
        # Replace with: SELECT * FROM tasks WHERE completed = false AND deletedAt IS NULL;
        for task in tasks.values():
             if not task.get('completed') and not task.get('deletedAt') and task.get('dueDate'):
                 serializable = task_to_dict_for_json(task)
                 if serializable:
                     active_tasks.append(serializable)

        # Sort by due date ascending
        active_tasks.sort(key=lambda x: datetime.datetime.fromisoformat(x['dueDate']))
        log.info(f"Returning {len(active_tasks)} total active tasks (no server-side filtering applied).")
        return jsonify(active_tasks)
    except Exception as e:
        log.exception("Error in get_all_active_tasks")
        return jsonify({"error": "An internal server error occurred getting all tasks"}), 500


@app.route('/api/tasks/month', methods=['GET'])
def get_tasks_by_month():
    """
    Gets active (not completed, not deleted) tasks for a specific month and year.
    Requires 'year' and 'month' (1-12) query parameters.
    """
    year_str = request.args.get('year')
    month_str = request.args.get('month')
    log.info(f"GET /api/tasks/month request. Year: {year_str}, Month: {month_str}")

    if not year_str or not month_str:
        return jsonify({"error": "Missing 'year' or 'month' query parameter"}), 400
    try:
        year = int(year_str)
        month = int(month_str)
        if not (1 <= month <= 12):
             return jsonify({"error": "Invalid 'month' parameter. Must be between 1 and 12."}), 400

        tasks_for_month = []
        # --- DB Interaction Placeholder ---
        # Replace with: SELECT * FROM tasks WHERE strftime('%Y-%m', dueDate) = '{year}-{month:02d}' AND completed = false AND deletedAt IS NULL;
        current_tasks_list = list(tasks.values())
        for task in current_tasks_list:
            due_date = task.get('dueDate')
            if (not task.get('completed') and not task.get('deletedAt') and
                    due_date and isinstance(due_date, datetime.datetime) and
                    due_date.year == year and due_date.month == month):
                serializable = task_to_dict_for_json(task)
                if serializable:
                    tasks_for_month.append(serializable)

        tasks_for_month.sort(key=lambda x: datetime.datetime.fromisoformat(x['dueDate']))
        log.info(f"Returning {len(tasks_for_month)} tasks for {year}-{month:02d}.")
        return jsonify(tasks_for_month)

    except ValueError:
        log.error(f"Invalid year/month format: year={year_str}, month={month_str}")
        return jsonify({"error": "Invalid 'year' or 'month' format. Must be integers."}), 400
    except Exception as e:
        log.exception("Error in get_tasks_by_month")
        return jsonify({"error": "An internal server error occurred getting month tasks"}), 500


@app.route('/api/tasks', methods=['POST'])
def add_task_route():
    """Adds a new task based on JSON data from the frontend."""
    log.info("POST /api/tasks request received.")
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.json
    log.debug(f"Received task data: {data}")

    description = data.get('description')
    due_date_str = data.get('dueDate')
    due_time_str = data.get('dueTime')
    priority = data.get('priority', 'priority-low')
    repeat_frequency = data.get('repeatFrequency', 'none')
    custom_repeat_days = data.get('customRepeatDays', [])
    repeat_until_str = data.get('repeatUntil') # NEW

    if not description: # Basic validation
        return jsonify({"error": "Task description cannot be empty"}), 400
    if len(description) > 150: # Example validation
        return jsonify({"error": "Task description exceeds 150 characters"}), 400
    if not due_date_str or not due_time_str:
         return jsonify({"error": "Missing due date or time"}), 400

    due_date_obj = parse_datetime_string_robust(due_date_str, due_time_str)
    if not due_date_obj:
         return jsonify({"error": "Invalid date or time format provided"}), 400

    repeat_until_obj = None
    if repeat_until_str:
        try:
            # Assuming repeatUntil is sent as YYYY-MM-DD or similar parseable format
            repeat_until_obj = parser.parse(repeat_until_str).date()
        except Exception as e:
            log.warning(f"Could not parse repeatUntil date '{repeat_until_str}': {e}")
            # Decide how to handle - ignore, error, or default? Ignoring for now.
            repeat_until_obj = None

    task_id = generate_task_id()
    new_task = {
        "id": task_id,
        "description": description,
        "dueDate": due_date_obj, # Store as datetime
        "priority": priority,
        "repeatFrequency": repeat_frequency,
        "customRepeatDays": custom_repeat_days,
        "repeatUntil": repeat_until_obj, # Store as date or None (NEW)
        "completed": False,
        "createdAt": datetime.datetime.now(),
        "completedAt": None,
        "deletedAt": None,
        # Placeholders for full recurring logic (not implemented)
        "isRecurringInstance": False,
        "originalTaskId": None,
    }

    # --- DB Interaction Placeholder ---
    # Replace with: INSERT INTO tasks (...) VALUES (...);
    tasks[task_id] = new_task
    log.info(f"Task added (ID: {task_id}): {description}")

    # --- Recurring Task Generation Placeholder ---
    # TODO: Implement complex logic to generate future instances based on
    # repeat_frequency, customRepeatDays, repeatUntil, and store them.
    # This is non-trivial and likely requires a separate task scheduling system
    # or generating instances on-the-fly when requested.
    # For now, only the initial task is created.

    serializable_task = task_to_dict_for_json(new_task)
    if not serializable_task:
         return jsonify({"error": "Failed to process newly added task"}), 500
    return jsonify(serializable_task), 201

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Marks a specific task as complete."""
    # --- Recurring Task Completion Placeholder ---
    # TODO: Add query parameter '?series=true' if frontend sends it.
    # Based on that, implement logic to find and mark/delete future instances.
    # This is complex and NOT implemented here.
    complete_series = request.args.get('series', 'false').lower() == 'true'
    log.info(f"POST /api/tasks/{task_id}/complete request. Complete series: {complete_series}")

    # --- DB Interaction Placeholder ---
    # Replace with: UPDATE tasks SET completed = true, completedAt = NOW() WHERE id = task_id;
    # If complete_series, add logic to find and update/delete related recurring tasks.
    if task_id in tasks:
        if not tasks[task_id].get('completed'):
            tasks[task_id]['completed'] = True
            tasks[task_id]['completedAt'] = datetime.datetime.now()
            log.info(f"Task completed (ID: {task_id})")
            return jsonify({"message": "Task marked as complete"}), 200
        else:
            log.info(f"Task already complete (ID: {task_id})")
            return jsonify({"message": "Task already complete"}), 200
    else:
        log.warning(f"Complete task failed: Task not found (ID: {task_id})")
        return jsonify({"error": "Task not found"}), 404

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task_route(task_id):
    """Soft deletes a task (moves to deleted_tasks)."""
    log.info(f"DELETE /api/tasks/{task_id} request received.")
    # --- DB Interaction Placeholder ---
    # Replace with: UPDATE tasks SET deletedAt = NOW() WHERE id = task_id;
    # (Or move to a separate 'deleted_tasks' table)
    if task_id in tasks:
        # Check if it's already marked completed; if so, handle differently?
        # For simplicity now, just move it regardless of completed status.
        task_to_delete = tasks.pop(task_id)
        task_to_delete['deletedAt'] = datetime.datetime.now()
        deleted_tasks[task_id] = task_to_delete
        log.info(f"Task soft deleted (ID: {task_id})")
        return jsonify({"message": "Task moved to deleted list"}), 200
    else:
        log.warning(f"Soft delete failed: Task not found in active list (ID: {task_id})")
        return jsonify({"error": "Task not found in active list"}), 404

# --- Snooze Placeholder ---
@app.route('/api/tasks/<int:task_id>/snooze', methods=['POST'])
def snooze_task(task_id):
     """Snoozes a task by updating its due date."""
     log.info(f"POST /api/tasks/{task_id}/snooze request.")
     if not request.is_json:
         return jsonify({"error": "Request must be JSON"}), 400
     data = request.json
     duration = data.get('duration') # e.g., '10m', '1h', '1d'

     if not duration:
         return jsonify({"error": "Missing 'duration' for snooze"}), 400

     # --- DB Interaction Placeholder ---
     # Replace with: SELECT dueDate FROM tasks WHERE id = task_id;
     #              UPDATE tasks SET dueDate = new_due_date WHERE id = task_id;
     if task_id in tasks:
         task = tasks[task_id]
         if task.get('completed') or task.get('deletedAt'):
              return jsonify({"error": "Cannot snooze completed or deleted task"}), 400

         current_due_date = task.get('dueDate')
         if not current_due_date or not isinstance(current_due_date, datetime.datetime):
              return jsonify({"error": "Task has invalid due date"}), 400

         now = datetime.datetime.now()
         # Calculate new due date based on NOW, not original due date
         new_due_date = now
         if duration == '10m':
             new_due_date += datetime.timedelta(minutes=10)
         elif duration == '1h':
             new_due_date += datetime.timedelta(hours=1)
         elif duration == '1d':
             new_due_date += datetime.timedelta(days=1)
         else:
             return jsonify({"error": "Invalid snooze duration"}), 400

         task['dueDate'] = new_due_date
         log.info(f"Task {task_id} snoozed until {new_due_date.isoformat()}")
         return jsonify({"message": f"Task snoozed until {new_due_date.isoformat()}"}), 200
     else:
         log.warning(f"Snooze failed: Task not found (ID: {task_id})")
         return jsonify({"error": "Task not found"}), 404


@app.route('/api/completed_tasks', methods=['GET'])
def get_completed_tasks_route():
    """Gets all tasks marked as completed AND not soft-deleted."""
    log.info("GET /api/completed_tasks request received.")
    # --- Filtering Placeholder ---
    # TODO: Add query parameter like 'filter=last7/last30/etc'
    # filter_param = request.args.get('filter', 'all')
    # Implement date filtering based on 'completedAt'
    try:
        completed_list = []
        # --- DB Interaction Placeholder ---
        # Replace with: SELECT * FROM tasks WHERE completed = true AND deletedAt IS NULL;
        for t in tasks.values():
             if t.get('completed') and not t.get('deletedAt'):
                 serializable = task_to_dict_for_json(t)
                 if serializable:
                     completed_list.append(serializable)

        # Sort by due date, then priority (as requested in feedback)
        completed_list.sort(
            key=lambda x: (datetime.datetime.fromisoformat(x['dueDate']),
                           -get_priority_value(x.get('priority')))
        )
        log.info(f"Returning {len(completed_list)} completed tasks.")
        return jsonify(completed_list)
    except Exception as e:
        log.exception("Error in get_completed_tasks_route")
        return jsonify({"error": "An internal server error occurred getting completed tasks"}), 500

# --- NEW: Delete All Completed ---
@app.route('/api/completed_tasks/all', methods=['DELETE'])
def delete_all_completed_route():
    """Soft deletes ALL completed tasks (moves them to deleted_tasks)."""
    log.info("DELETE /api/completed_tasks/all request received.")
    try:
        ids_to_move = []
        # --- DB Interaction Placeholder ---
        # Replace with: SELECT id FROM tasks WHERE completed = true AND deletedAt IS NULL;
        # Then loop through IDs and update/move
        for task_id, task in list(tasks.items()): # Iterate over a copy of items
            if task.get('completed') and not task.get('deletedAt'):
                ids_to_move.append(task_id)

        moved_count = 0
        for task_id in ids_to_move:
            task_to_delete = tasks.pop(task_id)
            task_to_delete['deletedAt'] = datetime.datetime.now()
            deleted_tasks[task_id] = task_to_delete
            moved_count += 1

        log.info(f"Soft deleted {moved_count} completed tasks.")
        return jsonify({"message": f"{moved_count} completed tasks moved to deleted list"}), 200
    except Exception as e:
        log.exception("Error deleting all completed tasks")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/api/deleted_tasks', methods=['GET'])
def get_deleted_tasks_route():
    """Gets all tasks currently in the deleted_tasks dictionary."""
    log.info("GET /api/deleted_tasks request received.")
    try:
        # --- DB Interaction Placeholder ---
        # Replace with: SELECT * FROM tasks WHERE deletedAt IS NOT NULL; (if using flag)
        # Or: SELECT * FROM deleted_tasks; (if using separate table)
        deleted_list = [task_to_dict_for_json(t) for t in deleted_tasks.values() if t]
        # Sort by deletion date descending
        deleted_list.sort(
            key=lambda x: datetime.datetime.fromisoformat(x['deletedAt']) if x.get('deletedAt') else datetime.datetime.min,
            reverse=True
        )
        log.info(f"Returning {len(deleted_list)} deleted tasks.")
        return jsonify(deleted_list)
    except Exception as e:
        log.exception("Error in get_deleted_tasks_route")
        return jsonify({"error": "An internal server error occurred getting deleted tasks"}), 500

@app.route('/api/deleted_tasks/<int:task_id>/restore', methods=['POST'])
def restore_task_route(task_id):
    """Restores a task from the deleted list back to the active tasks list."""
    log.info(f"POST /api/deleted_tasks/{task_id}/restore request received.")
    # --- DB Interaction Placeholder ---
    # Replace with: UPDATE tasks SET deletedAt = NULL, completed = false, completedAt = NULL WHERE id = task_id;
    # (Or move from deleted_tasks table back to tasks table)
    if task_id in deleted_tasks:
        task_to_restore = deleted_tasks.pop(task_id)
        task_to_restore['deletedAt'] = None
        # Restore implies making it active again, so clear completion status too
        task_to_restore['completed'] = False
        task_to_restore['completedAt'] = None
        tasks[task_id] = task_to_restore
        log.info(f"Task restored (ID: {task_id})")
        return jsonify({"message": "Task restored successfully"}), 200
    else:
        log.warning(f"Restore failed: Task not found in deleted list (ID: {task_id})")
        return jsonify({"error": "Task not found in deleted list"}), 404

# --- NEW: Restore All Deleted ---
@app.route('/api/deleted_tasks/all/restore', methods=['POST'])
def restore_all_deleted_route():
    """Restores ALL tasks from the deleted list back to active."""
    log.info("POST /api/deleted_tasks/all/restore request received.")
    try:
        ids_to_restore = list(deleted_tasks.keys()) # Get all keys before modifying
        restored_count = 0
        # --- DB Interaction Placeholder ---
        # Replace with: UPDATE tasks SET deletedAt = NULL, completed = false, completedAt = NULL WHERE deletedAt IS NOT NULL;
        for task_id in ids_to_restore:
            if task_id in deleted_tasks: # Check again in case of concurrent requests
                task_to_restore = deleted_tasks.pop(task_id)
                task_to_restore['deletedAt'] = None
                task_to_restore['completed'] = False
                task_to_restore['completedAt'] = None
                tasks[task_id] = task_to_restore
                restored_count += 1
        log.info(f"Restored {restored_count} deleted tasks.")
        return jsonify({"message": f"{restored_count} tasks restored successfully"}), 200
    except Exception as e:
        log.exception("Error restoring all deleted tasks")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/api/deleted_tasks/<int:task_id>', methods=['DELETE'])
def permanent_delete_task_route(task_id):
    """Permanently deletes a task from the deleted_tasks dictionary."""
    log.info(f"DELETE /api/deleted_tasks/{task_id} request received (Permanent).")
    # --- DB Interaction Placeholder ---
    # Replace with: DELETE FROM tasks WHERE id = task_id AND deletedAt IS NOT NULL;
    # Or: DELETE FROM deleted_tasks WHERE id = task_id;
    if task_id in deleted_tasks:
        deleted_tasks.pop(task_id)
        log.info(f"Task permanently deleted (ID: {task_id})")
        return jsonify({"message": "Task permanently deleted"}), 200
    else:
        log.warning(f"Permanent delete failed: Task not found in deleted list (ID: {task_id})")
        return jsonify({"error": "Task not found in deleted list"}), 404

# --- NEW: Delete All Permanently ---
@app.route('/api/deleted_tasks/all', methods=['DELETE'])
def permanent_delete_all_route():
    """Permanently deletes ALL tasks from the deleted_tasks dictionary."""
    log.info("DELETE /api/deleted_tasks/all request received (Permanent).")
    try:
        # --- DB Interaction Placeholder ---
        # Replace with: DELETE FROM tasks WHERE deletedAt IS NOT NULL;
        # Or: DELETE FROM deleted_tasks;
        count = len(deleted_tasks)
        deleted_tasks.clear()
        log.info(f"Permanently deleted {count} tasks from deleted list.")
        return jsonify({"message": f"{count} tasks permanently deleted"}), 200
    except Exception as e:
        log.exception("Error permanently deleting all tasks")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/api/due_tasks', methods=['GET'])
def get_due_tasks_route():
    """
    Checks for and returns ALL tasks that are currently due
    (due time is now or in the past, and not completed/deleted).
    Sorted by priority (desc) then due date (asc).
    """
    log.info("GET /api/due_tasks request received.")
    now = datetime.datetime.now()
    due_now_tasks = []
    # --- DB Interaction Placeholder ---
    # Replace with: SELECT * FROM tasks WHERE dueDate <= NOW() AND completed = false AND deletedAt IS NULL;
    current_tasks_list = list(tasks.values())

    for task in current_tasks_list:
         due_date = task.get('dueDate')
         if (not task.get('completed') and not task.get('deletedAt') and
                 due_date and isinstance(due_date, datetime.datetime) and
                 due_date <= now):
              # Keep original task dict with datetime objects for sorting
              due_now_tasks.append(task)

    if not due_now_tasks:
        log.info("No tasks currently due.")
        return jsonify([]) # Return empty array if no tasks are due

    # Sort due tasks: High > Medium > Low, then earliest due date first
    due_now_tasks.sort(key=lambda t: (
        -get_priority_value(t.get('priority')), # Negate priority score for descending
        t['dueDate']                            # Ascending sort for dueDate
    ))

    log.info(f"Found {len(due_now_tasks)} due tasks.")
    # Convert all due tasks to JSON serializable format
    serializable_due_tasks = [task_to_dict_for_json(t) for t in due_now_tasks if t]
    return jsonify(serializable_due_tasks)

# Add this function somewhere in app.py

@app.route('/api/parse-datetime', methods=['POST'])
def parse_datetime_natural():
    """
    Parses a natural language date/time string using dateutil.parser.
    Expects JSON: {"text": "natural language string"}
    Returns JSON: {"original": text, "iso": iso_string, "date_str": "DD/MM/YYYY", "time_str": "H:MM AM/PM"} or {"error": ...}
    """
    if not request.is_json:
        log.warning("/api/parse-datetime - Request is not JSON")
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.json
    text_to_parse = data.get('text')

    if not text_to_parse:
        log.warning("/api/parse-datetime - Missing 'text' in JSON body")
        return jsonify({"error": "Missing 'text' field in request body"}), 400

    log.info(f"/api/parse-datetime - Attempting to parse: '{text_to_parse}'")

    try:
        # Use dateutil.parser - it's quite flexible
        # dayfirst=True helps interpret ambiguous dates like 01/05/2025 as 1st May
        parsed_dt = dateutil_parser.parse(text_to_parse, dayfirst=True, fuzzy=False)
        # fuzzy=False tries to prevent matching parts of other words

        # You might want to return components formatted according to user settings,
        # but sending back standard formats (ISO, and maybe common UI formats)
        # gives the frontend flexibility.

        # Note: We don't know user's settings (12/24hr, DDMM/MMDD) here easily.
        # Let's return ISO and common formats. Frontend can use what it needs.
        response_data = {
            "original": text_to_parse,
            "iso": parsed_dt.isoformat(),
            # Example formats - adjust as needed, or let frontend handle formatting
            "date_str_dmy": parsed_dt.strftime('%d/%m/%Y'), # DD/MM/YYYY
            "date_str_mdy": parsed_dt.strftime('%m/%d/%Y'), # MM/DD/YYYY
            "time_str_12": parsed_dt.strftime('%I:%M %p').lstrip('0'), # H:MM AM/PM (remove leading 0)
            "time_str_24": parsed_dt.strftime('%H:%M') # HH:MM
        }
        log.info(f"/api/parse-datetime - Parsed successfully: {response_data}")
        return jsonify(response_data), 200

    except (dateutil_parser.ParserError, ValueError, TypeError) as e:
        log.warning(f"/api/parse-datetime - Failed to parse '{text_to_parse}': {e}")
        return jsonify({
            "original": text_to_parse,
            "error": f"Could not understand date/time: '{text_to_parse}'"
        }), 400
    except Exception as e:
         log.exception(f"/api/parse-datetime - Unexpected error parsing '{text_to_parse}'")
         return jsonify({"error": "An unexpected error occurred during parsing"}), 500

# --- End of new function ---

# Ensure this new route is within your Flask app structure
# (e.g., before the `if __name__ == '__main__':` block)

# --- Placeholder for BLE/STT ---
@app.route('/api/receive_ble_data', methods=['POST'])
def receive_ble_data():
    """ Placeholder for receiving audio/commands from ESP32 """
    log.warning("Received call to placeholder /api/receive_ble_data")
    # TODO: Implement BLE reception, STT call, parsing, and task creation/modification
    return jsonify({"error": "BLE/STT endpoint not implemented"}), 501

# --- Main Execution ---
if __name__ == '__main__':
    log.info("Starting Flask server...")
    # Use host='0.0.0.0' to make accessible on local network
    # Set debug=False for production deployment
    # Use a proper WSGI server (like gunicorn or waitress) in production
    app.run(debug=True, host='0.0.0.0', port=5000)
