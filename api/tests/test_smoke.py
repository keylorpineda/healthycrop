"""Empty suite smoke test for Phase 0 CI verification."""

from healthycrop_api import __version__


def test_version() -> None:
    assert __version__ == "0.1.0"
