import traceback
import os
import sys
import json
# Ensure project root is on sys.path so `import app` works when running this script from tests/
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from app import app, create_db_tables, get_db

print('Starting manual test runner...')
# Use a temp DB file path in current folder tests to avoid clobbering dev DB
TEST_DB = os.path.abspath('e:/ManageMe/tests/test_manageme_tmp.db')
# ensure app uses this DB
import importlib
import app as app_module
importlib.reload(app_module)
# set module-level DATABASE path so get_db uses the temp file
app_module.DATABASE = TEST_DB
from app import app, create_db_tables, get_db
# Ensure fresh DB
try:
    if os.path.exists(TEST_DB): os.remove(TEST_DB)
except Exception:
    pass

create_db_tables()

client = app.test_client()

failures = 0

# Test 1: GET /api/tasks default today
try:
    print('\nTest 1: GET /api/tasks (default today)')
    resp = client.get('/api/tasks')
    print('Status code:', resp.status_code)
    data = resp.get_json()
    print('Response type:', type(data))
    assert resp.status_code == 200
    assert isinstance(data, list)
    print('PASS: Test 1')
except Exception as e:
    failures += 1
    print('FAIL: Test 1')
    traceback.print_exc()

# Test 2: Snooze endpoint and snoozed list
try:
    print('\nTest 2: Snooze endpoint and /api/tasks/snoozed')
    with app.app_context():
        db = get_db(); cur = db.cursor()
        cur.execute("INSERT INTO tasks (description, dueDate, priority, createdAt) VALUES (?,?,?,?)", (
            'Test Snooze', '2099-01-01T09:00:00', 'priority-medium', '2099-01-01T00:00:00'
        ))
        db.commit()
        task_id = cur.lastrowid
    resp = client.post(f'/api/tasks/{task_id}/snooze', json={'duration':'10m'})
    print('Snooze status:', resp.status_code)
    resdata = resp.get_json()
    print('Snooze response keys:', list(resdata.keys()) if isinstance(resdata, dict) else resdata)
    assert resp.status_code == 200
    assert 'snoozedUntil' in resdata
    resp2 = client.get('/api/tasks/snoozed')
    print('/api/tasks/snoozed status:', resp2.status_code)
    listdata = resp2.get_json()
    assert resp2.status_code == 200
    assert isinstance(listdata, list)
    print('PASS: Test 2')
except Exception as e:
    failures += 1
    print('FAIL: Test 2')
    traceback.print_exc()

# Test 3: AI assistant add task
try:
    print('\nTest 3: AI assistant add task')
    messages = [ {'role':'user', 'content':'Add walk the dog tomorrow at 10am'} ]
    resp = client.post('/api/ai/assist', json={'messages': messages})
    print('AI status:', resp.status_code)
    data = resp.get_json()
    print('AI response keys:', data.keys() if isinstance(data, dict) else data)
    assert resp.status_code == 200
    assert 'message' in data
    with app.app_context():
        db = get_db(); cur = db.cursor()
        cur.execute('SELECT COUNT(*) as c FROM tasks')
        c = cur.fetchone()['c']
    print('Total tasks in DB:', c)
    assert c > 0
    print('PASS: Test 3')
except Exception as e:
    failures += 1
    print('FAIL: Test 3')
    traceback.print_exc()

print(f"\nManual tests completed. Failures: {failures}")
if failures:
    raise SystemExit(1)
