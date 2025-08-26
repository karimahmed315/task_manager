import json
import os
import tempfile
import pytest
from app import app, create_db_tables, get_db

@pytest.fixture
def client(tmp_path, monkeypatch):
    # Use a temporary database file
    db_file = tmp_path / "test_manageme.db"
    monkeypatch.setattr('app.DATABASE', str(db_file))
    # Ensure tables exist
    create_db_tables()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_get_tasks_default_today(client):
    # No tasks initially
    resp = client.get('/api/tasks')
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)

def test_snooze_endpoint_and_snoozed_list(client):
    # Insert a task directly
    db = get_db()
    cur = db.cursor()
    cur.execute("INSERT INTO tasks (description, dueDate, priority, createdAt) VALUES (?,?,?,?)", (
        'Test Snooze', '2099-01-01T09:00:00', 'priority-medium', '2099-01-01T00:00:00'
    ))
    db.commit()
    task_id = cur.lastrowid
    # Snooze it for 10m
    resp = client.post(f'/api/tasks/{task_id}/snooze', json={'duration':'10m'})
    assert resp.status_code == 200
    resdata = resp.get_json()
    assert 'snoozedUntil' in resdata
    # Now query /api/tasks/snoozed
    resp2 = client.get('/api/tasks/snoozed')
    assert resp2.status_code == 200
    listdata = resp2.get_json()
    assert isinstance(listdata, list)

def test_ai_add_task(client):
    # Send AI add instruction
    messages = [ {'role':'user', 'content':'Add walk the dog tomorrow at 10am'} ]
    resp = client.post('/api/ai/assist', json={'messages': messages})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'message' in data
    # Should have inserted a task
    db = get_db(); cur = db.cursor()
    cur.execute("SELECT COUNT(*) as c FROM tasks")
    assert cur.fetchone()['c'] > 0
