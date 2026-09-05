"""Python version compatibility utilities."""

import sys
from datetime import timezone

# Python 3.10 compat: datetime.UTC was added in 3.11
if sys.version_info >= (3, 11):
    from datetime import UTC
else:
    UTC = timezone.utc
