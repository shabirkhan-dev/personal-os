#!/usr/bin/env bash
# Manage isolated Personal OS worktrees for agent roles.
set -euo pipefail

die() {
	echo "error: $*" >&2
	exit 2
}

usage() {
	cat <<'EOF'
Usage:
  bun run worktree -- list
  bun run worktree -- add <role> [card-slug] [base-ref]
  bun run worktree -- path <role> [card-slug]
  bun run worktree -- remove <role> [card-slug]
  bun run worktree -- remove --force <role> [card-slug]
  bun run worktree -- prune

Environment:
  PERSONAL_OS_WORKTREE_ROOT  Worktree parent directory. Default: <repo>-worktrees
  PERSONAL_OS_WORKTREE_BASE  Default base ref for add. Default: main

Examples:
  bun run worktree -- add backend-auth auth-refresh
  bun run worktree -- add mobile finance-budget main
  bun run worktree -- list
EOF
}

repo_root() {
	local common_git_dir
	common_git_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" ||
		die "run this command inside a Git repository"

	[[ -d "$common_git_dir" ]] || die "Git common directory does not exist: $common_git_dir"
	dirname "$common_git_dir"
}

readonly REPO_ROOT="$(repo_root)"
readonly WORKTREE_ROOT="${PERSONAL_OS_WORKTREE_ROOT:-${REPO_ROOT}-worktrees}"
readonly DEFAULT_BASE_REF="${PERSONAL_OS_WORKTREE_BASE:-main}"

valid_identifier() {
	[[ "$1" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]
}

require_identifier() {
	local label="$1"
	local value="$2"
	valid_identifier "$value" || die "$label must use lowercase kebab-case: $value"
}

require_role() {
	local role="$1"
	require_identifier "role" "$role"
	[[ -f "$REPO_ROOT/.agents/roles/$role.md" ]] ||
		die "unknown role '$role'; add a charter under .agents/roles/ first"
}

worktree_path() {
	local role="$1"
	local slug="${2:-}"

	if [[ -n "$slug" ]]; then
		printf '%s/%s/%s\n' "$WORKTREE_ROOT" "$role" "$slug"
	else
		printf '%s/%s\n' "$WORKTREE_ROOT" "$role"
	fi
}

branch_name() {
	local role="$1"
	local slug="${2:-}"

	if [[ -n "$slug" ]]; then
		printf 'agent/%s/%s\n' "$role" "$slug"
	else
		printf 'agent/%s\n' "$role"
	fi
}

validate_slug() {
	local slug="${1:-}"
	[[ -z "$slug" ]] || require_identifier "card slug" "$slug"
}

add_worktree() {
	[[ $# -ge 1 && $# -le 3 ]] || {
		usage >&2
		exit 2
	}

	local role="$1"
	local slug="${2:-}"
	local base_ref="${3:-$DEFAULT_BASE_REF}"
	local branch
	local path
	local status

	require_role "$role"
	validate_slug "$slug"
	branch="$(branch_name "$role" "$slug")"
	path="$(worktree_path "$role" "$slug")"

	git -C "$REPO_ROOT" rev-parse --verify "$base_ref^{commit}" >/dev/null 2>&1 ||
		die "base ref does not resolve to a commit: $base_ref"
	git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch" &&
		die "branch already exists: $branch"
	[[ ! -e "$path" && ! -L "$path" ]] || die "worktree path already exists: $path"

	status="$(git -C "$REPO_ROOT" status --porcelain)"
	if [[ -n "$status" ]]; then
		echo "warning: main worktree has uncommitted changes; $path starts from $base_ref and will not include them" >&2
	fi

	mkdir -p "$(dirname "$path")"
	git -C "$REPO_ROOT" worktree add -b "$branch" "$path" "$base_ref"

	echo "created worktree: $path"
	echo "branch: $branch"
	echo "next: cd $path && bun install --frozen-lockfile"
}

show_path() {
	[[ $# -ge 1 && $# -le 2 ]] || {
		usage >&2
		exit 2
	}

	local role="$1"
	local slug="${2:-}"

	require_role "$role"
	validate_slug "$slug"
	worktree_path "$role" "$slug"
}

remove_worktree() {
	local force=false

	if [[ "${1:-}" == "--force" ]]; then
		force=true
		shift
	fi

	[[ $# -ge 1 && $# -le 2 ]] || {
		usage >&2
		exit 2
	}

	local role="$1"
	local slug="${2:-}"
	local path
	local status

	require_role "$role"
	validate_slug "$slug"
	path="$(worktree_path "$role" "$slug")"

	[[ "$path" == "$WORKTREE_ROOT"/* ]] || die "refusing to remove a path outside the worktree root"
	[[ -e "$path" || -L "$path" ]] || die "worktree path does not exist: $path"
	git -C "$REPO_ROOT" worktree list --porcelain | grep -Fqx -- "worktree $path" ||
		die "path is not a registered Git worktree: $path"

	status="$(git -C "$path" status --porcelain)"
	if [[ -n "$status" && "$force" != true ]]; then
		die "worktree has uncommitted changes; commit them or use remove --force: $path"
	fi

	if [[ "$force" == true ]]; then
		git -C "$REPO_ROOT" worktree remove --force "$path"
	else
		git -C "$REPO_ROOT" worktree remove "$path"
	fi

	echo "removed worktree: $path"
}

main() {
	local action="${1:-help}"
	shift || true

	case "$action" in
	add)
		add_worktree "$@"
		;;
	list)
		[[ $# -eq 0 ]] || die "list does not accept arguments"
		git -C "$REPO_ROOT" worktree list
		;;
	path)
		show_path "$@"
		;;
remove)
		remove_worktree "$@"
		;;
prune)
		[[ $# -eq 0 ]] || die "prune does not accept arguments"
		git -C "$REPO_ROOT" worktree prune
		echo "pruned stale worktree metadata"
		;;
help|-h|--help)
		usage
		;;
*)
		echo "error: unknown action: $action" >&2
		usage >&2
		exit 2
		;;
	esac
}

main "$@"
