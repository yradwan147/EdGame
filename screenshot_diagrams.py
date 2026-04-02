#!/usr/bin/env python3
"""Screenshot all HTML diagrams as full-page PNGs using Playwright."""

from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent
DIAGRAMS_DIR = BASE / "TIE204Assignments" / "diagrams"
OUTPUT_DIR = BASE / "TIE204Assignments" / "diagrams" / "screenshots"

DIAGRAMS = [
    "system_architecture.html",
    "functional_block_diagram.html",
    "algorithm_mapping.html",
    "algorithm_fsm_combat_resolution.html",
    "algorithm_fsm_adaptive_difficulty.html",
    "algorithm_dataflow_metrics.html",
    "interface_dependency_graph.html",
]


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        for diagram in DIAGRAMS:
            html_path = DIAGRAMS_DIR / diagram
            png_name = Path(diagram).stem + ".png"
            out_path = OUTPUT_DIR / png_name

            print(f"  {diagram} -> {png_name} ...", end=" ", flush=True)
            page.goto(f"file://{html_path}")
            page.wait_for_timeout(2000)  # let JS render
            page.screenshot(path=str(out_path), full_page=True)
            size_kb = out_path.stat().st_size / 1024
            print(f"{size_kb:.0f} KB")

        browser.close()

    print(f"\nAll screenshots saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
