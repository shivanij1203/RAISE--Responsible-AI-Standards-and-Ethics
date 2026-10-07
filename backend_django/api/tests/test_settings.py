"""Settings helpers that decide which database the app talks to."""
from django.test import SimpleTestCase

from raise_project.settings import database_config


class DatabaseConfigTest(SimpleTestCase):
    def test_unset_url_uses_local_sqlite(self) -> None:
        config = database_config(None)

        self.assertEqual(config['ENGINE'], 'django.db.backends.sqlite3')
        self.assertTrue(str(config['NAME']).endswith('db.sqlite3'))

    def test_blank_url_uses_local_sqlite(self) -> None:
        for blank in ('', '   '):
            config = database_config(blank)
            self.assertEqual(config['ENGINE'], 'django.db.backends.sqlite3')

    def test_postgres_url_is_used_when_set(self) -> None:
        config = database_config('postgres://user:pass@db.example.com:5432/raise')

        self.assertEqual(config['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(config['HOST'], 'db.example.com')
