"""Generate charts for the 10.6 integration-test section from report.xml."""

import collections
import os
import xml.etree.ElementTree as ET

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.join(HERE, "report.xml")
OUT = os.path.join(HERE, "..", "res", "integration_charts")

PASS_COLOR = "#2e7d32"
FAIL_COLOR = "#c62828"
ACCENT = "#1565c0"

LABELS = {
    "test_auth": "Authentification",
    "test_catalog": "Catalogues",
    "test_guards": "Sécurité / garde-fous",
    "test_health": "Santé de la pile",
    "test_reservation_payment": "Réservation / paiement",
}


def load():
    root = ET.parse(REPORT).getroot()
    rows = []
    for case in root.iter("testcase"):
        failed = case.find("failure") is not None or case.find("error") is not None
        rows.append(
            {
                "suite": case.get("classname"),
                "name": case.get("name"),
                "time": float(case.get("time")),
                "failed": failed,
            }
        )
    return rows


def by_suite(rows):
    order = list(dict.fromkeys(row["suite"] for row in rows))
    stats = collections.OrderedDict()
    for suite in order:
        subset = [row for row in rows if row["suite"] == suite]
        stats[suite] = {
            "passed": sum(1 for row in subset if not row["failed"]),
            "failed": sum(1 for row in subset if row["failed"]),
            "time": sum(row["time"] for row in subset),
            "total": len(subset),
        }
    return stats


def chart_overall(rows, out):
    passed = sum(1 for row in rows if not row["failed"])
    failed = len(rows) - passed
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    ax.pie(
        [passed, failed],
        labels=[f"Réussis\n{passed}", f"Échecs\n{failed}"],
        colors=[PASS_COLOR, FAIL_COLOR],
        autopct="%1.1f %%",
        startangle=90,
        counterclock=False,
        wedgeprops={"width": 0.42, "edgecolor": "white"},
        textprops={"fontsize": 12},
    )
    ax.text(0, 0, f"{passed}/{len(rows)}", ha="center", va="center", fontsize=20, fontweight="bold")
    ax.set_title("Résultat global des 46 tests d'intégration", fontsize=13, pad=14)
    ax.set_aspect("equal")
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)


def chart_by_suite(stats, out):
    suites = list(stats)
    labels = [LABELS.get(s, s) for s in suites]
    passed = [stats[s]["passed"] for s in suites]
    failed = [stats[s]["failed"] for s in suites]
    fig, ax = plt.subplots(figsize=(8.4, 4.6))
    y = range(len(suites))[::-1]
    bars_p = ax.barh(list(y), passed, color=PASS_COLOR, label="Réussis")
    bars_f = ax.barh(list(y), failed, left=passed, color=FAIL_COLOR, label="Échecs")
    ax.set_yticks(list(y))
    ax.set_yticklabels(labels, fontsize=10)
    ax.set_xlabel("Nombre de tests", fontsize=10)
    ax.set_title("Résultats par suite d'intégration", fontsize=13, pad=12)
    ax.set_xlim(0, max(p + f for p, f in zip(passed, failed)) + 3)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.14), ncol=2, frameon=False)
    ax.grid(axis="x", linestyle=":", alpha=0.5)
    ax.set_axisbelow(True)
    for bars, values, offset in ((bars_p, passed, 0),):
        for bar in bars:
            w = bar.get_width()
            ax.text(w / 2, bar.get_y() + bar.get_height() / 2, int(w), ha="center", va="center", color="white", fontsize=9, fontweight="bold")
    for bar, total in zip(bars_f, [p + f for p, f in zip(passed, failed)]):
        if bar.get_width():
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_y() + bar.get_height() / 2, int(bar.get_width()), ha="center", va="center", color="white", fontsize=9, fontweight="bold")
    for yi, total in zip(y, [p + f for p, f in zip(passed, failed)]):
        ax.text(total + 0.25, yi, f"{total} tests", va="center", fontsize=9, color="#444")
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)


def chart_duration(stats, out):
    suites = list(stats)
    labels = [LABELS.get(s, s) for s in suites]
    totals = [stats[s]["time"] for s in suites]
    fig, ax = plt.subplots(figsize=(8.4, 4.4))
    y = range(len(suites))[::-1]
    bars = ax.barh(list(y), totals, color=ACCENT)
    ax.set_yticks(list(y))
    ax.set_yticklabels(labels, fontsize=10)
    ax.set_xlabel("Durée cumulée (secondes)", fontsize=10)
    ax.set_title("Temps d'exécution par suite (total 12,5 s)", fontsize=13, pad=12)
    ax.grid(axis="x", linestyle=":", alpha=0.5)
    ax.set_axisbelow(True)
    for bar in bars:
        ax.text(bar.get_width() + 0.05, bar.get_y() + bar.get_height() / 2, f"{bar.get_width():.2f} s", va="center", fontsize=9)
    ax.set_xlim(0, max(totals) * 1.18)
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)


def main():
    os.makedirs(OUT, exist_ok=True)
    rows = load()
    stats = by_suite(rows)
    chart_overall(rows, os.path.join(OUT, "01_resultat_global.png"))
    chart_by_suite(stats, os.path.join(OUT, "02_resultats_par_suite.png"))
    chart_duration(stats, os.path.join(OUT, "03_duree_par_suite.png"))
    for name in sorted(os.listdir(OUT)):
        print(os.path.join(OUT, name))


if __name__ == "__main__":
    main()
