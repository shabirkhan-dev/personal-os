# Dev container: Bun, Python (scripts), Bash tooling.
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ARG BUN_VERSION=1.3.13

# Shell/Python tooling used by repo scripts (no C/Lua toolchain).
RUN apt-get update && apt-get install -y --no-install-recommends \
	curl \
	git \
	ca-certificates \
	shellcheck \
	python3 \
	python3-pip \
	python3-venv \
	&& rm -rf /var/lib/apt/lists/*

USER vscode
WORKDIR /home/vscode

# Bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}" \
	&& echo 'export BUN_INSTALL="$HOME/.bun"' >> "${HOME}/.bashrc" \
	&& echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "${HOME}/.bashrc"
ENV BUN_INSTALL="/home/vscode/.bun" \
	PATH="/home/vscode/.bun/bin:${PATH}"


# Ruff for scripts/python
RUN pip install --user ruff 2>/dev/null || true

# shfmt for bash scripts
RUN set -e; \
	SHFMT_VER="v3.8.0"; \
	curl -sSL "https://github.com/mvdan/sh/releases/download/${SHFMT_VER}/shfmt_${SHFMT_VER}_linux_amd64" -o /tmp/shfmt; \
	chmod +x /tmp/shfmt; \
	mkdir -p "${HOME}/.local/bin"; \
	mv /tmp/shfmt "${HOME}/.local/bin/shfmt"; \
	echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.bashrc"
ENV PATH="/home/vscode/.local/bin:${PATH}"

USER root
RUN echo 'export PATH="/home/vscode/.bun/bin:/home/vscode/.local/bin:${PATH}"' >> /etc/profile.d/devcontainer-path.sh
USER vscode
ENV PATH="/home/vscode/.bun/bin:/home/vscode/.local/bin:${PATH}"
