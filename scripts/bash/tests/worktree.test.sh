#!/usr/bin/env bash
set -euo pipefail

source_root="$(git rev-parse --show-toplevel)"
script_path="$source_root/scripts/bash/worktree.sh"
temp_root="$(mktemp -d)"
test_repo="$temp_root/repo"
test_worktrees="$temp_root/worktrees"

cleanup() {
	if [[ -d "$test_repo" ]]; then
		git -C "$test_repo" worktree remove --force "$test_worktrees/web/smoke" >/dev/null 2>&1 || true
	fi
	rm -rf "$temp_root"
}

trap cleanup EXIT

mkdir -p "$test_repo/.agents/roles"
touch "$test_repo/.agents/roles/web.md"
git init --quiet --initial-branch=main "$test_repo"
git -C "$test_repo" config user.email "worktree-test@example.invalid"
git -C "$test_repo" config user.name "worktree test"
printf '# worktree test\n' > "$test_repo/README.md"
git -C "$test_repo" add README.md .agents
git -C "$test_repo" commit --quiet --no-verify -m "test: initialize worktree fixture"

(
	cd "$test_repo"
	PERSONAL_OS_WORKTREE_ROOT="$test_worktrees" bash "$script_path" add web smoke main
)

[[ -d "$test_worktrees/web/smoke" ]]
[[ "$(cd "$test_repo" && PERSONAL_OS_WORKTREE_ROOT="$test_worktrees" bash "$script_path" path web smoke)" == "$test_worktrees/web/smoke" ]]
git -C "$test_repo" worktree list --porcelain | grep -Fqx -- "worktree $test_worktrees/web/smoke"

(
	cd "$test_repo"
	PERSONAL_OS_WORKTREE_ROOT="$test_worktrees" bash "$script_path" remove web smoke
)

[[ ! -e "$test_worktrees/web/smoke" ]]
echo "worktree script test passed"
