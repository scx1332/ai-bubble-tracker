#!/usr/bin/env python3
"""Inline all CSS/JS into a single self-contained dist/index.html."""
import pathlib, re

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()

css = (root / "src/styles.css").read_text()
html = html.replace('<link rel="stylesheet" href="src/styles.css">', "<style>\n" + css + "\n</style>")

for name in ["data", "model", "sankey", "charts", "ui"]:
    js = (root / f"src/{name}.js").read_text()
    html = html.replace(f'<script src="src/{name}.js"></script>', "<script>\n" + js + "\n</script>")

assert "src/" not in html, "unresolved src/ reference remains"
out = root / "dist"
out.mkdir(exist_ok=True)
(out / "index.html").write_text(html)
print(f"dist/index.html written ({len(html)//1024} KB)")

# Artifact variant: hosts that wrap content in their own <html>/<head>/<body>
# skeleton want body-content only (plus <title>/<style>, which they hoist).
style = re.search(r"<style>.*?</style>", html, re.S).group(0)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
artifact = "<title>AI Bubble Simulator</title>\n" + style + "\n" + body
(out / "artifact.html").write_text(artifact)
print(f"dist/artifact.html written ({len(artifact)//1024} KB)")
