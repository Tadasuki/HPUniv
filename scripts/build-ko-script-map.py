#!/usr/bin/env python3
"""Build the runtime Hangul <-> Hanja-Hangul dictionary.

The script reads paired Korean Markdown files (`*.ko.md` and `*.oko.md`),
paired i18n files, and `ko`/`oko` strings in the site params. It writes a
small JSON dictionary used by the front-end one-click script toggle.
"""

from __future__ import annotations

import argparse
import ast
import difflib
import json
import re
from pathlib import Path


HANGUL_RE = re.compile(r"[\uac00-\ud7a3]")
HANJA_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
HANGUL_TERM_RE = re.compile(r"^[\uac00-\ud7a3 ]+$")
MIXED_TERM_RE = re.compile(r"^[\u3400-\u4dbf\u4e00-\u9fffA-Za-z0-9 /.-]+$")
MARKDOWN_PREFIX_RE = re.compile(r"^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)")
SCALAR_RE = re.compile(r"^(\s*)([A-Za-z0-9_.-]+):(?:\s+(.*))?$")


def clean_scalar(value: str) -> str:
    value = value.strip()
    if not value or value.startswith("#"):
        return ""
    if " #" in value:
        value = value.split(" #", 1)[0].rstrip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
        return value[1:-1]
    return value


def clean_markdown(value: str) -> str:
    value = MARKDOWN_PREFIX_RE.sub("", value.strip())
    value = value.strip("`*_ ")
    return value


def split_front_matter(text: str) -> tuple[str, str]:
    if not text.startswith("---\n"):
        return "", text
    end = text.find("\n---", 4)
    if end == -1:
        return "", text
    return text[4:end], text[end + 4 :]


def parse_front_matter_values(front_matter: str) -> list[str]:
    values: list[str] = []
    for line in front_matter.splitlines():
        match = SCALAR_RE.match(line)
        if not match:
            continue
        key = match.group(2)
        raw = clean_scalar(match.group(3) or "")
        if key not in {"title", "tags", "categories"} or not raw:
            continue
        if raw.startswith("[") and raw.endswith("]"):
            try:
                parsed = ast.literal_eval(raw)
            except (SyntaxError, ValueError):
                parsed = []
            values.extend(str(item).strip() for item in parsed if str(item).strip())
        else:
            values.append(raw)
    return values


def parse_markdown_units(path: Path) -> list[str]:
    front_matter, body = split_front_matter(path.read_text(encoding="utf-8"))
    units = parse_front_matter_values(front_matter)
    paragraph: list[str] = []
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            if paragraph:
                units.append(clean_markdown(" ".join(paragraph)))
                paragraph = []
            continue
        paragraph.append(stripped)
    if paragraph:
        units.append(clean_markdown(" ".join(paragraph)))
    return [unit for unit in units if unit]


