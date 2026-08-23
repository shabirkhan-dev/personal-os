import subprocess
import unittest


class MainScriptTest(unittest.TestCase):
    def test_main_output(self) -> None:
        result = subprocess.run(
            ["python", "scripts/python/main.py"],
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertIn("Hello from Personal OS scripts (python)", result.stdout)


if __name__ == "__main__":
    unittest.main()
