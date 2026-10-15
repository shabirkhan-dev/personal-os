"""Reads the text of a public job page, refusing anything that could reach a private network."""

import asyncio
import ipaddress
import re
import socket
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import httpx

from ai_api.domain.errors import AiApiError

MAX_BYTES = 2_000_000
MAX_REDIRECTS = 3
MAX_TEXT = 12_000
#: Shorter than this, the page is a sign-in wall or a script shell, not a job post.
MIN_TEXT = 200
TIMEOUT = httpx.Timeout(10.0)


class PageUnreadableError(AiApiError):
    def __init__(self, reason: str) -> None:
        super().__init__(reason, code="JOB_LINK_UNREADABLE")


async def fetch_page_text(url: str) -> str:
    """Follows up to three redirects, checking every hop resolves to a public address."""
    current = url
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            await _assert_public(current)
            try:
                async with client.stream(
                    "GET",
                    current,
                    headers={"User-Agent": "PersonalOS/1.0 (job reader)", "Accept": "text/html"},
                ) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise PageUnreadableError("The page redirected without a target")
                        current = urljoin(current, location)
                        continue
                    if response.status_code >= 400:
                        raise PageUnreadableError(f"The page answered {response.status_code}")
                    body = await _read_limited(response)
                    break
            except httpx.HTTPError as error:
                raise PageUnreadableError("The page could not be loaded") from error
        else:
            raise PageUnreadableError("Too many redirects")

    text = html_to_text(body.decode("utf-8", errors="replace"))
    if len(text) < MIN_TEXT:
        raise PageUnreadableError("The page needs a sign-in or blocks reading")
    return text[:MAX_TEXT]


async def _read_limited(response: httpx.Response) -> bytes:
    chunks: list[bytes] = []
    size = 0
    async for chunk in response.aiter_bytes():
        size += len(chunk)
        if size > MAX_BYTES:
            raise PageUnreadableError("The page is too large to read")
        chunks.append(chunk)
    return b"".join(chunks)


async def _assert_public(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise PageUnreadableError("Only http and https links can be read")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(
            parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80)
        )
    except socket.gaierror as error:
        raise PageUnreadableError("The site's address could not be found") from error
    for info in infos:
        address = ipaddress.ip_address(info[4][0])
        if not address.is_global:
            raise PageUnreadableError("Links to private or local addresses are not read")


class _TextExtractor(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head", "template"}
    BLOCK = {"p", "div", "li", "br", "h1", "h2", "h3", "h4", "section", "article", "tr"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skipping = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.SKIP:
            self._skipping += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.SKIP and self._skipping:
            self._skipping -= 1

    def handle_data(self, data: str) -> None:
        if not self._skipping:
            self.parts.append(data)


def html_to_text(html: str) -> str:
    extractor = _TextExtractor()
    extractor.feed(html)
    text = "".join(extractor.parts)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    return re.sub(r"\n\s*\n+", "\n", text).strip()
