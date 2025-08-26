# Small runner to execute pytest programmatically and emit a clear exit code
import sys
import pytest

if __name__ == '__main__':
    # Run tests in this tests directory
    exit_code = pytest.main(['-q', '-r', 'a', 'e:/ManageMe/tests/test_api.py'])
    sys.exit(exit_code)