def parse_simple_yaml_values(path: Path) -> dict[tuple[str, ...], str]:
    values: dict[tuple[str, ...], str] = {}
    stack: list[tuple[int, str]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = SCALAR_RE.match(line)
        if not match:
            continue
        indent = len(match.group(1))
        key = match.group(2)
        raw_value = clean_scalar(match.group(3) or "")
        while stack and stack[-1][0] >= indent:
            stack.pop()
        path_key = tuple(item[1] for item in stack) + (key,)
        if raw_value:
            values[path_key] = raw_value
        else:
            stack.append((indent, key))
    return values


def add_pair(
    pairs: set[tuple[str, str]],
    hangul: str,
    mixed: str,
) -> None:
    hangul = clean_markdown(hangul)
    mixed = clean_markdown(mixed)
    if hangul and mixed and hangul != mixed:
        pairs.add((hangul, mixed))


def add_aligned_units(
    pairs: set[tuple[str, str]],
    hangul_units: list[str],
    mixed_units: list[str],
) -> None:
    for hangul, mixed in zip(hangul_units, mixed_units):
        add_pair(pairs, hangul, mixed)


def term_candidates(hangul: str, mixed: str) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []
    matcher = difflib.SequenceMatcher(None, hangul, mixed, autojunk=False)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        source = hangul[i1:i2].strip()
        target = mixed[j1:j2].strip()
        if not source or not target or source == target:
            continue
        if len(source) < 2:
            continue
        if len(source) > 18 or len(target) > 18:
            continue
        if "\n" in source or "\n" in target:
            continue
        if not HANGUL_TERM_RE.fullmatch(source):
            continue
        if not MIXED_TERM_RE.fullmatch(target):
            continue
        if not HANGUL_RE.search(target) and (HANJA_RE.search(target) or re.search(r"[A-Za-z]", target)):
            candidates.append((source, target))
    return candidates


def build_dictionary(
    root: Path,
    input_pairs: list[tuple[Path, Path]] | None = None,
) -> dict[str, object]:
    phrase_pairs: set[tuple[str, str]] = set()

    for ko_path in sorted((root / "content").rglob("*.ko.md")):
        oko_path = ko_path.with_name(ko_path.name.replace(".ko.md", ".oko.md"))
        if oko_path.exists():
            add_aligned_units(
                phrase_pairs,
                parse_markdown_units(ko_path),
                parse_markdown_units(oko_path),
            )

    for ko_path, oko_path in input_pairs or []:
        if not ko_path.exists():
            raise FileNotFoundError(f"Hangul file not found: {ko_path}")
        if not oko_path.exists():
            raise FileNotFoundError(f"mixed-script file not found: {oko_path}")
        add_aligned_units(
            phrase_pairs,
            parse_markdown_units(ko_path),
            parse_markdown_units(oko_path),
        )

    ko_i18n = root / "i18n" / "ko.yml"
    oko_i18n = root / "i18n" / "oko.yml"
    if ko_i18n.exists() and oko_i18n.exists():
        ko_values = parse_simple_yaml_values(ko_i18n)
        oko_values = parse_simple_yaml_values(oko_i18n)
        for key, hangul in ko_values.items():
            if key in oko_values:
                add_pair(phrase_pairs, hangul, oko_values[key])

    params_path = root / "config" / "_default" / "params.yml"
    if params_path.exists():
        params = parse_simple_yaml_values(params_path)
        for key, hangul in params.items():
            if key[-1:] != ("ko",):
                continue
            mixed = params.get(key[:-1] + ("oko",))
            if mixed:
                add_pair(phrase_pairs, hangul, mixed)

    term_by_hangul: dict[str, str] = {}
    mixed_terms: set[str] = set()
    for hangul, mixed in sorted(phrase_pairs, key=lambda item: len(item[0])):
        for source, target in term_candidates(hangul, mixed):
            if source in term_by_hangul or target in mixed_terms:
                continue
            term_by_hangul[source] = target
            mixed_terms.add(target)

    phrases = [
        {"hangul": hangul, "mixed": mixed}
        for hangul, mixed in sorted(
            phrase_pairs,
            key=lambda item: (-max(len(item[0]), len(item[1])), item[0], item[1]),
        )
    ]
    terms = [
        {"hangul": hangul, "mixed": mixed}
        for hangul, mixed in sorted(
            term_by_hangul.items(),
            key=lambda item: (-max(len(item[0]), len(item[1])), item[0], item[1]),
        )
    ]
    return {
        "version": 1,
        "phrases": phrases,
        "terms": terms,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build static/data/ko-script-map.json from paired Korean content."
    )
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("static/data/ko-script-map.json"),
    )
    parser.add_argument(
        "--ko",
        action="append",
        type=Path,
        default=[],
        help="Extra Hangul Markdown file. Pair by order with --oko.",
    )
    parser.add_argument(
        "--oko",
        action="append",
        type=Path,
        default=[],
        help="Extra Hanja-Hangul mixed Markdown file. Pair by order with --ko.",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    if len(args.ko) != len(args.oko):
        parser.error("--ko and --oko must be provided in pairs")
    input_pairs = [
        (
            ko_path if ko_path.is_absolute() else root / ko_path,
            oko_path if oko_path.is_absolute() else root / oko_path,
        )
        for ko_path, oko_path in zip(args.ko, args.oko)
    ]
    output = args.output if args.output.is_absolute() else root / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    dictionary = build_dictionary(root, input_pairs)
    output.write_text(
        json.dumps(dictionary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    try:
        output_label = output.relative_to(root)
    except ValueError:
        output_label = output
    print(
        f"Wrote {output_label} "
        f"({len(dictionary['phrases'])} phrases, {len(dictionary['terms'])} terms)"
    )


if __name__ == "__main__":
    main()
